const {ClickVideoButton, ClickBackgroundReplacementButton} = require('./steps');
const {VideoBackgroundReplacementCheck, LocalVideoCheck, RemoteVideoCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('kite-common');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const {Window} = require('./utils/Window');

class BackgroundReplacementTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Background Replacement Test");
  }

  async runIntegrationTest() {
    const attendee_id = uuidv4()
    const remote_attendee_id =uuidv4();
    const session = this.seleniumSessions[0];
    const test_window_1 = await Window.existing(session.driver, "TEST1");
    const test_window_2 = await Window.openNew(session.driver, "TEST2");
    await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, attendee_id, session));
    await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, remote_attendee_id, session));
    await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await test_window_1.runCommands(async () => await ClickBackgroundReplacementButton.executeStep(this, session));
    await test_window_1.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
    await test_window_2.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
    await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));   
    await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));   
    await test_window_1.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
    await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
    await this.waitAllSteps();
  }
}

module.exports = BackgroundReplacementTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundReplacementTest('Background Replacement Test', kiteConfig);
  await test.run();
})();
