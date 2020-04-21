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

The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `meeting` demo.

```
cd demos/serverless
node ./deploy.js -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting
```

The script will create an S3 bucket and CloudFormation stack
with Lambda and API Gateway resources required to run the demo. After the script
finishes, it will output a URL that can be opened in a browser.


### Cleaning up
To avoid incurring any unintended charges as a result of deploying the serverless demo, it is important to delete the AWS CloudFormation stack after you are finished using it. You can delete the provisioned CloudFormation stack using the [AWS CloudFormation console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) or the [AWS CLI](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-deleting-stack.html).