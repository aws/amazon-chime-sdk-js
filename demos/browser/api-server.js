// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { ChimeSDKMediaPipelines } = require('@aws-sdk/client-chime-sdk-media-pipelines');
const { ChimeSDKMeetings } = require('@aws-sdk/client-chime-sdk-meetings');
const { Ivs } = require('@aws-sdk/client-ivs');
const { STS } = require('@aws-sdk/client-sts');

const compression = require('compression');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { v4: uuidv4 } = require('uuid');

const { ensureCaptureBucket } = require('./captureBucket.js');
const cspString = require('./csp.js');
const {
  MEETING_ID_FORMAT,
  BadRequestError,
  createMeetingRequest,
  transcriptionConfiguration,
  requireCapabilities,
  liveConnectorRequest,
} = require('./meetingRequests.js');

// Store created meetings in a map so attendees can join by meeting title.
const meetingTable = new Map();
// In-flight meeting creations by title, so concurrent first joins of a title share one meeting.
const pendingCreates = new Map();

const REGION_FORMAT = /^[a-z]{2}(-gov)?-[a-z]+-\d$/;

// Loopback names plus ALLOWED_HOSTS (comma-separated hostnames, e.g. a tunnel or reverse proxy; ports ignored).
const allowedHosts = new Set(
  ['localhost', '127.0.0.1', '[::1]', ...(process.env.ALLOWED_HOSTS || '').split(',')]
    .map(hostnameOf)
    .filter(Boolean)
);

// The hostname of a Host header value, without the port: "[::1]:8081" -> "[::1]".
function hostnameOf(host) {
  const match = /^(\[[^\]]*\]|[^:]*)(?::\d*)?$/.exec((host || '').trim());
  return match ? match[1].toLowerCase() : '';
}

// Looks up a meeting by title and fails with a clear message instead of a TypeError.
function requireMeeting(title) {
  const meeting = title && meetingTable.get(title);
  if (!meeting) {
    throw new BadRequestError(`Unknown meeting: ${title}`);
  }
  return meeting;
}

// Returns the table entry for `title`, or waits for an in-flight creation of the same title, or
// runs `create` and stores its result. Concurrent callers for one title get the same meeting.
async function findOrCreateMeeting(title, create) {
  const known = meetingTable.get(title);
  if (known) {
    return known;
  }
  let pending = pendingCreates.get(title);
  if (!pending) {
    pending = (async () => {
      try {
        const meeting = await create();
        meetingTable.set(title, meeting);
        return meeting;
      } finally {
        if (pendingCreates.get(title) === pending) {
          pendingCreates.delete(title);
        }
      }
    })();
    pendingCreates.set(title, pending);
  }
  return pending;
}

// In-flight pipeline starts by meeting ID and kind, so concurrent starts for one meeting share one pipeline.
const pendingPipelines = new Map();

// Returns the pipeline recorded on the meeting entry under `kind` ('Capture' or 'LiveConnector'),
// or waits for a start of it already in flight, or runs `create` and records its result.
// `created` is true only for the request whose `create` ran.
async function startPipelineOnce(meeting, kind, create) {
  if (meeting[kind]) {
    return { pipeline: meeting[kind], created: false };
  }
  const key = `${meeting.Meeting.MeetingId}/${kind}`;
  if (pendingPipelines.has(key)) {
    return { pipeline: await pendingPipelines.get(key), created: false };
  }
  const pending = (async () => {
    try {
      meeting[kind] = await create();
      return meeting[kind];
    } finally {
      pendingPipelines.delete(key);
    }
  })();
  pendingPipelines.set(key, pending);
  return { pipeline: await pending, created: true };
}

// An IVS channel for one broadcast. The RTMP URL carries the stream key: never log or return it.
async function createIvsChannel(mediaRegion) {
  const { channel, streamKey } = await ivs.createChannel({ name: `liveConnector-${mediaRegion}` });
  console.info(`Created IVS channel ${channel.arn}`);
  return {
    arn: channel.arn,
    playbackUrl: channel.playbackUrl,
    rtmpUrl: `rtmps://${channel.ingestEndpoint}:443/app/${streamKey.value}`,
  };
}

