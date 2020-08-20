const {Reconnect, ClickVideoButton, CloseAppStep} = require('./steps');
const {RosterCheck, RemoteVideoCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

/*
* 1. First participant joins the meeting
* 2. First participant enables his video
* 3. Second participant joins a meeting
* 4. Checks that the second participant can see the first participant's video
* 5. Second participant enables his video
* 6. Checks that the first participant can see the second participant's video
* 7. Trigger reconnect for the first participant
* 8. Checks that the first participant can see the second participant's video
* 9. Close the window for the second participant
* 10. Checks that the first participant no longer see the second participant's video
* */
class ReconnectionTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "ReconnectionCheck");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;
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
    await ClickVideoButton.executeStep(this, testSession1);

    await SdkTestUtils.addUserToMeeting(this, test_attendee_id_2, testSession2);
    await RosterCheck.executeStep(this, testSession2, 2);

    await RemoteVideoCheck.executeStep(this, testSession2, 'VIDEO_ON');
    await ClickVideoButton.executeStep(this, testSession2);

    await RemoteVideoCheck.executeStep(this, testSession1, 'VIDEO_ON');
    await Reconnect.executeStep(this, testSession1);
    await TestUtils.waitAround(3000);

    await RemoteVideoCheck.executeStep(this, testSession1, 'VIDEO_ON');

    await CloseAppStep.executeStep(this, testSession2);
    await RemoteVideoCheck.executeStep(this, testSession1, 'VIDEO_OFF');
  }

  async runTestOnSingleSessions() {
    const session = this.seleniumSessions[0];
    const test_attendee_id_1 = uuidv4();
    const test_attendee_id_2 = uuidv4();

    const test_window_1 = await Window.existing(session.driver, "TEST1");
    const test_window_2 = await Window.openNew(session.driver, "TEST2");

    await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_1, session));
    await test_window_1.runCommands(async () => await RosterCheck.executeStep(this, session, 1));
    await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));

    await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, test_attendee_id_2, session));
    await test_window_2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));
    await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));
    await test_window_2.runCommands(async () => await ClickVideoButton.executeStep(this, session));

    await test_window_1.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    await test_window_1.runCommands(async () => await Reconnect.executeStep(this, session));
    await TestUtils.waitAround(3000);

    await test_window_1.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    await test_window_2.close();
    await test_window_1.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));
  }
}

module.exports = ReconnectionTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ReconnectionTest('Reconnection test', kiteConfig);
  await test.run();
})();