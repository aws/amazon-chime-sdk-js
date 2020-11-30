const {OpenMeetingReadinessCheckerAppStep, StartMeetingReadinessCheckerStep, WaitForContentShareTestToBeReady, WaitForStartMeetingReadinessCheckerButtonToBeEnabled, WaitForMeetingCreationAndMeetingReadinessCheckerInitializationStep, StartContentShareConnectivityCheckStep} = require('./steps');
const {MeetingReadinessCheckerNetworkTcpCheck, MeetingReadinessCheckerAudioOutputCheck, MeetingReadinessCheckerVideoConnectivityCheck, MeetingReadinessCheckerContentShareConnectivityCheck, MeetingReadinessCheckerAudioConnectivityCheck, MeetingReadinessCheckerNetworkUdpCheck} = require('./checks');
const {MeetingReadinessCheckerPage} = require('./pages/MeetingReadinessCheckerPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
/*
* 1. Opens the meeting readiness checker
* 2. Starts the checker with default options
* 3. Checks whether all the checks succeed
* */

class MeetingReadinessCheckerRunAllTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MeetingReadinessCheckerAllChecksPass");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    await OpenMeetingReadinessCheckerAppStep.executeStep(this, session);
    await WaitForStartMeetingReadinessCheckerButtonToBeEnabled.executeStep(this, session);
    await StartMeetingReadinessCheckerStep.executeStep(this, session);
    await WaitForMeetingCreationAndMeetingReadinessCheckerInitializationStep.executeStep(this, session);
    await MeetingReadinessCheckerAudioOutputCheck.executeStep(this, session);
    await WaitForContentShareTestToBeReady.executeStep(this, session);
    await StartContentShareConnectivityCheckStep.executeStep(this, session);
    await MeetingReadinessCheckerNetworkUdpCheck.executeStep(this, session);
    await MeetingReadinessCheckerNetworkTcpCheck.executeStep(this, session);
    await MeetingReadinessCheckerAudioConnectivityCheck.executeStep(this, session);
    await MeetingReadinessCheckerVideoConnectivityCheck.executeStep(this, session);
    await MeetingReadinessCheckerContentShareConnectivityCheck.executeStep(this, session);
  }
}

module.exports = MeetingReadinessCheckerRunAllTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingReadinessCheckerRunAllTest('Meeting readiness checker run all tests and check for success', kiteConfig);
  await test.run();
})();