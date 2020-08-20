const {ClickContentShareButton, LeaveMeetingStep} = require('./steps');
const {ContentShareVideoCheck, RosterCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

class MeetingLeaveContentShareTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MeetingLeaveContentShareCheck");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    const test_attendee_id = uuidv4();
    const monitor_attendee_id = uuidv4();

    const test_window = await Window.existing(session.driver, "TEST");
    const monitor_window = await Window.openNew(session.driver, "MONITOR");

    await test_window.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id, session));
    await monitor_window.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, monitor_attendee_id, session));

    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    await test_window.runCommands(async () => await ClickContentShareButton.executeStep(this, session, "ON"));
    await TestUtils.waitAround(5000);
    await test_window.runCommands(async () => await RosterCheck.executeStep(this, session, 3));
    await test_window.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id));
    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 3));
    await monitor_window.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id));

    await test_window.runCommands(async () => await LeaveMeetingStep.executeStep(this, session));
    await TestUtils.waitAround(5000);
    await monitor_window.runCommands(async () => await RosterCheck.executeStep(this, session, 1));
    await monitor_window.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "OFF", test_attendee_id));
  }
}

module.exports = MeetingLeaveContentShareTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingLeaveContentShareTest('Meeting leave content share test', kiteConfig);
  await test.run();
})();