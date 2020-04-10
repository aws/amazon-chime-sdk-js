## Browser Meeting

This demo shows how to use the Amazon Chime SDK to build meeting applications for browsers.

### Prerequisites

To build, test, and run demos from source you will need:

* Node 10 or higher
* npm 6.11 or higher

Ensure you have AWS credentials configured in your `~/.aws` folder for a
role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and
`chime:CreateAttendee`.

### Running the browser demos with a local server

1. Navigate to the `demos/browser` folder: `cd demos/browser`

2. Start the demo application: `npm run start`

3. Open http://localhost:8080 in your browser.

### Demo applications

Browser demo applications are located in the `app` folder. Current demos are:

* `meeting` - incorporates all functionality into a videoconferencing application with a Bootstrap user interface
* `meetingV2` (default) - A similar demo app to `meeting` with content share functionality 

To run a specific demo application use:

```
npm run start --app=<app>
```

For example, to run the `meeting` demo, run:

```
npm run start --app=meeting
```

If you don't specify the `--app` option, it will run the `meetingV2` demo

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
npm run start:fast (--app=<app>)
```
