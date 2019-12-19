## Android Web View Demo

In this tutorial you will deploy the Android demo as a self-contained serverless application. *Note: deploying the serverless demo may incur extra charges in your AWS account.*

### Prerequisites

To build, test, and run demos from source you will need:

* Node 10 or higher
* npm 6.11 or higher
* Android Studio 3.5.2 or higher
* Android SDK version 15 or higher (version 29 recommended)

### Deploying the serverless browser demo

#### Install aws and sam command line tools

* [Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
* [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

#### Run deployment script

The following will create a CloudFormation stack containing a Lambda and
API Gateway deployment that runs the `mobile` demo.

```
cd demos/serverless
node ./deploy.js -r us-east-1 -b <my-bucket> -s <my-stack-name> -a mobile
```

The script will create an S3 bucket and CloudFormation stack
with Lambda and API Gateway resources required to run the demo. After the script
finishes, it will output a URL that can be opened in a browser. Keep this URL handy for future reference.

### Running Android app

1. Open [demos/android/SampleWebSDKApp/app/src/main/res/values/strings.xml](demos/android/SampleWebSDKApp/app/src/main/res/values/strings.xml).
2. Replace ```<!--SERVERLESS_BROWSER_DEMO_URL-->``` with a serverless browser demo URL.
3. Open Android Studio, select "Open an existing Android Studio project." Navigate to ```demos/android/SampleWebSDKApp``` to open the project and build the project
