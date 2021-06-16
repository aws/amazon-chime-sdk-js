## Browser Meeting

This demo shows how to use the Amazon Chime SDK to build meeting applications for browsers.

### Prerequisites

To build, test, and run demos from source you will need:

* Node 12 or higher
* npm 6.11 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

For messaging session, make sure your role policy contains `chime:Connect` and `chime:GetMessagingSessionEndpoint`.

### Running the browser demos with a local server

1. Navigate to the `demos/browser` folder: `cd demos/browser`

2. Start the demo application in 'hot reload' mode: `npm run start:hot`

3. Open http://localhost:8080 in your browser.

The meeting created with a local server is only available within your browser.

Changes to `meetingV2.html` and `meetingV2.ts` will be hot-reloaded. To force changes to the library itself to be hot-reloaded, run `npm run tsc:watch` in the SDK repository root.

### Demo applications

Browser demo applications are located in the `app` folder. Current demos are:

* `meetingV2` (default) - incorporates all functionality into a videoconferencing application with a Bootstrap user interface and content share functionality
* `meetingReadinessChecker` - Meeting readiness checker app helps developers ensure that end-users can join Amazon Chime SDK meetings from their devices
* `messagingSession` - Messaging session app shows developers how to create and use messaging session and related APIs.

To run a specific demo application use:

```
npm run start --app=<app>
```

For example,
1. To run the `meeting` demo, run:
    ```
    npm run start --app=meeting
    ```
2. To run the `meetingReadinessChecker` demo, run:
    ```
    npm run start --app=meetingReadinessChecker
    ```
3. To run the `messagingSession` demo, run:
    ```
    npm run start --app=messagingSession
    ```

If you don't specify the `--app` option, it will run the `meetingV2` demo.

When using npm v7 or higher, use `--env` instead of `--app`:

```
npm run start:hot -- --env app=meetingReadinessChecker
npm run build -- --env app=meetingV2
```

`start:fast` is not currently supported for apps other than `meetingV2` with npm v7.

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
npm run start:fast (--app=<app>)
```

## Notice

The browser demo applications in the [demos directory](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos) use [TensorFlow.js](https://github.com/tensorflow/tfjs) and pre-trained [TensorFlow.js models](https://github.com/tensorflow/tfjs-models) for image segmentation. Use of these third party models involves downloading and execution of code at runtime from [jsDelivr](https://www.jsdelivr.com/) by end user browsers. For the jsDelivr Acceptable Use Policy, please visit this [link](https://www.jsdelivr.com/terms/acceptable-use-policy-jsdelivr-net).

The use of TensorFlow runtime code referenced above may be subject to additional license requirements. See the licenses page for TensorFlow.js [here](https://github.com/tensorflow/tfjs/blob/master/LICENSE) and TensorFlow.js models [here](https://github.com/tensorflow/tfjs-models/blob/master/LICENSE) for details.