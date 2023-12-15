// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { ChimeSDKMediaPipelines } = require('@aws-sdk/client-chime-sdk-media-pipelines');
const { ChimeSDKMeetings } = require('@aws-sdk/client-chime-sdk-meetings');
const { STS } = require('@aws-sdk/client-sts');

const compression = require('compression');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { v4: uuidv4 } = require('uuid');

// Store created meetings in a map so attendees can join by meeting title.
const meetingTable = {};

// Load the contents of the web application to be used as the index page.
const app = process.env.npm_config_app || 'meetingV2';
const indexPagePath = `dist/${app}.html`;

console.info('Using index path', indexPagePath);

const indexPage = fs.readFileSync(indexPagePath);

const currentRegion = process.env.REGION || 'us-east-1';

const chimeSDKMediaPipelines = new ChimeSDKMediaPipelines({ region: 'us-east-1' });
chimeSDKMediaPipelines.endpoint = process.env.CHIME_SDK_MEDIA_PIPELINES_ENDPOINT || "https://media-pipelines-chime.us-east-1.amazonaws.com"

const chimeSDKMeetings = new ChimeSDKMeetings({ region: currentRegion });
if (process.env.ENDPOINT) {
  chimeSDKMeetings.endpoint = process.env.ENDPOINT
}

const sts = new STS({ region: 'us-east-1' });

const captureS3Destination = process.env.CAPTURE_S3_DESTINATION;
if (captureS3Destination) {
  console.info(`S3 destination for capture is ${captureS3Destination}`)
} else {
  console.info(`S3 destination for capture not set.  Cloud media capture will not be available.`)
}

const ivsEndpoint = process.env.IVS_ENDPOINT;
if (ivsEndpoint) {
  console.info(`IVS destination for live connector is ${ivsEndpoint}`)
} else {
  console.info(`IVS destination for live connector not set. Live Connector will not be available.`)
}

