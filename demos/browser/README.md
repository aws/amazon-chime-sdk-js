### Running the demos

To run the `meeting` application demo locally:

1. Ensure you have AWS credentials configured in your `~/.aws` folder for a role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and `chime:CreateAttendee`.

2. Change to the `demos/browser` folder: `cd demos/browser`

3. Start the demo application: `npm run start`

4. Open http://localhost:8080 in your browser.

### Demo applications

Demo applications are located in the `app` folder. Current demos are:

* `meeting` - incorporates all functionality into a videoconferencing application with a Bootstrap user interface
* `meetingV2` - A similar demo app to `meeting` with content share functionality 

To run a specific demo application use:

```
npm run start --app=<app>
```

For example, to run the `meeting` demo, run:

```
npm run start --app=meeting
```

After running `start` the first time, you can speed things up on subsequent iterations by using `start:fast`, e.g.

```
npm run start:fast (--app=<app>)
```
