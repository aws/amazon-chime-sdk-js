const {ClickContentShareVideoTestButton, ClickContentShareButton, ClickContentSharePauseButton} = require('./steps');
const {ContentShareVideoCheck} = require('./checks');
const {RosterCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

/**
 * Test screen capture sharing check
 * 1. Turn on content sharing test video and verify that the other participant can see the screen
 * 2. Turn off screen share and verify that it is off for the other participant
 */
class ContentShareVideoTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "ContentShareVideoTest");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    const test_attendee_id_1 = uuidv4()
    const test_attendee_id_2 = uuidv4();
    const test_window_1 = await Window.existing(session.driver, "TEST1");
    const test_window_2 = await Window.openNew(session.driver, "TEST2");

    await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_1, session));
    await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_2, session));

    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    //Turn on Content Share
    await test_window_1.runCommands(async () => await ClickContentShareVideoTestButton.executeStep(this, session, "ON"));
    await TestUtils.waitAround(5000);
    await test_window_1.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id_1));
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 3));
    await test_window_2.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id_1));
    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 3));

    //Pause
    await test_window_1.runCommands(async () => await ClickContentSharePauseButton.executeStep(this, session, "ON"));
    await TestUtils.waitAround(1000);
    await test_window_1.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "PAUSE", test_attendee_id_1));
    await test_window_2.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "PAUSE", test_attendee_id_1));

    //Unpause
    await test_window_1.runCommands(async () => await ClickContentSharePauseButton.executeStep(this, session, "OFF"));
    await TestUtils.waitAround(1000);
    await test_window_1.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id_1));
    await test_window_2.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", test_attendee_id_1));

    //Turn off Content Share
    await test_window_1.runCommands(async () => await ClickContentShareButton.executeStep(this, session, "OFF"));
    await TestUtils.waitAround(5000);
    await test_window_2.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "OFF", test_attendee_id_1));
    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window_1.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "OFF", test_attendee_id_1));
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
  }
}

module.exports = ContentShareVideoTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ContentShareVideoTest('Screen capture test', kiteConfig);
  await test.run();
})();
