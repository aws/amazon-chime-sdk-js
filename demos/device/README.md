### About

The device demo showcases a minimal app that can run in various hardware environments. It is comprised of two parts:

1. `Controller app` - A small application that is responsible for sending actions to the room app, and listening for data from the `Room` to update its UI

2. `Room app` - The application that handles the business logic. It listens for messages from the `Controller` and executes them. It may then send a response back to the `Controller` to update its state

### Running the demos

To run the `device` application demo locally:

1. Ensure you have AWS credentials configured in your `~/.aws` folder for a role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and `chime:CreateAttendee`.

2. Navigate to the `demos/device` folder

3. Build dependencies: `npm run build`

4. Start the webpack server: `npm run start:client`

5. In another terminal in the same directory, start the node server: `npm run start:backend`

6. Open two tabs or two browser windows, navigate to https://localhost:3000/ and https://localhost:3000/controller

### Deploying the serverless device demo

You can deploy any of the demo as self-contained serverless application.
*Note: deploying the serverless demo may incur extra charges in your AWS account.*

#### Install aws and sam command line tools

* [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

#### Run deployment script

The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `device` demo.

```
cd demos/device/serverless
node ./deploy.js -r us-east-1 -b <my-bucket> -s <my-stack-name>
```

The script will create an S3 bucket and CloudFormation stack
with Lambda and API Gateway resources required to run the demo. After the script
finishes, it will output a URL that can be opened in a browser.

### AWS IoT

AWS IoT service is integrated in the device demo using Cognito identity pool for authentication.

#### Set up AWS IoT

1. Log into the AWS console with your AWS credentials and go to the [AWS IoT Core console](https://us-east-1.console.aws.amazon.com/iot/home?region=us-east-1)
2. Follow the [developer guide](https://docs.aws.amazon.com/iot/latest/developerguide/create-aws-thing.html) to create IoT thing: 
3. Follow the [developer guide](https://docs.aws.amazon.com/iot/latest/developerguide/register-device.html) to create certificate, create and attach IoT policy to certiifcate, and attach the policy to the thing created in step 2.
4. Select the IoT thing and click Interact. Note down the HTTPS endpoint and replace `AWS_IOT_HTTP_ENDPOINT` in IoTClient.tsx with it.

#### Set up Cognito identity pool

1. Log into the AWS console with your AWS credentials and go to the [Amazon Cognito console](https://us-east-1.console.aws.amazon.com/cognito/home?region=us-east-1)
2. Choose Manage Identity Pools, and then choose Create new identity pool. Type a name for the identity pool and select Enable access to unauthenticated identities from the Unauthenticated identities collapsible section. Choose Create Pool and then Allow. Note down the Identity pool ID and replace `COGNITO_IDENTITY_POOL_ID` in IoTClient.tsx with it. It will look like the following:

```
us-east-1:abcd1234-ab12-cd34-ef56-abcdef123456
```

3. Navigate to [AWS IAM console](https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1) to add permission to the Cognito Unauthenticated IAM role
4. Choose Roles and click on the 'Cognito_[IDENTITY-POOL-NAME]Unauth_Role' created in step 2. Click on the Policy, choose Edit policy and click JSON tab, copy the following policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*",
                "iot:*"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```
Then click Review Policy and Save changes

#### Test message publish on IoT console

Navigate to the AWS IoT console and select Test, choose Subscribe to a topic, then type in 'iot/meeting/#' and hit Subscribe to topic. When join meeting, toggle video, toggle screen share, leave and end meeting, check the Test console print out the corresponding message.
