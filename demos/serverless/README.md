## Serverless Demo

This demo shows how to deploy [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/main/demos/browser) as self-contained serverless applications.

> *Note: Deploying the Amazon Chime SDK demo applications contained in this repository will cause your AWS Account to be billed for services, including the Amazon Chime SDK, used by the application.*

### Prerequisites

To deploy the serverless demo you will need:

- Node 10 or higher
- npm 6.11 or higher

And install aws and sam command line tools:

* [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

### Run deployment script

#### Meeting app
The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `meeting` demo.

```
cd demos/serverless
npm install
npm run deploy -- -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting
```

#### ChimeSDKMeetings Namespace vs Chime Namespace
The AWS.Chime and the AWS.ChimeSDKMeetings are both Amazon Chime's AWS clients to help builders create the Amazon Chime SDK meeting, create attendees, and enable optional meeting features such as transcription. AWS.ChimeSDKMeetings is intended to replace the previous AWS.Chime client.

Use `-u` or `--use-chime-sdk-meetings` to specify the AWS client. It defaults to true using the AWS.ChimeSDKMeetings client. This flag is primarly intended for internal testing of the legacy AWS.Chime client.

```
cd demos/serverless
npm install
npm run deploy -- -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting -u false
```

#### Media Capture
If you want to use media capture, an S3 bucket needs to be created for each region.
The S3 bucket will be created with a prefix specified with the -o option.

```
cd demos/serverless
npm install
npm run deploy -- -r us-east-1 -b <deploy-bucket> -o <capture-bucket-prefix> -s <my-stack-name> -a meeting
```

When the bucket prefix is provided, an S3 bucket will be created in each AWS region that
a meeting can be hosted in except for those that require opt-in. If you wish to use
media capture in one of these regions, you can list them with the -i option, for example

```
cd demos/serverless
npm install
npm run deploy -- -r us-east-1 -b <deploy-bucekt> -o <capture-bucket-prefix> -i af-south-1,eu-south-1 -s <my-stack-name> -a meeting
```

Note that you need to enable these regions if you plan to use media capture. For more information, see [Managing AWS Regions](https://docs.aws.amazon.com/general/latest/gr/rande-manage.html).

##### ChimeSDKMediaPipelines Namespace vs Chime Namespace
The AWS.Chime and the AWS.ChimeSDKMediaPipelines are both Amazon Chime's AWS clients to help builders create Amazon Chime SDK media pipelines. AWS.ChimeSDKMediaPipelines is intended to replace the previous AWS.Chime client.

The demo will default to using the new AWS.ChimeSDKMediaPipelines namespace. Use `--use-chime-sdk-media-pipelines false` to opt out and use the AWS.Chime client. This flag is primarily intended for internal testing of the legacy AWS.Chime client.

Furthermore, the demo will default to using the us-east-1 media pipelines control plane region. To override this behavior and use one of our [other available control plane regions/endpoints](https://docs.aws.amazon.com/chime-sdk/latest/dg/migrate-pipelines.html), use the flags:
```
--chime-sdk-media-pipelines-region <control plane region> --chime-sdk-media-pipelines-endpoint <service endpoint>
```

Finally, follow [the Chime SDK Media Pipelines migration guide guide](https://docs.aws.amazon.com/chime-sdk/latest/dg/create-pipeline-role.html) to create the necessary service-linked role so that the demo app can call Amazon Chime SDK meetings on your behalf.

#### Live Transcription
If you want to use live transcription, follow [the live transcription guide](https://docs.aws.amazon.com/chime/latest/dg/meeting-transcription.html) to create necessary service-linked role so that the demo app can call Amazon Transcribe and Amazon Transcribe Medical on your behalf.

#### Meeting Readiness Checker app
The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `meetingReadinessChecker` demo.

```
cd demos/serverless
npm install
npm run deploy -- -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meetingReadinessChecker
```

These script will create an S3 bucket and CloudFormation stack
with Lambda and API Gateway resources required to run the demo. After the script
finishes, it will output a URL that can be opened in a browser.

### Updating deployed application
Over time JS SDK will push new features, improvements, and bug fixes etc. It is important for the deployed application to maintain a recent version of the SDK. Updating the deployed application is easy to do with the help of the deploy script. 

> NOTE: When you deploy the demo, make sure the params (for ex. my-bucket and my-stack-name) passed to the deploy script are the same as your original deployment. This is will cause the exisiting resources to be updated rather than creating new ones. If you change the name of resources you will end up with a new cloudformation stack and that might cause unintended billing charges.

```
cd demos/serverless
node ./deploy.js -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting
```

### Cleaning up
To avoid incurring any unintended charges as a result of deploying the serverless demo, it is important to delete the AWS CloudFormation stack after you are finished using it. You can delete the provisioned CloudFormation stack using the [AWS CloudFormation console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) or the [AWS CLI](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-deleting-stack.html) as well as [delete the S3 buckets](https://docs.aws.amazon.com/AmazonS3/latest/userguide/delete-bucket.html) that were created.

### Meeting dashboard
The serverless demo uses Amazon CloudWatch Logs to visualize meeting events on the dashboard.
The `meeting` demo receives events using the `AudioVideoObserver.eventDidReceive` observer method and sends them to an AWS Lambda function.
The Lambda function uploads these events to CloudWatch Logs for searching and analyzing.

> Note: The Lambda API is not authenticated. The serverless demo does not represent a production-ready code.

#### To view the dashboard
1. Follow [the "Run deployment script" section](#meeting-app) to deploy the `meeting` demo.
2. Open the CloudWatch console at https://console.aws.amazon.com/cloudwatch/.
3. In the navigation pane, choose Dashboards.
4. Choose the meeting event dashboard.
5. You can view the meeting success rate, the platform information, and other operational data from meeting attendees.
  At the bottom of the dashboard, the widget explains how to search for a specific attendee's events.


## Notice
Disclaimer: You and your end users understand that recording Amazon Chime SDK meetings with this demo may be subject to laws or regulations regarding the recording of electronic communications. It is your and your end users’ responsibility to comply with all applicable laws regarding the recordings, including properly notifying all participants in a recorded session, or communication that the session or communication is being recorded, and obtain their consent.
