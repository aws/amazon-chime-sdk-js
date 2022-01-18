const { OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, ClickVideoFilterButton, WaitForRemoteVideoCheckToComplete, WaitForRemoteParticipantsToTurnVideoOff, WaitForRemoteParticipantsToTurnVideoOn, WaitForRemoteParticipantsToJoinMeeting, WaitForMeetingToBeCreated } = require('./steps');
const { UserJoinedMeetingCheck, LocalVideoCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck, RosterCheckConfig } = require('./checks');
const { TestUtils } = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('./utils/Window');

/*
* 1. Starts a meeting
* 2. Adds 2 participants to the meeting
* 3. Enable video filter for both if specified
* 4. One attendee enables video
* 5. Check if both attendees are able to view the video
* 6. Same attendee disables video
* 7. Check if both attendees are not able to view the video
* */
class VideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Video");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;

    if (this.numberOfSessions() > 1) {
      await this.runTestOnMultipleSessions();
    } else {
      await this.runTestOnSingleSessions();
    }
  }

  async runTestOnMultipleSessions() {
    const testSession = this.seleniumSessions[0];
    testSession.setSessionName("Test");
    const monitorSession = this.seleniumSessions[1];
    monitorSession.setSessionName("Monitor");

    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const useSimulcast = this.useSimulcast;
    const useVideoProcessor = this.useVideoProcessor;

    await this.addUserToMeeting(test_attendee_id, testSession, useSimulcast);
    await this.addUserToMeeting(monitor_attendee_id, monitorSession, useSimulcast);

    await RosterCheck.executeStep(this, monitorSession, 2);
    await RosterCheck.executeStep(this, testSession, 2);

    if (useVideoProcessor) {
      // TODO: Add step to check filter content
      await ClickVideoFilterButton.executeStep(this, testSession);
      await ClickVideoFilterButton.executeStep(this, monitorSession);
    }

    await ClickVideoButton.executeStep(this, testSession);
    await LocalVideoCheck.executeStep(this, testSession, 'VIDEO_ON');
    await RemoteVideoCheck.executeStep(this, monitorSession, 'VIDEO_ON');

    await ClickVideoButton.executeStep(this, testSession);
    await LocalVideoCheck.executeStep(this, testSession, 'VIDEO_OFF');
    await RemoteVideoCheck.executeStep(this, monitorSession, 'VIDEO_OFF');

    // Check for unusual disconnections (don't need to wait here because we already did that earlier)
    await RosterCheck.executeStep(this, monitorSession, 2, new RosterCheckConfig(2, 500));
    await RosterCheck.executeStep(this, testSession, 2, new RosterCheckConfig(2, 500));
  }

  async runTestOnSingleSessions() {
    const session = this.seleniumSessions[0];
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(session.driver, "TEST");
    const monitor_window = await Window.openNew(session.driver, "MONITOR");

    const useSimulcast = this.useSimulcast;
    const useVideoProcessor = this.useVideoProcessor;

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id, session, useSimulcast));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id, session, useSimulcast));

    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    if (useVideoProcessor) {
      // TODO: Add step to check filter content
      await test_window.runCommands(async () => await ClickVideoFilterButton.executeStep(this, session));
      await monitor_window.runCommands(async () => await ClickVideoFilterButton.executeStep(this, session));
    }

    await test_window.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await test_window.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    await test_window.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await test_window.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));
    await monitor_window.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));

    // Check for unusual disconnections (don't need to wait here because we already did that earlier)
    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2, new RosterCheckConfig(2, 500)));
    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2, new RosterCheckConfig(2, 500)));
  }

  async addUserToMeeting(attendeeId, session, useSimulcast) {
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeId, useSimulcast);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendeeId);
  }
}

module.exports = VideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoTest('Video test', kiteConfig);
  await test.run();
})();
