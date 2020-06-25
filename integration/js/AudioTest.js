const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, PlayRandomToneStep, ClickMicrophoneButton, WaitForRemoteParticipantsToTurnAudioOff, WaitForRemoteParticipantsToTurnAudioOn, WaitForRemoteParticipantsToJoinMeeting, WaitForRemoteAudioCheckToComplete, WaitForMeetingToBeCreated} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

/*
* 1. Starts a meeting
* 2. Adds 2 participants to the meeting
* 3. Turns on the audio tone for both
* 4. Tests if the other participant is able to hear the tone
* 5. Mutes the audio
* 6. Checks if the other participant is able to hear the audio
* 7. UnMutes the audio
* 8. Checks if the other participant is able to hear the audio
* */
class AudioTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Audio");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];

    await WaitForMeetingToBeCreated.executeStep(this, session);
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, this.attendeeId);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, this.attendeeId);
    await WaitForRemoteParticipantsToJoinMeeting.executeStep(this, session);
    await RosterCheck.executeStep(this, session, 2);

    await PlayRandomToneStep.executeStep(this, session);
    // Wait for other participant to start audio
    await WaitForRemoteParticipantsToTurnAudioOn.executeStep(this, session);
    // test audio
    await RemoteAudioCheck.executeStep(this, session, "AUDIO_ON");
    // wait for other participant to finish audio check to finish
    await WaitForRemoteAudioCheckToComplete.executeStep(this, session);
    // mute
    await ClickMicrophoneButton.executeStep(this, session, 'OFF');
    // wait for other participant to mute
    await WaitForRemoteParticipantsToTurnAudioOff.executeStep(this, session);
    // Test Mute
    await RemoteAudioCheck.executeStep(this, session, "AUDIO_OFF");
    // wait for other participant to finish audio check to finish
    await WaitForRemoteAudioCheckToComplete.executeStep(this, session);

    await this.waitAllSteps();
  }
}

module.exports = AudioTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AudioTest('Audio test', kiteConfig);
  await test.run();
})();
