## Serverless Demo

This demo shows how to deploy [Chime SDK Browser Demo](https://github.com/aws/amazon-chime-sdk-js/tree/master/demos/browser) as self-contained serverless applications.

> *Note: deploying the serverless demo may incur extra charges in your AWS account.*

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


### Cleaning up
To avoid incurring any unintended charges as a result of deploying the serverless demo, it is important to delete the AWS CloudFormation stack after you are finished using it. You can delete the provisioned CloudFormation stack using the [AWS CloudFormation console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) or the [AWS CLI](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-deleting-stack.html).

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