function serve(host = '127.0.0.1:8080') {
  // Start an HTTP server to serve the index page and handle meeting actions
  http.createServer({}, async (request, response) => {
    log(`${request.method} ${request.url} BEGIN`);
    try {
      // Enable HTTP compression
      compression({})(request, response, () => {});
      const requestUrl = url.parse(request.url, true);
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        // Return the contents of the index page
        respond(response, 200, 'text/html', indexPage);
      } else if (process.env.DEBUG) {
        // For internal debugging - ignore this
        const debug = require('./debug.js');
        const debugResponse = debug.debug(request);
        respond(response, debugResponse.status, 'application/json', JSON.stringify(debugResponse.response, null, 2));
      } else if (request.method === 'POST' && requestUrl.pathname === '/join') {
        if (!requestUrl.query.title || !requestUrl.query.name) {
          respond(response, 400, 'application/json', JSON.stringify({ error: 'Need parameters: title and name' }));
        }
        const meetingIdFormat = /^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/
        let meeting = meetingTable[requestUrl.query.title];

        let primaryMeeting = undefined
        if (requestUrl.query.primaryExternalMeetingId) {
          primaryMeeting = meetingTable[requestUrl.query.primaryExternalMeetingId]
          if (primaryMeeting) {
            console.info(`Retrieved primary meeting ID ${primaryMeeting.Meeting.MeetingId} for external meeting ID ${requestUrl.query.primaryExternalMeetingId}`)
          } else if (meetingIdFormat.test(requestUrl.query.primaryExternalMeetingId)) {
            // Just in case, check if we were passed a regular meeting ID instead of an external ID
            try {
              primaryMeeting = await chimeSDKMeetings.getMeeting({
                MeetingId: requestUrl.query.primaryExternalMeetingId
              });
              if (primaryMeeting !== undefined) {
                console.info(`Retrieved primary meeting id ${primaryMeeting.Meeting.MeetingId}`);
                meetingTable[requestUrl.query.primaryExternalMeetingId] = primaryMeeting;
              }
            } catch (error) {
              console.info("Meeting ID doesnt' exist as a conference ID: " + error);
            }
          }
          if (!primaryMeeting) {
            respond(response, 400, 'application/json', JSON.stringify({ error: 'Primary meeting has not been created' }));
          }
        }

        if (!meeting) {
          if (!requestUrl.query.region) {
            respond(response, 400, 'application/json', JSON.stringify({ error: 'Need region parameter set if meeting has not yet been created' }));
          }
          // If the meeting does not exist, check if we were passed in a meeting ID instead of an external meeting ID.  If so, use that one
          try {
            if (meetingIdFormat.test(requestUrl.query.title)) {
              meeting = await chimeSDKMeetings.getMeeting({
                MeetingId: requestUrl.query.title
              });
            }
          } catch (error) {
            console.info("Meeting ID doesn't exist as a conference ID: " + error);
          }

          // If still no meeting, create one
          if (!meeting) {
            let request = {
              // Use a UUID for the client request token to ensure that any request retries
              // do not create multiple meetings.
              ClientRequestToken: uuidv4(),
              // Specify the media region (where the meeting is hosted).
              // In this case, we use the region selected by the user.
              MediaRegion: requestUrl.query.region,
              // Any meeting ID you wish to associate with the meeting.
              // For simplicity here, we use the meeting title.
              ExternalMeetingId: requestUrl.query.title.substring(0, 64),
            };
            if (primaryMeeting !== undefined) {
              request.PrimaryMeetingId = primaryMeeting.Meeting.MeetingId;
            }
            if (requestUrl.query.ns_es === 'true' || 
                  requestUrl.query.v_rs === 'FHD' || 
                  requestUrl.query.v_rs === 'None' || 
                  requestUrl.query.c_rs === 'UHD' ||
                  requestUrl.query.c_rs === 'None' ||
                  requestUrl.query.a_cnt > 1 && requestUrl.query.a_cnt <= 250) {
              request.MeetingFeatures = {};
              if (requestUrl.query.ns_es === 'true') {
                request.MeetingFeatures.Audio = {
                  EchoReduction: 'AVAILABLE'
                }
              }
              if (requestUrl.query.v_rs === 'FHD' || requestUrl.query.v_rs === 'None') {
                request.MeetingFeatures.Video = {
                  MaxResolution: requestUrl.query.v_rs
                }
              }
              if (requestUrl.query.c_rs === 'UHD' || requestUrl.query.c_rs === 'None') {
                request.MeetingFeatures.Content = {
                  MaxResolution: requestUrl.query.c_rs
                }
              }
              if (requestUrl.query.a_cnt > 1 && requestUrl.query.a_cnt <= 250) {
                request.MeetingFeatures.Attendee = {
                  MaxCount: Number(requestUrl.query.a_cnt)
                }
              }
            }
            console.info('Creating new meeting: ' + JSON.stringify(request));
            meeting = await chimeSDKMeetings.createMeeting(request);
            console.info('Created new meeting: ' + JSON.stringify(meeting));

            // Extend meeting with primary external meeting ID if it exists
            if (primaryMeeting !== undefined) {
              meeting.Meeting.PrimaryExternalMeetingId = primaryMeeting.Meeting.ExternalMeetingId;
            }
          }

          // Store the meeting in the table using the meeting title as the key.
          meetingTable[requestUrl.query.title] = meeting;
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
          createAttendeeRequest.Capabilities = {
            Audio: requestUrl.query.attendeeAudioCapability,
            Video: requestUrl.query.attendeeVideoCapability,
            Content: requestUrl.query.attendeeContentCapability,
          };
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
        respond(response, 201, 'application/json', JSON.stringify(joinResponse, null, 2));
      } else if (request.method === 'POST' && requestUrl.pathname === '/end') {
        // End the meeting. All attendee connections will hang up.
        await chimeSDKMeetings.deleteMeeting({
          MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/startCapture') {
        if (captureS3Destination) {
          const callerInfo = await sts.getCallerIdentity();
          pipelineInfo = await chimeSDKMediaPipelines.createMediaCapturePipeline({
            SourceType: "ChimeSdkMeeting",
            SourceArn: `arn:aws:chime::${callerInfo.Account}:meeting:${meetingTable[requestUrl.query.title].Meeting.MeetingId}`,
            SinkType: "S3Bucket",
            SinkArn: captureS3Destination,
          });
          meetingTable[requestUrl.query.title].Capture = pipelineInfo.MediaCapturePipeline;
          respond(response, 201, 'application/json', JSON.stringify(pipelineInfo));
        } else {
          console.warn("Cloud media capture not available")
          respond(response, 500, 'application/json', JSON.stringify({}))
        }
      } else if (request.method === 'POST' && requestUrl.pathname === '/startLiveConnector') {
        if (ivsEndpoint) {
          try {
            const callerInfo = await sts.getCallerIdentity()
            liveConnectorPipelineInfo = await chimeSDKMediaPipelines.createMediaLiveConnectorPipeline({
              Sinks: [
                {
                  RTMPConfiguration: {
                    AudioChannels: "Stereo",
                    AudioSampleRate: "48000",
                    Url: ivsEndpoint
                  },
                  SinkType: "RTMP"
                }
              ],
              Sources: [
                {
                  ChimeSdkMeetingLiveConnectorConfiguration: {
                    Arn: `arn:aws:chime::${callerInfo.Account}:meeting:${meetingTable[requestUrl.query.title].Meeting.MeetingId}`,
                    CompositedVideo: {
                      GridViewConfiguration: {
                        ContentShareLayout: "Vertical",
                      },
                      Layout: "GridView",
                      Resolution: "FHD",
                    },
                    MuxType: "AudioWithCompositedVideo"
                  },
                  SourceType: "ChimeSdkMeeting"
                }
              ]
            });
            meetingTable[requestUrl.query.title].LiveConnector = liveConnectorPipelineInfo.MediaLiveConnectorPipeline;
            respond(response, 201, 'application/json', JSON.stringify(liveConnectorPipelineInfo));
          }
          catch (err) {
            respond(response, 500, 'application/json', JSON.stringify({ error: err.message }, null, 2));
          }
        } else {
          console.warn("Live Connector not available")
          respond(response, 500, 'application/json', JSON.stringify({}))
        }
      } else if (request.method === 'POST' && requestUrl.pathname === '/endLiveConnector') {
        if (ivsEndpoint) {
          liveConnectorPipelineId = meetingTable[requestUrl.query.title].LiveConnector.MediaPipelineId;
          liveConnectorPipelineInfo = await chimeSDKMediaPipelines.deleteMediaPipeline({
            MediaPipelineId: liveConnectorPipelineId
          });
          meetingTable[requestUrl.query.title].LiveConnector = undefined;
          respond(response, 200, 'application/json', JSON.stringify(liveConnectorPipelineInfo));
        } else {
          console.warn("Live Connector not available")
          respond(response, 500, 'application/json', JSON.stringify({}))
        }
      }
      else if (request.method === 'POST' && requestUrl.pathname === '/deleteAttendee') {
        if (!requestUrl.query.title || !requestUrl.query.attendeeId) {
          throw new Error('Need parameters: title, attendeeId');
        }

        // Fetch the meeting info
        const meeting = meetingTable[requestUrl.query.title];

        await chimeSDKMeetings.deleteAttendee({
          MeetingId: meeting.Meeting.MeetingId,
          AttendeeId: requestUrl.query.attendeeId,
        });

        respond(response, 201, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/endCapture') {
        if (captureS3Destination) {
          pipelineInfo = meetingTable[requestUrl.query.title].Capture;
          await chimeSDKMediaPipelines.deleteMediaCapturePipeline({
            MediaPipelineId: pipelineInfo.MediaPipelineId
          });
          meetingTable[requestUrl.query.title].Capture = undefined;
          respond(response, 200, 'application/json', JSON.stringify({}));
        } else {
          console.warn("Cloud media capture not available")
          respond(response, 500, 'application/json', JSON.stringify({}))
        }
      } else if (request.method === 'POST' && requestUrl.pathname === '/end') {
        await chimeSDKMeetings.deleteMeeting({
          MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/start_transcription') {
        const languageCode = requestUrl.query.language;
        const region = requestUrl.query.region;
        let transcriptionConfiguration = {};
        let transcriptionStreamParams = {};
        if (requestUrl.query.transcriptionStreamParams) {
          transcriptionStreamParams = JSON.parse(requestUrl.query.transcriptionStreamParams);
        }
        if (requestUrl.query.engine === 'transcribe') {
          transcriptionConfiguration = {
            EngineTranscribeSettings: {}
          };
          if (languageCode) {
            transcriptionConfiguration.EngineTranscribeSettings.LanguageCode = languageCode;
          }
          if (region) {
            transcriptionConfiguration.EngineTranscribeSettings.Region = region;
          }
          if (transcriptionStreamParams.hasOwnProperty('contentIdentificationType')) {
            transcriptionConfiguration.EngineTranscribeSettings.ContentIdentificationType = transcriptionStreamParams.contentIdentificationType;
          }
          if (transcriptionStreamParams.hasOwnProperty('contentRedactionType')) {
            transcriptionConfiguration.EngineTranscribeSettings.ContentRedactionType = transcriptionStreamParams.contentRedactionType;
          }
          if (transcriptionStreamParams.hasOwnProperty('enablePartialResultsStability')) {
            transcriptionConfiguration.EngineTranscribeSettings.EnablePartialResultsStabilization = transcriptionStreamParams.enablePartialResultsStability;
          }
          if (transcriptionStreamParams.hasOwnProperty('partialResultsStability')) {
            transcriptionConfiguration.EngineTranscribeSettings.PartialResultsStability = transcriptionStreamParams.partialResultsStability;
          }
          if (transcriptionStreamParams.hasOwnProperty('piiEntityTypes')) {
            transcriptionConfiguration.EngineTranscribeSettings.PiiEntityTypes = transcriptionStreamParams.piiEntityTypes;
          }
          if (transcriptionStreamParams.hasOwnProperty('languageModelName')) {
            transcriptionConfiguration.EngineTranscribeSettings.LanguageModelName = transcriptionStreamParams.languageModelName;
          }
          if (transcriptionStreamParams.hasOwnProperty('identifyLanguage')) {
            transcriptionConfiguration.EngineTranscribeSettings.IdentifyLanguage = transcriptionStreamParams.identifyLanguage;
          }
          if (transcriptionStreamParams.hasOwnProperty('languageOptions')) {
            transcriptionConfiguration.EngineTranscribeSettings.LanguageOptions = transcriptionStreamParams.languageOptions;
          }
          if (transcriptionStreamParams.hasOwnProperty('preferredLanguage')) {
            transcriptionConfiguration.EngineTranscribeSettings.PreferredLanguage = transcriptionStreamParams.preferredLanguage;
          }
          if (transcriptionStreamParams.hasOwnProperty('vocabularyNames')) {
            transcriptionConfiguration.EngineTranscribeSettings.VocabularyNames = transcriptionStreamParams.vocabularyNames;
          }
          if (transcriptionStreamParams.hasOwnProperty('vocabularyFilterNames')) {
            transcriptionConfiguration.EngineTranscribeSettings.VocabularyFilterNames = transcriptionStreamParams.vocabularyFilterNames;
          }
        } else if (requestUrl.query.engine === 'transcribe_medical') {
          transcriptionConfiguration = {
            EngineTranscribeMedicalSettings: {
              LanguageCode: languageCode,
              Specialty: 'PRIMARYCARE',
              Type: 'CONVERSATION',
            }
          };
          if (region) {
            transcriptionConfiguration.EngineTranscribeMedicalSettings.Region = region;
          }
          if (transcriptionStreamParams.hasOwnProperty('contentIdentificationType')) {
            transcriptionConfiguration.EngineTranscribeMedicalSettings.ContentIdentificationType = transcriptionStreamParams.contentIdentificationType;
          }
        } else {
          return response(400, 'application/json', JSON.stringify({
            error: 'Unknown transcription engine'
          }));
        }
        await chimeSDKMeetings.startMeetingTranscription({
          MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
          TranscriptionConfiguration: transcriptionConfiguration
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'POST' && requestUrl.pathname === '/stop_transcription') {
        await chimeSDKMeetings.stopMeetingTranscription({
          MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId
        });
        respond(response, 200, 'application/json', JSON.stringify({}));
      } else if (request.method === 'GET' && requestUrl.pathname === '/fetch_credentials') {
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
        const data = await chimeSDKMeetings
          .updateAttendeeCapabilities({
            MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
            AttendeeId: requestUrl.query.attendeeId,
            Capabilities: {
              Audio: requestUrl.query.audioCapability,
              Video: requestUrl.query.videoCapability,
              Content: requestUrl.query.contentCapability,
            },
          });
        respond(response, 200, 'application/json', JSON.stringify(data));
      } else if (request.method === 'POST' && requestUrl.pathname === '/batch_update_attendee_capabilities_except') {
        const data = await chimeSDKMeetings
          .batchUpdateAttendeeCapabilitiesExcept({
            MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
            ExcludedAttendeeIds: requestUrl.query.attendeeIds.split(',').map((attendeeId) => {
              return { AttendeeId: attendeeId };
            }),
            Capabilities: {
              Audio: requestUrl.query.audioCapability,
              Video: requestUrl.query.videoCapability,
              Content: requestUrl.query.contentCapability,
            },
          });
        respond(response, 200, 'application/json', JSON.stringify(data));
      } else if (request.method === 'GET' && requestUrl.pathname === '/get_attendee') {
        const getAttendeeResponse = await chimeSDKMeetings
          .getAttendee({
            MeetingId: meetingTable[requestUrl.query.title].Meeting.MeetingId,
            AttendeeId: requestUrl.query.id,
          });
        respond(response, 200, 'application/json', JSON.stringify(getAttendeeResponse));      
      } else {
        respond(response, 404, 'text/html', '404 Not Found');
      }
    } catch (err) {
      respond(response, 400, 'application/json', JSON.stringify({ error: err.message }, null, 2));
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
  response.setHeader('Access-Control-Allow-Origin', '*');
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
