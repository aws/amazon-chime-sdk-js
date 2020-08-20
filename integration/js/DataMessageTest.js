const {SendDataMessage} = require('./steps');
const {DataMessageCheck, RosterCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

/*
* 1. First participant joins the meeting
* 2. First participant sends a message
* 3. Checks that the first message shows up in the first participant's message box
* 4. Second participant joins a meeting
* 5. Checks that the first message shows up in the second participant's message box
* 6. Second participant sends a message
* 7. Checks that the second message shows up in the second participant's message box
* 8. Checks that the second message shows up in the first participant's message box
* */
class DataMessageTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "DataMessageCheck");
  }

  async runIntegrationTest() {
    if (this.numberOfSessions() > 1) {
      await this.runTestOnMultipleSessions()
    } else {
      await this.runTestOnSingleSessions()
    }
  }

  async runTestOnMultipleSessions() {
    const test_attendee_id_1 = uuidv4();
    const test_attendee_id_2 = uuidv4();

    const testSession1 = this.seleniumSessions[0];
    testSession1.setSessionName("TEST1");
    const testSession2 = this.seleniumSessions[1];
    testSession2.setSessionName("TEST2");

    await SdkTestUtils.addUserToMeeting(this, test_attendee_id_1, testSession1);
    await RosterCheck.executeStep(this, testSession1, 1);
    await SendDataMessage.executeStep(this, testSession1, 'Test message 1');
    await DataMessageCheck.executeStep(this, testSession1, 'Test message 1');

    await SdkTestUtils.addUserToMeeting(this, test_attendee_id_2, testSession2);
    await RosterCheck.executeStep(this, testSession2, 2);
    await DataMessageCheck.executeStep(this, testSession1, 'Test message 1');

    await SendDataMessage.executeStep(this, testSession2, 'Test message 2');
    await DataMessageCheck.executeStep(this, testSession2, 'Test message 2');
    await DataMessageCheck.executeStep(this, testSession1, 'Test message 2');
  }

  async runTestOnSingleSessions() {
    const session = this.seleniumSessions[0];
    const test_attendee_id_1 = uuidv4();
    const test_attendee_id_2 = uuidv4();

    const test_window_1 = await Window.existing(session.driver, "TEST1");
    const test_window_2 = await Window.openNew(session.driver, "TEST2");

    await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_1, session));
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 1));
    await test_window_1.runCommands(async () => await SendDataMessage.executeStep(this, session, 'Test message 1'));
    await test_window_1.runCommands(async () => await DataMessageCheck.executeStep(this, session, 'Test message 1'));

    await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_2, session));
    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window_2.runCommands(async () => await DataMessageCheck.executeStep(this, session, 'Test message 1'));

    await test_window_2.runCommands(async () => await SendDataMessage.executeStep(this, session, 'Test message 2'));
    await test_window_2.runCommands(async () => await DataMessageCheck.executeStep(this, session, 'Test message 2'));
    await TestUtils.waitAround(1000);
    await test_window_1.runCommands(async () => await DataMessageCheck.executeStep(this, session, 'Test message 2'));
  }
}

module.exports = DataMessageTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new DataMessageTest('Data message test', kiteConfig);
  await test.run();
})();