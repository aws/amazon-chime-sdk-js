## Browser Meeting

This demo shows how to use the Amazon Chime SDK to build meeting applications for browsers.

### Prerequisites

To build, test, and run demos from source you will need:

* Node 18 or higher
* npm 8.6.0 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

Recording to the cloud and broadcasting in `meetingV2` need no setup. The first recording in a media Region creates a private S3 bucket there named `chime-sdk-demo-<account ID>-<region>`, with a bucket policy that lets the media pipelines service write for this account only and a rule that deletes recordings after a day. Later recordings, and every other copy of the demo in the account, reuse it; a bucket of that name the account already owns is used as is. Each broadcast creates an Amazon IVS channel, deleted when the broadcast or the meeting ends, and its playback URL plays in any HLS player.

For these the role also needs `chime:CreateMediaCapturePipeline`, `chime:DeleteMediaCapturePipeline`, `chime:CreateMediaLiveConnectorPipeline`, `chime:DeleteMediaPipeline`, `s3:GetBucketPolicy`, `s3:CreateBucket`, `s3:ListBucket`, `s3:GetBucketTagging`, `s3:PutBucketTagging`, `s3:PutBucketPublicAccessBlock`, `s3:PutBucketPolicy`, `s3:PutLifecycleConfiguration`, `ivs:CreateChannel` and `ivs:DeleteChannel`.

To record to a bucket of your own instead, set `CAPTURE_S3_DESTINATION` to its S3 ARN (same account, with a policy like the one in `captureBucket.js`). To broadcast to your own RTMP endpoint, set `IVS_ENDPOINT`:
```
export IVS_ENDPOINT=<rtmps://ingest-server-url:443/app/stream-key>
```

The capture buckets stay after the demo stops. To delete one: `aws s3 rb s3://chime-sdk-demo-<account ID>-<region> --force`.

Check Amazon Chime SDK launches live connector for streaming [blog post](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdk-launches-live-connector-for-streaming/) for more information.

For messaging session, make sure your role policy contains `chime:Connect` and `chime:GetMessagingSessionEndpoint`.

### Running the browser demos with a local server

1. Navigate to the `demos/browser` folder: `cd demos/browser`

2. Start the demo application: `npm run start`

3. Open http://localhost:8080 in your browser.

The meeting created with a local server is only available within your browser.

The local server answers only requests addressed to `localhost`, `127.0.0.1` or `[::1]`, which keeps other web pages
from reaching it through DNS rebinding. To serve it through a tunnel or reverse proxy, list the public hostname in
`ALLOWED_HOSTS` (comma-separated), for example `ALLOWED_HOSTS=demo.example.com npm run start`.

Changes to demo source files (`.ts`, `.css`, `.html`) will trigger an automatic page reload. To also pick up changes to the SDK source, run `npm run tsc:watch` in the SDK repository root and use `npm run start:watch` instead of `start:fast`.

### Demo applications

Browser demo applications are located in the `app` folder. Current demos are:

* `meetingV2` (default) - a videoconferencing application covering the SDK's meeting features: devices, video tiles, content share, background effects, chat and reactions over data messages, live transcription, and, in developer mode (`?dev=1`, or **Show developer options** in More or Settings), codec, policy, capability and media pipeline controls
* `meetingReadinessChecker` - Meeting readiness checker app helps developers ensure that end-users can join Amazon Chime SDK meetings from their devices
* `messagingSession` - Messaging session app shows developers how to create and use messaging session and related APIs.

To run a specific demo application use:

```
APP=<app> npm run start
```

For example,
1. To run the `meetingV2` demo, run:
    ```
    APP=meetingV2 npm run start
    ```
2. To run the `meetingReadinessChecker` demo, run:
    ```
    APP=meetingReadinessChecker npm run start
    ```
3. To run the `messagingSession` demo, run:
    ```
    APP=messagingSession npm run start
    ```

