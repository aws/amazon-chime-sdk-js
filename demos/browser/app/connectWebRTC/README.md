# Connect WebRTC Demo

A minimal demo that uses Amazon Connect's `StartWebRTCContact` API to establish a 1-on-1 video/audio call between a customer and an agent. Supports Amazon Voice Focus (noise suppression) and background blur/replacement filters.

## Prerequisites

- Node.js 18+
- AWS credentials with `connect:StartWebRTCContact` permission
- An Amazon Connect instance with a contact flow configured for WebRTC

## Running Locally

```bash
cd demos/browser
npm install

# Set AWS credentials
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...  # if using temporary credentials

# Start the dev server
APP=connectWebRTC npm run start:fast
```

Open `http://127.0.0.1:8080` in your browser.

### Input Fields

- **Customer Name** — display name shown to the agent
- **Contact Flow ARN** — full ARN of your Connect contact flow (e.g., `arn:aws:connect:us-east-1:123456789012:instance/<instance-id>/contact-flow/<flow-id>`)

The instance ID and region are parsed automatically from the ARN.

## Deploying Serverless

A standalone SAM-based serverless deployment is available at `demos/serverless-connect-webrtc/`.

```bash
cd demos/serverless-connect-webrtc
npm install

node deploy.js -r us-east-1 -b <your-s3-bucket> -s <stack-name>
```

This deploys:
- An API Gateway endpoint
- A Lambda function serving the demo HTML (`GET /`)
- A Lambda function handling `StartWebRTCContact` (`POST /start-webrtc-contact`)

The deploy script outputs the API Gateway URL when complete.

The deploy region only controls where the Lambda/API Gateway live. The Connect API call targets whatever region is in the Contact Flow ARN, so you can deploy in `us-east-1` and use a Connect instance in any supported region.

## Custom Connect Endpoint

To test against a non-production Connect endpoint, set it in your browser's developer console:

```js
localStorage.setItem('connectEndpoint', 'https://your-custom-endpoint.example.com');
```

To revert to the default production endpoint:

```js
localStorage.removeItem('connectEndpoint');
```

## Features

- 1-on-1 video call with local self-view (picture-in-picture) and remote video
- Amazon Voice Focus noise suppression
- Background blur (low/medium/high) and background replacement via VideoFx
- Microphone, camera, and speaker device selection
- Automatic return to start page when the contact ends