// IVS refuses to delete a channel while it is live, which it stays for a while after its pipeline stops.
async function deleteIvsChannel(arn) {
  for (let attempt = 1; ; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
      await ivs.deleteChannel({ arn });
      console.info(`Deleted IVS channel ${arn} (attempt ${attempt})`);
      return;
    } catch (error) {
      if (error.name !== 'ConflictException' || attempt === 20) {
        console.warn(`Could not delete IVS channel ${arn}: ${error.name}`);
        return;
      }
    }
  }
}

// Stopping when nothing is running (or the pipeline already ended) succeeds.
async function stopLiveConnector(meeting) {
  if (!meeting.LiveConnector) {
    return;
  }
  const { MediaPipelineId, channelArn } = meeting.LiveConnector;
  try {
    await chimeSDKMediaPipelines.deleteMediaPipeline({ MediaPipelineId });
  } catch (error) {
    if (error.name !== 'NotFoundException') {
      throw error;
    }
  }
  meeting.LiveConnector = undefined;
  if (channelArn) {
    // In the background: the channel can take a while to go offline.
    void deleteIvsChannel(channelArn);
  }
}

// Removes the table entry for `title` only if it is still `meeting`, so a request that read an
// entry before an await cannot delete the newer meeting another request stored meanwhile.
function forgetMeeting(title, meeting) {
  if (meetingTable.get(title) === meeting) {
    meetingTable.delete(title);
  }
}