If you don't specify the `APP` variable, it will run the `meetingV2` demo.

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
APP=<app> npm run start:fast
```

### Meeting demo code layout

```
app/meetingV2/
  meetingV2.html / .ts        entry; the HTML is the test contract (element ids)
  styleV2.css                 plain CSS (native nesting) over app/tokens.css + app/base.css (no framework)
  strings.ts                  every string the TypeScript composes at runtime (toasts, menus, dialogs)
  app/                        DemoMeetingApp (composition root), pageElements (the elements each module gets),
                              SessionEvents (SDK callbacks -> UI); only meetingV2.ts imports it
  config/                     option schema and MeetingConfig (URL + localStorage); imports nothing else
  session/                    MeetingSessionController (SDK session, observers), SessionLogging,
                              AudioDiagnostics, VoiceFocus, ApiClient, codecSupport, MeetingLogger
  devices/                    DeviceManager, LocalCamera, PreCallDevices (Settings pickers before a meeting),
                              BackgroundEffect, testInputs, devicePermissions, DeviceSettings,
                              BackgroundImagePicker, LevelMeter, MicTest, TestSound
  media/                      synthetic and file media sources for content share and the test inputs
                              (MediaStreamProvider, DemoMediaStreamProviders, SyntheticVideoDeviceFactory)
  video/                      VideoTileCollection, stagePolicy (grid and featured-tile rules), TileStats,
                              VideoTile (<video-tile>), AvatarTile, PaginationManager, RemoteVideoManager
  features/                   ChatPanel (+ chatMarkup), Reactions, Transcription (+ transcriptionRequest),
                              Recording, StatsPanel, Capabilities, Roster, ContentShareManager,
                              ContentShareOptions
  shell/                      page chrome: JoinScreen, PreJoinScreen, SettingsDialog, Dock, Toolbar, SidePanel,
                              Flows
  ui/                         widgets that import only each other and strings.ts: Menu (Popover API),
                              Dialog (<dialog>), Toast, LinkedSelect, LineChart, avatar, actions, dom,
                              icons (lucide-static)
csp.js                        the Content-Security-Policy the Vite dev server, api-server.js and the serverless
                              page all send
meetingRequests.js            the Chime SDK request bodies (CreateMeeting, transcription, live connector) that
                              api-server.js and the serverless handlers.js both build
```

Translating the demo means editing five places: `strings.ts`, the option labels (background effect names among
them) in `config/schema.ts`, the dock button labels in `shell/Toolbar.ts`, the resolution labels in `VIDEO_QUALITIES`
(`devices/DeviceManager.ts`), and the static copy in `meetingV2.html`.

`npm run lint`, `npm test` (vitest) and `tsc --noEmit` (with `strictNullChecks`) run as part of `npm run build`.
The single-file bundle is about 1.8 MB (500 KB gzipped); roughly 85% of the compressed size is the SDK itself
(the signaling protobuf, the device and audio-video controllers, and the messaging client the SDK's `index`
re-exports), the rest is the demo and its icons. Chat formats messages with a small built-in renderer
(`features/chatMarkup.ts`: bold, italic, code, links, line breaks) rather than a Markdown library.

The page itself needs a 2023-or-later browser (Chrome and Edge 111, Firefox 113, Safari 16.2) for `<dialog>`,
`color-mix()` and container units, which is a higher floor than the SDK's. Menus use the Popover API where it exists
and fall back to a positioned element elsewhere.

### Providing a custom application metadata

Amazon Chime SDK for JavaScript allows builders to provide application metadata in the meeting session configuration. This field is optional. Amazon Chime uses application metadata to analyze meeting health trends or identify common failures to improve your meeting experience.

> ⚠️ Do not pass any Personal Identifiable Information (PII).

The demo meetingV2 app is using `amazon-chime-sdk-js-demo` as the `appName` and `3.0.0` as the `appVersion` for building the application metadata. To provide a custom application metadata, please follow [providing application metadata](https://github.com/aws/amazon-chime-sdk-js#providing-application-metadata) usage section.

## Notice

The browser demo applications in the [demos directory](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos) use [TensorFlow.js](https://github.com/tensorflow/tfjs) and pre-trained [TensorFlow.js models](https://github.com/tensorflow/tfjs-models) for image segmentation. Use of these third party models involves downloading and execution of code at runtime from [jsDelivr](https://www.jsdelivr.com/) by end user browsers. For the jsDelivr Acceptable Use Policy, please visit this [link](https://www.jsdelivr.com/terms/acceptable-use-policy-jsdelivr-net).

The use of TensorFlow runtime code referenced above may be subject to additional license requirements. See the licenses page for TensorFlow.js [here](https://github.com/tensorflow/tfjs/blob/master/LICENSE) and TensorFlow.js models [here](https://github.com/tensorflow/tfjs-models/blob/master/LICENSE) for details.

Disclaimer: You and your end users understand that recording Amazon Chime SDK meetings with this demo may be subject to laws or regulations regarding the recording of electronic communications. It is your and your end users’ responsibility to comply with all applicable laws regarding the recordings, including properly notifying all participants in a recorded session, or communication that the session or communication is being recorded, and obtain their consent.
