const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, GetSipUriForCallStep, EndMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, RosterCheck, RosterCheckConfig} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const {Window} = require('./utils/Window');
const {SipCallClient} = require('./utils/SipCallClient');

/**
 * Test screen viewing scenarios
 */
class SipCallTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "SipCall");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    let attendee_id = uuidv4();
    const test_window = await Window.openNew(session.driver, "SipCall");
    await test_window.runCommands(async () => {
      await OpenAppStep.executeStep(this, session);
      await AuthenticateUserStep.executeStep(this, session, attendee_id);
      await UserAuthenticationCheck.executeStep(this, session);
      await JoinMeetingStep.executeStep(this, session);
      await UserJoinedMeetingCheck.executeStep(this, session, attendee_id);
    });

    const sip_call_window = await Window.openNew(session.driver, "SipCall");
    await sip_call_window.runCommands(async () => await OpenAppStep.executeStep(this, session));
    await sip_call_window.runCommands(async () => await GetSipUriForCallStep.executeStep(this, session, this.meetingTitle));

    const sipCallClient = new SipCallClient(this.payload.sipTestAssetPath, this.payload.resultPath);
    const sipCall = sipCallClient.call(this.payload.voiceConnectorId, this.sipUri, this.meetingTitle);

    await test_window.runCommands(async () => await await RosterCheck.executeStep(this, session, 2, new RosterCheckConfig(60, 500)));
    await test_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, session, 'AUDIO_ON'));
    await test_window.runCommands(async () => await EndMeetingStep.executeStep(this, session));

    // sipCallClient.end(sipCall);

    await this.waitAllSteps();
  }
}

module.exports = SipCallTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new SipCallTest('Sip call test', kiteConfig);
  await test.run();
})();
