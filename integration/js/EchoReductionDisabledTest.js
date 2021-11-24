const {OpenAppStep, StartAmazonVoiceFocus, WaitForRemoteAudioCheckToComplete, PlayEcho, JoinMeetingStep, AuthenticateUserStep, PlayPrerecordedSpeechStep} = require('./steps');
const {UserJoinedMeetingCheck, RosterCheck, UserAuthenticationCheck, EchoAudioCheck} = require('./checks');
const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const {Window} = require('./utils/Window');
const { waitAround } = require('kite-common/util/TestUtils');

class EchoReductionDisabledTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Echo Reduction Disabled Test");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];

    const attendee_id1 = uuidv4();
    const attendee_id2 = uuidv4();

    const useWebAudioFlag = true
    const test_window_1 = await Window.existing(session.driver, 'TEST1');
    const test_window_2 = await Window.openNew(session.driver, 'TEST2');

    await test_window_1.runCommands(async () => await this.addUserToMeeting(attendee_id1, session, useWebAudioFlag));
    await test_window_2.runCommands(async () => await this.addUserToMeeting(attendee_id2, session, useWebAudioFlag));
    
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    await test_window_1.runCommands(async () => await PlayPrerecordedSpeechStep.executeStep(this, session));
    await test_window_2.runCommands(async () => await PlayEcho.executeStep(this, session));
    
    // Expect audio on test_window1 after applying VF
    await test_window_1.runCommands(async () => await EchoAudioCheck.executeStep(this, session, 'AUDIO_ON'));
    await test_window_1.runCommands(async () => await WaitForRemoteAudioCheckToComplete.executeStep(this, session));

    await waitAround(200);
    
    // Expect audio on test_window1 after applying VF
    await test_window_2.runCommands(async () => await StartAmazonVoiceFocus.executeStep(this, session));
    await test_window_1.runCommands(async () => await EchoAudioCheck.executeStep(this, session, 'AUDIO_ON'));
    await test_window_1.runCommands(async () => await WaitForRemoteAudioCheckToComplete.executeStep(this, session));

    await this.waitAllSteps();
  }

  async addUserToMeeting(attendee_id, sessionInfo, useWebAudioFlag) {
    await OpenAppStep.executeStep(this, sessionInfo);
    await AuthenticateUserStep.executeStep(this, sessionInfo, attendee_id, false, useWebAudioFlag);
    await UserAuthenticationCheck.executeStep(this, sessionInfo);
    await JoinMeetingStep.executeStep(this, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(this, sessionInfo, attendee_id);
  }
}

module.exports = EchoReductionDisabledTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new EchoReductionDisabledTest('Echo Reduction Disabled Test', kiteConfig);
  await test.run();
})();
