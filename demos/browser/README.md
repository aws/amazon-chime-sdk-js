## Browser Meeting

This demo shows how to use the Amazon Chime SDK to build meeting applications for browsers.

### Prerequisites

To build, test, and run demos from source you will need:

* Node 18 or higher
* npm 8.6.0 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

If you want to use media capture in `meetingV2`, the role policy will also
require `chime:CreateMediaCapturePipeline`, `chime:DeleteMediaCapturePipeline`,
and `s3:GetBucketPolicy`.  In addition, ensure that an S3 ARN for a bucket
owned by the same AWS account that your credentials are for should be set in
the `CAPTURE_S3_DESTINATION` environment variable.  The S3 bucket should be in
the same AWS region as the meeting and have the following bucket policy:
```
{
    "Version": "2012-10-17",
    "Id":"AWSChimeMediaCaptureBucketPolicy",
    "Statement": [
        {
            "Sid": "AWSChimeMediaCaptureBucketPolicy",
            "Effect": "Allow",
            "Principal": {
                "Service": "chime.amazonaws.com"
            },
            "Action": ["s3:PutObject", "s3:PutObjectAcl"],
            "Resource":"arn:aws:s3:::[bucket name]/*"
        }
    ]
}
```
To use the Amazon Chime SDK media pipelines live connector feature, you need to provide an Amazon Interactive Video Service (IVS) channel endpoint and set the environment variable when running locally. IVS channel is created in only in the serverless browser demo and not in local browser demo.
For example:
```
export IVS_ENDPOINT=<rtmps://ingest-server-url:443/app/stream-key>
```

Check Amazon Chime SDK launches live connector for streaming [blog post](https://aws.amazon.com/blogs/business-productivity/amazon-chime-sdk-launches-live-connector-for-streaming/) for more information.

For messaging session, make sure your role policy contains `chime:Connect` and `chime:GetMessagingSessionEndpoint`.

### Running the browser demos with a local server

1. Navigate to the `demos/browser` folder: `cd demos/browser`

2. Start the demo application: `npm run start`

3. Open http://localhost:8080 in your browser.

The meeting created with a local server is only available within your browser.

Changes to demo source files (`.ts`, `.scss`, `.html`) will trigger an automatic page reload. To also pick up changes to the SDK source, run `npm run tsc:watch` in the SDK repository root and use `npm run start:watch` instead of `start:fast`.

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
1. To run the `meetingV2` demo, run:
    ```
    npm run start --app=meetingV2
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

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
npm run start:fast (--app=<app>)
```

### Providing a custom application metadata

Amazon Chime SDK for JavaScript allows builders to provide application metadata in the meeting session configuration. This field is optional. Amazon Chime uses application metadata to analyze meeting health trends or identify common failures to improve your meeting experience.

> ⚠️ Do not pass any Personal Identifiable Information (PII).

The demo meetingV2 app is using `amazon-chime-sdk-js-demo` as the `appName` and `2.0.0` as the `appVersion` for building the application metadata. To provide a custom application metadata, please follow [providing application metadata](https://github.com/aws/amazon-chime-sdk-js#providing-application-metadata) usage section.

## Notice

The browser demo applications in the [demos directory](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos) use [TensorFlow.js](https://github.com/tensorflow/tfjs) and pre-trained [TensorFlow.js models](https://github.com/tensorflow/tfjs-models) for image segmentation. Use of these third party models involves downloading and execution of code at runtime from [jsDelivr](https://www.jsdelivr.com/) by end user browsers. For the jsDelivr Acceptable Use Policy, please visit this [link](https://www.jsdelivr.com/terms/acceptable-use-policy-jsdelivr-net).

The use of TensorFlow runtime code referenced above may be subject to additional license requirements. See the licenses page for TensorFlow.js [here](https://github.com/tensorflow/tfjs/blob/master/LICENSE) and TensorFlow.js models [here](https://github.com/tensorflow/tfjs-models/blob/master/LICENSE) for details.

Disclaimer: You and your end users understand that recording Amazon Chime SDK meetings with this demo may be subject to laws or regulations regarding the recording of electronic communications. It is your and your end users’ responsibility to comply with all applicable laws regarding the recordings, including properly notifying all participants in a recorded session, or communication that the session or communication is being recorded, and obtain their consent.
