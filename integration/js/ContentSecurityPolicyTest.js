const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, WaitForMeetingToBeCreated, WaitForRemoteParticipantsToJoinMeeting} = require('./steps');
const {UserAuthenticationCheck, SecurityPolicyViolationCheck, UserJoinedMeetingCheck, RosterCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

/*
* 1. Starts a meeting
* 2. Adds a participants to the meeting
* 3. Checks if there are security policy violation event
* */
class ContentSecurityPolicyTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "CSPCheck");
  }

  async runIntegrationTest() {
    const session = this.seleniumSessions[0];

    await WaitForMeetingToBeCreated.executeStep(this, session);
    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, this.attendeeId);
    await UserAuthenticationCheck.executeStep(this, session);
    await JoinMeetingStep.executeStep(this, session);
    await SecurityPolicyViolationCheck.executeStep(this, session);

    await this.waitAllSteps();
  }
}

module.exports = ContentSecurityPolicyTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new ContentSecurityPolicyTest('Content Security Policy test', kiteConfig);
  await test.run();
})();
