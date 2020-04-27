## Video Help Desk

In this tutorial you will add a Video Help Desk widget to an example website.
The widget allows a customer visiting that website to make a video call to a
help desk that maintains a queue of support calls to join.

You will create an AWS Cloud9 environment and use it to deploy an
AWS CloudFormation stack containing an Amazon API Gateway and AWS Lambda endpoints.
These endpoints will serve both the example home and help desk webpages as well
as manage Help Desk tickets stored in an Amazon DynamoDB table.

Each ticket entry in the table represents the meeting and attendees for a single
Help Desk video session. The client-side code for the website uses the
information in the ticket to establish a two-way video session with the Amazon Chime SDK.

Since multiple customers may need help at the same time, the help desk site maintains
a queue, which allows the support person helping the website customer to
quickly move on to the next caller.

*Note: this tutorial is intended to show how to use the Amazon Chime SDK with a
minimal amount of code. It should not be used for a production application.*

### For this tutorial

* Log into your AWS account with an IAM role that has the **AdministratorAccess** policy.
* Use the **us-east-1 (N. Virginia)** region of your AWS account.

### Steps

#### Create an AWS Cloud9 environment

1. Go to the [AWS Cloud9 Dashboard](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1).
2. Press the **Create environment** button or go [here](https://us-east-1.console.aws.amazon.com/cloud9/home/create).
3. For the Name enter `<YourName>VideoHelpDesk` and press the **Next step** button.
4. For **Environment Settings** use the defaults and press the **Next step** button.
5. Review the **Environment name and settings** and press the **Create environment** button.
6. Wait for the environment to start.

#### Clone and build the tutorial

In the AWS Cloud9 environment, locate the `bash` terminal in the bottom window pane,
and enter the following commands there:

```
git clone https://github.com/aws/amazon-chime-sdk-js
cd amazon-chime-sdk-js/demos/videohelpdesk
npm run build
```

On the left hand pane of Cloud9 that shows the project structure, navigate to the
`amazon-chime-sdk-js/demos/videohelpdesk` directory. We will be working out
of this directory in the following steps.

### Deploy the API Gateway

1. On the right-hand side open the **AWS Resources** tab, locate the **Lambda** pane.
Under **Local Functions**, select the `videohelpdesk` folder containing the Lambdas
it detected in the project and press the **Deploy** button (the icon showing an *up arrow*).
2. Now go to the [API Gateway Dashboard](https://console.aws.amazon.com/apigateway/main/apis?region=us-east-1)
and select the *cloud9-videohelpdesk* API you created.
3. Select **Stages** and then **Prod**
4. Copy the **Invoke URL** to a browser window. It will look like the following:
  * `https://abcde12345.execute-api.us-east-1.amazonaws.com/Prod`
  * This is the **Example Website URL** to the home page of the example website. Keep this URL
  handy for future reference.
5. Now add `/helpdesk` to the same URL. It will look like the following:
  * `https://abcde12345.execute-api.us-east-1.amazonaws.com/Prod/helpdesk`
  * This is the **Help Desk URL** to the help desk. Keep this URL handy for future reference.

Now the sites are deployed and accessible. They won't do anything until you enable the
help desk widget on the *Example Website* and the support queue on the *Help Desk*.

### Enable the widget and code on the Example Website

1. In Cloud9, open the `src/website.html` and uncomment the block of code around the
   `help-desk-widget` `<div>`. (Remove the `<!--` and `-->` from the file.) Save this file.
2. Now open the `src/website.js` file and uncomment the entire file.
  (Remove the `/*` and `*/` from the file). Save this file.
3. Run `npm run build` from the `bash` terminal to regenerate the website distribution.
4. Select the `videohelpdesk` **Local Functions** folder containing the Lambdas and
   press the **Deploy** button.

After the deployment is finished, reload the **Example Website URL**. You should now see
a Video Help Desk tab in the bottom right. You can click it to open and then enter in
a name to place a call to the help desk. If the connection is successful, you will see
your own local video in the tab.

### Enable the support queue on the Help Desk

1. In Cloud9, open the `src/helpdesk.html` and uncomment the block of code in the `<body>`. (Remove the `<!--` and `-->` from the file.) Save this file.
2. Now open the `src/helpdesk.js` file and uncomment the entire file.
  (Remove the `/*` and `*/` from the file). Save this file.
3. Run `npm run build` from the `bash` terminal to regenerate the website distribution.
4. Select the `videohelpdesk` **Local Functions** folder containing the Lambdas and
   press the **Deploy** button.

After the deployment is finished, reload the **Help Desk URL**. You should now see
a customer queue of those who are currently waiting. Press the **Join Next** to join
the call with the next person in line. If the connection is successful, you will see
both your video and the remote customer's video in the tab. The customer will also now
see both local and remote videos in their Help Desk Widget.

Press the **Join Next** button again to go to the next call, and so on until the queue
is drained.

### Cleaning up
To avoid incurring any unintended charges as a result of deploying the video help desk, it is important to delete the AWS Cloud9 environment and AWS CloudFormation stack after you are finished using them. You can delete the provisioned CloudFormation stack using the [AWS CloudFormation console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) or the [AWS CLI](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-cli-deleting-stack.html).