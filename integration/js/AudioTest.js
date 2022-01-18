const { OpenAppStep, JoinMeetingStep, AuthenticateUserStep, PlayRandomToneStep, ClickMicrophoneButton, WaitForRemoteParticipantsToTurnAudioOff, WaitForRemoteParticipantsToTurnAudioOn, WaitForRemoteParticipantsToJoinMeeting, WaitForRemoteAudioCheckToComplete, WaitForMeetingToBeCreated } = require('./steps');
const { UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, RosterCheck } = require('./checks');
const { TestUtils } = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('./utils/Window');

/*
* 1. Starts a meeting
* 2. Adds 2 participants to the meeting
* 3. Turns on the audio tone for both
* 4. One attendee plays random tone
* 5. Checks if the other participant is able to hear the tone
* 6. Same attendee mutes the audio
* 7. Checks if the other participant is not able to hear the audio
* */
class AudioTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Audio");
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

    const generateStereoTones = this.payload.generateStereoTones ? this.payload.generateStereoTones : false;
    const useStereoMusicAudioProfile = this.payload.useStereoMusicAudioProfile ? this.payload.useStereoMusicAudioProfile : false;

    await this.addUserToMeeting(test_attendee_id, testSession, useStereoMusicAudioProfile);
    await this.addUserToMeeting(monitor_attendee_id, monitorSession, useStereoMusicAudioProfile);

    await RosterCheck.executeStep(this, monitorSession, 2);
    await RosterCheck.executeStep(this, testSession, 2);

    await PlayRandomToneStep.executeStep(this, testSession, generateStereoTones);
    await RemoteAudioCheck.executeStep(this, monitorSession, "AUDIO_ON", generateStereoTones);

    await ClickMicrophoneButton.executeStep(this, testSession, 'OFF');
    await RemoteAudioCheck.executeStep(this, monitorSession, "AUDIO_OFF", generateStereoTones);
  }

  async runTestOnSingleSessions() {
    const session = this.seleniumSessions[0];
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(session.driver, "TEST");
    const monitor_window = await Window.openNew(session.driver, "MONITOR");

    const generateStereoTones = this.payload.generateStereoTones ? this.payload.generateStereoTones : false;
    const useStereoMusicAudioProfile = this.payload.useStereoMusicAudioProfile ? this.payload.useStereoMusicAudioProfile : false;

    await test_window.runCommands(async () => await this.addUserToMeeting(test_attendee_id, session, useStereoMusicAudioProfile));
    await monitor_window.runCommands(async () => await this.addUserToMeeting(monitor_attendee_id, session, useStereoMusicAudioProfile));

    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    await test_window.runCommands(async () => await PlayRandomToneStep.executeStep(this, session, generateStereoTones));
    await monitor_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, session, "AUDIO_ON", generateStereoTones));

    await test_window.runCommands(async () => await ClickMicrophoneButton.executeStep(this, session, 'OFF'));
    await monitor_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, session, "AUDIO_OFF", generateStereoTones));
  }

  async addUserToMeeting(attendeeId, session, useStereoMusicAudioProfile) {
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeId, false, false, false, '', useStereoMusicAudioProfile);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendeeId);
  }
}

module.exports = AudioTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new AudioTest('Audio test', kiteConfig);
  await test.run();
})();
