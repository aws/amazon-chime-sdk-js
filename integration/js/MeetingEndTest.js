const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, EndMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RosterCheck, MeetingJoinFailedCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

/*
* 1. Starts a meeting
* 2. Adds a participants to the meeting
* 3. Ends the meeting
* 4. Checks if more participants can be added to the same meeting that has ended
* */
class MeetingEndTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "MeetingEnd");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendee_id);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendee_id);
    await RosterCheck.executeStep(this, session, 1);
    await EndMeetingStep.executeStep(this, session);
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendee_id);
    await MeetingJoinFailedCheck.executeStep(this, session);

    await this.waitAllSteps();
  }
}

module.exports = MeetingEndTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingEndTest('Meeting end test', kiteConfig);
  await test.run();
})();
