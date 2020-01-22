## Amazon Chime SDK for JavaScript

### Build video calling, audio calling, and screen sharing applications powered by Amazon Chime.

The Amazon Chime SDK makes it easy to add collaborative audio calling,
video calling, and screen share features to web applications by using
the same infrastructure services that power millions of Amazon Chime
online meetings.

This Amazon Chime SDK for JavaScript works by connecting to meeting session
resources that you have created in your AWS account. The SDK has everything
you need to build custom calling and collaboration experiences in your
web application, including methods to: configure meeting sessions, list and
select audio and video devices, start and stop screen share and screen share
viewing, receive callbacks when media events occur such as volume changes, and
control meeting features such as audio mute and video tile bindings.

To get started, see the following resources:

* [Amazon Chime](https://aws.amazon.com/chime)
* [Amazon Chime Developer Guide](https://docs.aws.amazon.com/chime/latest/dg/what-is-chime.html)
* [Amazon Chime SDK API Reference](http://docs.aws.amazon.com/chime/latest/APIReference/Welcome.html)
* [JavaScript Client SDK Documentation](https://aws.github.io/amazon-chime-sdk-js)

### Prerequisites

To build, test, and run demos from source you will need:

* Node 10 or higher
* npm 6.11 or higher

### Installing from NPM

To add the Amazon Chime SDK for JavaScript into an existing application,
install the package directly from npm:

```
npm install amazon-chime-sdk-js --save
```

### Running the browser demos with a local server

To run demo applications see the [README.md](demos/browser/README.md) file
in the [demos/browser](demos/browser) folder. To run the `meeting` application
demo locally:

1. Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

2. Change to the `demos/browser` folder: `cd demos/browser`

3. Start the demo application: `npm run start`

4. Open http://localhost:8080 in your browser.

### Deploying the serverless browser demo

You can deploy any of the demos as self-contained serverless applications.
*Note: deploying the serverless demo may incur extra charges in your AWS account.*

#### Install aws and sam command line tools

* [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

#### Run deployment script

The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `meeting` demo.

```
cd demos/serverless
node ./deploy.js -r us-east-1 -b <my-bucket> -s <my-stack-name> -a meeting
```

The script will create an S3 bucket and CloudFormation stack
with Lambda and API Gateway resources required to run the demo. After the script
finishes, it will output a URL that can be opened in a browser.

### Building and testing

```
npm run build
npm run test
```

After running `npm run test` the first time, you can use `npm run test:fast` to
speed up the test suite.

To view code coverage results open `build/coverage/index.html` in your browser
after running `npm run test`.

### Generating the documentation

To generate JavaScript API reference documentation run:

```
npm run build
npm run doc
```

Then open `docs/index.html` in your browser.

## Reporting a suspected vulnerability

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our
[vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/).
Please do **not** create a public GitHub issue.

Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
