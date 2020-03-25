### About

This demo is a small app that will showcase the features of the Chime SDK as well as provide a starting point for developers that wish to integrate a React application with the SDK.

### Running the demo

To run the `react` application demo locally:

1. Ensure you have AWS credentials configured in your `~/.aws` folder for a role with a policy allowing `chime:CreateMeeting`, `chime:DeleteMeeting`, and `chime:CreateAttendee`.

2. Navigate to the `demos/react` folder

3. Run `npm install`

4. Start the webpack server: `npm run start:client`

5. In another terminal in the same directory, start the node server: `npm run start:backend`

6. Open a browser tab, navigate to https://localhost:9000/