// HTTP status for an error thrown while handling a request.
function errorStatus(err) {
  if (err instanceof BadRequestError) {
    return 400;
  }
  if (err.name === 'CaptureBucketUnavailableError') {
    return 409;
  }
  const status = err.$metadata?.httpStatusCode;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

// Creates the meeting a first /join of query.title asks for, or adopts an existing meeting when
// the title is itself a meeting ID.
async function createMeeting(query, primaryMeeting) {
  let meeting;
  try {
    if (MEETING_ID_FORMAT.test(query.title)) {
      meeting = await chimeSDKMeetings.getMeeting({
        MeetingId: query.title
      });
    }
  } catch (error) {
    console.info("Meeting ID doesn't exist as a conference ID: " + error);
  }
  if (meeting) {
    return meeting;
  }

  const request = createMeetingRequest(query, primaryMeeting, uuidv4());
  console.info('Creating new meeting: ' + JSON.stringify(request));
  meeting = await chimeSDKMeetings.createMeeting(request);
  console.info(`Created new meeting ${meeting.Meeting.MeetingId} in ${meeting.Meeting.MediaRegion}`);

  // Extend meeting with primary external meeting ID if it exists
  if (primaryMeeting !== undefined) {
    meeting.Meeting.PrimaryExternalMeetingId = primaryMeeting.Meeting.ExternalMeetingId;
  }
  return meeting;
}

// Load the contents of the web application to be used as the index page.
const app = process.env.APP || 'meetingV2';
const indexPagePath = `dist/${app}.html`;

console.info('Using index path', indexPagePath);

let indexPage;
try {
  indexPage = fs.readFileSync(indexPagePath);
} catch {
  // dist may not exist when running via the Vite dev server — that's fine,
  // Vite serves the HTML directly and proxies API requests here.
  indexPage = '';
}

const currentRegion = process.env.REGION || 'us-east-1';

const chimeSDKMediaPipelines = new ChimeSDKMediaPipelines({
  region: 'us-east-1',
  endpoint: process.env.CHIME_SDK_MEDIA_PIPELINES_ENDPOINT || "https://media-pipelines-chime.us-east-1.amazonaws.com" });

const chimeSDKMeetings = new ChimeSDKMeetings({
  region: currentRegion,
  ...(process.env.ENDPOINT && { endpoint: process.env.ENDPOINT }) });

const sts = new STS({ region: 'us-east-1' });

// Recording and broadcasting work without setup: each media Region gets a capture bucket the first
// time someone records there (captureBucket.js), and each broadcast gets its own IVS channel, as in
// the serverless demo. CAPTURE_S3_DESTINATION (an S3 ARN) and IVS_ENDPOINT (an RTMP URL) override them.
const captureS3Destination = process.env.CAPTURE_S3_DESTINATION;
if (captureS3Destination) {
  console.info(`S3 destination for capture is ${captureS3Destination}`)
}

const ivsEndpoint = process.env.IVS_ENDPOINT;
if (ivsEndpoint) {
  // The RTMP URL carries the IVS stream key, so log only its host.
  let ivsHost;
  try {
    ivsHost = new URL(ivsEndpoint).host;
  } catch {
    ivsHost = 'not a valid URL';
  }
  console.info(`IVS destination for live connector is ${ivsHost}`)
}
const ivs = new Ivs({ region: currentRegion });

function serve(host = '127.0.0.1:8080') {
  // Start an HTTP server to serve the index page and handle meeting actions
  http.createServer({}, async (request, response) => {
    // Refuse other Host names so a DNS-rebinding page cannot reach this API same-origin.
    if (!allowedHosts.has(hostnameOf(request.headers.host))) {
      log(`${request.method} ${request.url} rejected: Host ${JSON.stringify(request.headers.host)} is not allowed`);
      respond(response, 403, 'application/json', JSON.stringify({ error: 'Host not allowed' }), true);
      return;
    }
    log(`${request.method} ${request.url} BEGIN`);
    try {
      // Enable HTTP compression
      compression({})(request, response, () => {});
      const requestUrl = url.parse(request.url, true);
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        // Return the contents of the index page
        respond(response, 200, 'text/html', indexPage);
      } else if (process.env.DEBUG === '1') {
        // For internal debugging - ignore this. Exactly '1', so the `debug` package's DEBUG=<pattern> does not trigger it.
        const debug = require('./debug.js');
        const debugResponse = await debug.debug(request);
        respond(response, debugResponse.status, 'application/json', JSON.stringify(debugResponse.response, null, 2));
      } else if (request.method === 'GET' && requestUrl.pathname === '/meeting') {
        // Lets the join screen say whether it will join an existing meeting or create one. Never
        // creates anything; also drops a table entry whose meeting has since ended.
        const title = requestUrl.query.title;
        const known = title && meetingTable.get(title);
        const meetingId = known ? known.Meeting.MeetingId : MEETING_ID_FORMAT.test(title || '') ? title : undefined;
        let found;
        if (meetingId) {
          try {
            found = await chimeSDKMeetings.getMeeting({ MeetingId: meetingId });
          } catch (error) {
            if (error.name !== 'NotFoundException') {
              throw error;
            }
            if (known) {
              forgetMeeting(title, known);
            }
          }
        }
        respond(response, 200, 'application/json', JSON.stringify({
          exists: !!found,
          mediaRegion: found ? found.Meeting.MediaRegion : undefined,
          capturing: !!(found && known && known.Capture),
          broadcasting: !!(found && known && known.LiveConnector),
        }));
      } else if (request.method === 'POST' && requestUrl.pathname === '/join') {
        const title = requestUrl.query.title;
        if (!title || !requestUrl.query.name) {
          respond(response, 400, 'application/json', JSON.stringify({ error: 'Need parameters: title and name' }));
          return;
        }
        let meeting = meetingTable.get(title);
        if (meeting) {
          // Meetings end on their own a few minutes after the last attendee leaves; a stale entry
          // would make every later join of that title fail, so check before reusing it.
          try {
            await chimeSDKMeetings.getMeeting({ MeetingId: meeting.Meeting.MeetingId });
          } catch (error) {
            if (error.name !== 'NotFoundException') {
              throw error;
            }
            console.info(`Meeting ${meeting.Meeting.MeetingId} for "${title}" has ended; creating a new one`);
            forgetMeeting(title, meeting);
            // Another join may have replaced the entry while this one was checking.
            meeting = meetingTable.get(title);
          }
        }

        let primaryMeeting = undefined
        if (requestUrl.query.primaryExternalMeetingId) {
          primaryMeeting = meetingTable.get(requestUrl.query.primaryExternalMeetingId)
          if (primaryMeeting) {
            console.info(`Retrieved primary meeting ID ${primaryMeeting.Meeting.MeetingId} for external meeting ID ${requestUrl.query.primaryExternalMeetingId}`)
          } else if (MEETING_ID_FORMAT.test(requestUrl.query.primaryExternalMeetingId)) {
            // Just in case, check if we were passed a regular meeting ID instead of an external ID
            try {
              primaryMeeting = await chimeSDKMeetings.getMeeting({
                MeetingId: requestUrl.query.primaryExternalMeetingId
              });
              if (primaryMeeting !== undefined) {
                console.info(`Retrieved primary meeting id ${primaryMeeting.Meeting.MeetingId}`);
                meetingTable.set(requestUrl.query.primaryExternalMeetingId, primaryMeeting);
              }
            } catch (error) {
              console.info("Meeting ID doesnt' exist as a conference ID: " + error);
            }
          }
          if (!primaryMeeting) {
            respond(response, 400, 'application/json', JSON.stringify({ error: 'Primary meeting has not been created' }));
            return;
          }
        }

        if (!meeting) {
          // A join that will wait for another join's in-flight create does not need a region.
          if (!pendingCreates.has(title) && !meetingTable.has(title) && !REGION_FORMAT.test(requestUrl.query.region || '')) {
            respond(response, 400, 'application/json', JSON.stringify({ error: 'Need a valid region parameter if meeting has not yet been created' }));
            return;
          }
          meeting = await findOrCreateMeeting(title, () => createMeeting(requestUrl.query, primaryMeeting));
        }

        const createAttendeeRequest = {
          // The meeting ID of the created meeting to add the attendee to
          MeetingId: meeting.Meeting.MeetingId,

          // Any user ID you wish to associate with the attendeee.
          // For simplicity here, we use a random id for uniqueness
          // combined with the name the user provided, which can later
          // be used to help build the roster.
          ExternalUserId: `${uuidv4().substring(0, 8)}#${requestUrl.query.name}`.substring(0, 64),
        };

        if (
          requestUrl.query.attendeeAudioCapability &&
          !requestUrl.query.primaryExternalMeetingId
        ) {
          createAttendeeRequest.Capabilities = requireCapabilities({
            audioCapability: requestUrl.query.attendeeAudioCapability,
            videoCapability: requestUrl.query.attendeeVideoCapability,
            contentCapability: requestUrl.query.attendeeContentCapability,
          });
        }

       // Create new attendee for the meeting
       const attendee = await chimeSDKMeetings.createAttendee(createAttendeeRequest);

        // Return the meeting and attendee responses. The client will use these
        // to join the meeting.
        let joinResponse = {
          JoinInfo: {
            Meeting: meeting,
            Attendee: attendee,
          },
        }
        if (meeting.Meeting.PrimaryExternalMeetingId !== undefined) {
          // Put this where it expects it, since it is not technically part of create meeting response
          joinResponse.JoinInfo.PrimaryExternalMeetingId = meeting.Meeting.PrimaryExternalMeetingId;
        }
        // Join tokens are credentials: do not log the response body.
        respond(response, 201, 'application/json', JSON.stringify(joinResponse, null, 2), true);
      } else if (request.method === 'POST' && requestUrl.pathname === '/end') {
        // End the meeting. All attendee connections will hang up.
        const meeting = requireMeeting(requestUrl.query.title);
        await chimeSDKMeetings.deleteMeeting({
          MeetingId: meeting.Meeting.MeetingId,
        });
        // Ending the meeting stops its pipelines but would leave the broadcast's IVS channel.
        await stopLiveConnector(meeting).catch(error => console.warn(`Could not stop the broadcast: ${error.name}`));
        forgetMeeting(requestUrl.query.title, meeting);
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/startCapture') {
        const meeting = requireMeeting(requestUrl.query.title);
        // A second Record press or a retried request gets the running pipeline, not another one.
        const { pipeline, created } = await startPipelineOnce(meeting, 'Capture', async () => {
          const callerInfo = await sts.getCallerIdentity();
          // The meeting's own Region keeps its recording there.
          const sinkArn =
            captureS3Destination ??
            `arn:aws:s3:::${await ensureCaptureBucket({
              accountId: callerInfo.Account,
              region: meeting.Meeting.MediaRegion,
            })}/api-server/${meeting.Meeting.MeetingId}/`;
          const pipelineInfo = await chimeSDKMediaPipelines.createMediaCapturePipeline({
            SourceType: "ChimeSdkMeeting",
            SourceArn: `arn:aws:chime::${callerInfo.Account}:meeting:${meeting.Meeting.MeetingId}`,
            SinkType: "S3Bucket",
            SinkArn: sinkArn,
          });
          return pipelineInfo.MediaCapturePipeline;
        });
        respond(response, created ? 201 : 200, 'application/json', JSON.stringify({ MediaCapturePipeline: pipeline }));
      } else if (request.method === 'POST' && requestUrl.pathname === '/startLiveConnector') {
        const meeting = requireMeeting(requestUrl.query.title);
        const { pipeline, created } = await startPipelineOnce(meeting, 'LiveConnector', async () => {
          const callerInfo = await sts.getCallerIdentity()
          const channel = ivsEndpoint ? undefined : await createIvsChannel(meeting.Meeting.MediaRegion);
          let liveConnectorPipelineInfo;
          try {
            liveConnectorPipelineInfo = await chimeSDKMediaPipelines.createMediaLiveConnectorPipeline(
              liveConnectorRequest(callerInfo.Account, meeting.Meeting.MeetingId, channel ? channel.rtmpUrl : ivsEndpoint)
            );
          } catch (error) {
            if (channel) {
              await deleteIvsChannel(channel.arn);
            }
            throw error;
          }
          // Keep no stream key: the pipeline's sink URL carries it, and /join returns this table
          // entry to every attendee.
          return {
            MediaPipelineId: liveConnectorPipelineInfo.MediaLiveConnectorPipeline.MediaPipelineId,
            playBackUrl: channel?.playbackUrl,
            channelArn: channel?.arn,
          };
        });
        respond(response, created ? 201 : 200, 'application/json', JSON.stringify({
          MediaPipelineId: pipeline.MediaPipelineId,
          playBackUrl: pipeline.playBackUrl,
        }), true);
      } else if (request.method === 'POST' && requestUrl.pathname === '/endLiveConnector') {
        await stopLiveConnector(requireMeeting(requestUrl.query.title));
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/endCapture') {
        const meeting = requireMeeting(requestUrl.query.title);
        // Stopping when nothing is running (or the pipeline already ended) succeeds.
        if (meeting.Capture) {
          try {
            await chimeSDKMediaPipelines.deleteMediaCapturePipeline({
              MediaPipelineId: meeting.Capture.MediaPipelineId
            });
          } catch (error) {
            if (error.name !== 'NotFoundException') {
              throw error;
            }
          }
          meeting.Capture = undefined;
        }
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/start_transcription') {
        const configuration = transcriptionConfiguration(requestUrl.query);
        if (!configuration) {
          respond(response, 400, 'application/json', JSON.stringify({ error: 'Unknown transcription engine' }));
          return;
        }
        await chimeSDKMeetings.startMeetingTranscription({
          MeetingId: requireMeeting(requestUrl.query.title).Meeting.MeetingId,
          TranscriptionConfiguration: configuration
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/stop_transcription') {
        await chimeSDKMeetings.stopMeetingTranscription({
          MeetingId: requireMeeting(requestUrl.query.title).Meeting.MeetingId
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'GET' && requestUrl.pathname === '/fetch_credentials' && app === 'messagingSession') {
        // Used by the messaging demo, which calls Chime SDK Messaging from the browser. Served only
        // when that app is the one running, and only same-origin pages can read it now that
        // responses carry no CORS allow-origin header.
        const awsCredentials = await chimeSDKMeetings.config.credentials();
        respond(response, 200, 'application/json', JSON.stringify(awsCredentials), true);
      } else if (request.method === 'GET' && (requestUrl.pathname === '/audio_file' || requestUrl.pathname === '/stereo_audio_file')) {
        let filePath = 'dist/speech.mp3';
        if (requestUrl.pathname === '/stereo_audio_file') {
          filePath = 'dist/speech_stereo.mp3';
        }
        fs.readFile(filePath, { encoding: 'base64' }, function (err, data) {
          if (err) {
            log(`Error reading audio file ${filePath}: ${err}`)
            respond(response, 404, 'application/json', JSON.stringify({}));
            return;
          }
          respond(response, 200, 'audio/mpeg', data);
        });
      } else if (request.method === 'POST' && requestUrl.pathname === '/update_attendee_capabilities') {
        await chimeSDKMeetings
          .updateAttendeeCapabilities({
            MeetingId: requireMeeting(requestUrl.query.title).Meeting.MeetingId,
            AttendeeId: requestUrl.query.attendeeId,
            Capabilities: requireCapabilities(requestUrl.query),
          });
        // The AWS response carries the attendee's join token; the client needs nothing back.
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/batch_update_attendee_capabilities_except') {
        const data = await chimeSDKMeetings
          .batchUpdateAttendeeCapabilitiesExcept({
            MeetingId: requireMeeting(requestUrl.query.title).Meeting.MeetingId,
            ExcludedAttendeeIds: (requestUrl.query.attendeeIds || '').split(',').filter(Boolean).map((attendeeId) => {
              return { AttendeeId: attendeeId };
            }),
            Capabilities: requireCapabilities(requestUrl.query),
          });
        respond(response, 200, 'application/json', JSON.stringify(data));
      } else if (request.method === 'GET' && requestUrl.pathname === '/get_attendee') {
        const { Attendee } = await chimeSDKMeetings
          .getAttendee({
            MeetingId: requireMeeting(requestUrl.query.title).Meeting.MeetingId,
            AttendeeId: requestUrl.query.id,
          });
        // Never return (or log) the join token: any participant can ask about any attendee.
        respond(response, 200, 'application/json', JSON.stringify({
          Attendee: {
            AttendeeId: Attendee.AttendeeId,
            ExternalUserId: Attendee.ExternalUserId,
            Capabilities: Attendee.Capabilities,
          },
        }));
      } else {
        respond(response, 404, 'text/html', '404 Not Found');
      }
    } catch (err) {
      const status = errorStatus(err);
      if (err instanceof BadRequestError) {
        log(`${request.method} ${request.url} rejected: ${err.message}`);
      } else {
        console.error(`${request.method} ${request.url} failed with ${status}:`, err);
      }
      // A 403 or 5xx message can name the account and role (IAM denials), so send only its name.
      const message = status === 403 || status >= 500 ? err.name || 'InternalError' : err.message;
      respond(response, status, 'application/json', JSON.stringify({ error: message }, null, 2));
    }
    log(`${request.method} ${request.url} END`);
  }).listen(host.split(':')[1], host.split(':')[0], () => {
    log(`server running at http://${host}/`);
  });
}

function log(message) {
  console.log(`${new Date().toISOString()} ${message}`);
}

function respond(response, statusCode, contentType, body, skipLogging = false) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', contentType);
  if (contentType === 'text/html') {
    // The policy the Vite dev server sends, so the built page runs under it too.
    response.setHeader('Content-Security-Policy', cspString);
  }
  // enable shared array buffer for videoFxProcessor
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // enable shared array buffer for videoFxProcessor
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  response.end(body);
  if (contentType === 'application/json' && !skipLogging) {
    log(body);
  }
}

module.exports = { serve };
