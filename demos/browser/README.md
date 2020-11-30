## Browser Meeting

This demo shows how to use the Amazon Chime SDK to build meeting applications for browsers.

### Prerequisites

To build, test, and run demos from source you will need:

* Node 10 or higher
* npm 6.11 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

For messaging session, make sure your role policy contains `chime:Connect` and `chime:GetMessagingSessionEndpoint`.

### Running the browser demos with a local server

1. Navigate to the `demos/browser` folder: `cd demos/browser`

2. Start the demo application: `npm run start`

3. Open http://localhost:8080 in your browser.

The meeting created with a local server is only available within your browser.

### Demo applications

Browser demo applications are located in the `app` folder. Current demos are:

* `meetingV2` (default) - incorporates all functionality into a videoconferencing application with a Bootstrap user interface and content share functionality
* `meetingReadinessChecker` - Meeting readiness checker app helps developers ensure that end-users can join Amazon Chime SDK meetings from their devices

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
   
If you don't specify the `--app` option, it will run the `meetingV2` demo

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
npm run start:fast (--app=<app>)
```
