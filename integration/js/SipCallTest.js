const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, GetSipUriForCallStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const uuidv4 = require('uuid/v4');
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
    const meetingId = uuidv4();
    this.url = this.baseUrl + '?m=' + meetingId;
    this.page = new AppPage(this.driver);
    let attendee_id = uuidv4();
    const test_window = await Window.openNew(this.driver, "SipCall");
    await test_window.runCommands(async () => {
      await OpenAppStep.executeStep(this);
      await AuthenticateUserStep.executeStep(this, attendee_id);
      await UserAuthenticationCheck.executeStep(this);
      await JoinMeetingStep.executeStep(this);
      await UserJoinedMeetingCheck.executeStep(this, attendee_id);
    });

    const sip_call_window = await Window.openNew(this.driver, "SipCall");
    await sip_call_window.runCommands(async () => await OpenAppStep.executeStep(this));
    await sip_call_window.runCommands(async () => await GetSipUriForCallStep.executeStep(this, meetingId));

    const sipCallClient = new SipCallClient(this.payload.sipTestAssetPath, this.payload.resultPath);
    const sipCall = sipCallClient.call(this.payload.voiceConnectorId, this.sipUri);

    await test_window.runCommands(async () => await await RosterCheck.executeStep(this, 2));
    await test_window.runCommands(async () => await RemoteAudioCheck.executeStep(this, 'AUDIO_ON'));

    sipCallClient.end(sipCall);

    await this.waitAllSteps();
  }
}

module.exports = SipCallTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new SipCallTest('Sip call test', kiteConfig);
  await test.run();
})();
