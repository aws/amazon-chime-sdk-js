const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, PlayRandomToneStep, ClickMicrophoneButton, WaitForRemoteParticipantsToTurnAudioOff, WaitForRemoteParticipantsToTurnAudioOn, WaitForRemoteParticipantsToJoinMeeting, WaitForRemoteAudioCheckToComplete} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const uuidv4 = require('uuid/v4');

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
    this.page = new AppPage(this.driver);
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await UserAuthenticationCheck.executeStep(this);
    await JoinMeetingStep.executeStep(this);
    await UserJoinedMeetingCheck.executeStep(this, attendee_id);
    await WaitForRemoteParticipantsToJoinMeeting.executeStep(this);
    await RosterCheck.executeStep(this);

    await PlayRandomToneStep.executeStep(this);
    // Wait for other participant to start audio
    await WaitForRemoteParticipantsToTurnAudioOn.executeStep(this);
    // test audio
    await RemoteAudioCheck.executeStep(this, "AUDIO_ON");
    // wait for other participant to finish audio check to finish
    await WaitForRemoteAudioCheckToComplete.executeStep(this);
    // mute
    await ClickMicrophoneButton.executeStep(this, 'OFF');
    // wait for other participant to mute
    await WaitForRemoteParticipantsToTurnAudioOff.executeStep(this);
    // Test Mute
    await RemoteAudioCheck.executeStep(this, "AUDIO_OFF");
    // wait for other participant to finish audio check to finish
    await WaitForRemoteAudioCheckToComplete.executeStep(this);
    // un-mute
    await ClickMicrophoneButton.executeStep(this, 'ON');
    // wait for other participant to mute
    await WaitForRemoteParticipantsToTurnAudioOn.executeStep(this);
    // Test Unmute
    await RemoteAudioCheck.executeStep(this, "AUDIO_ON");

    await this.waitAllSteps();
  }
}

module.exports = AudioTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AudioTest('Audio test', kiteConfig);
  await test.run();
})();
