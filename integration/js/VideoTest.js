const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, ClickVideoButton, ClickVideoFilterButton, WaitForRemoteVideoCheckToComplete, WaitForRemoteParticipantsToTurnVideoOff, WaitForRemoteParticipantsToTurnVideoOn, WaitForRemoteParticipantsToJoinMeeting, WaitForMeetingToBeCreated} = require('./steps');
const {UserJoinedMeetingCheck, LocalVideoCheck, RemoteVideoCheck, UserAuthenticationCheck, RosterCheck, RosterCheckConfig} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

// We will toggle the video on and off multiple times
const videoToggleCount = 2;

class VideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Video");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    const useSimulcast = this.useSimulcast;
    const useVideoProcessor = this.useVideoProcessor;
    await WaitForMeetingToBeCreated.executeStep(this, session);
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, this.attendeeId, useSimulcast);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, this.attendeeId);
    await WaitForRemoteParticipantsToJoinMeeting.executeStep(this, session);
    await RosterCheck.executeStep(this, session, 2);
    if (useVideoProcessor) {
      // todo: add step to check filter content
      await ClickVideoFilterButton.executeStep(this, session);
    }
    for (let i = 0; i < videoToggleCount; i++) {
        // Note since these wait functions will be called twice, we reset the respective variable after each one
        await ClickVideoButton.executeStep(this, session);
        await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON');
        await WaitForRemoteParticipantsToTurnVideoOn.executeStep(this, session);
        this.numVideoRemoteOn = 1;
        await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON');
        await WaitForRemoteVideoCheckToComplete.executeStep(this, session);
        this.numOfParticipantsCompletedVideoCheck = 1;
        await ClickVideoButton.executeStep(this, session);
        await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF');
        await WaitForRemoteParticipantsToTurnVideoOff.executeStep(this, session);
        this.numVideoRemoteOff = 1;
        await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF');
        await WaitForRemoteVideoCheckToComplete.executeStep(this, session);
        this.numOfParticipantsCompletedVideoCheck = 1;
    }

    // Check for unusual disconnections (don't need to wait here because we already did that earlier)
    await RosterCheck.executeStep(this, session, 2, new RosterCheckConfig(2, 500));

    await this.waitAllSteps();
  }
}

module.exports = VideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoTest('Video test', kiteConfig);
  await test.run();
})();
