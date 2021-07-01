const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, EndMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RosterCheck} = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

/*
* 1. Starts a meeting with event reporting enabled.
* 2. Adds participants to the meeting.
* 3. Check if user joined correctly.
* 4. End meeting.
* */
class EventReportingTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "EventReporting");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendee_id, false, false, true);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendee_id);
    await RosterCheck.executeStep(this, session, 1);
    await EndMeetingStep.executeStep(this, session);
    await this.waitAllSteps();
  }
}

module.exports = EventReportingTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new EventReportingTest('Event reporting test', kiteConfig);
  await test.run();
})();