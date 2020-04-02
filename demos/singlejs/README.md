## Bundling Chime SDK into a single .js file

This demo shows how to bundle the latest release of `amazon-chime-sdk-js` into a single JS file using Rollup. You'll need to have Node 10+ and npm 6.11+ on your local development machine.

```bash
git clone https://github.com/aws/amazon-chime-sdk-js.git
cd amazon-chime-sdk-js/demos/singlejs
npm run bundle
```

It will generate `amazon-chime-sdk.min.js` and `amazon-chime-sdk.min.js.map` in the `build` folder. Include both files in your project and embed `amazon-chime-sdk.min.js`.

```html
<script src="path/to/amazon-chime-sdk.min.js"></script>
```

### Using ChimeSDK

In a browser environment, `window.ChimeSDK` will be available. You can access Chime SDK components by component name ([See the full list here](https://github.com/aws/amazon-chime-sdk-js/blob/master/src/index.ts)).
For example, you can rewrite [the Meeting Application example](https://aws.github.io/amazon-chime-sdk-js/modules/gettingstarted.html#meeting-application) using `window.ChimeSDK`.

```js
const logger = new ChimeSDK.ConsoleLogger('ChimeMeetingLogs', ChimeSDK.LogLevel.INFO);
const deviceController = new ChimeSDK.DefaultDeviceController(logger);
const configuration = new ChimeSDK.MeetingSessionConfiguration(meeting, attendee);
const meetingSession = new ChimeSDK.DefaultMeetingSession(configuration, logger, deviceController);
```

### Changing target version

You can change the version of `amazon-chime-sdk-js` in `package.json`. By default, `npm run bundle` uses `^1.0.0` (releases from 1.0.0 until 2.0.0 in the NPM registry).

```json
"dependencies": {
  "amazon-chime-sdk-js": "^1.0.0"
}
```