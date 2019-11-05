const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, EndMeetingStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RemoteAudioCheck, MeetingJoinFailedCheck} = require('./checks');
const {AppPage} = require('./pages/AppPage');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const uuidv4 = require('uuid/v4');

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
    this.page = new AppPage(this.driver);
    let attendee_id = uuidv4();
    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await UserAuthenticationCheck.executeStep(this);
    await JoinMeetingStep.executeStep(this);
    await UserJoinedMeetingCheck.executeStep(this, attendee_id);
    await EndMeetingStep.executeStep(this);

    await OpenAppStep.executeStep(this);
    await AuthenticateUserStep.executeStep(this, attendee_id);
    await MeetingJoinFailedCheck.executeStep(this);

    await this.waitAllSteps();
  }
}

module.exports = MeetingEndTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MeetingEndTest('Meeting end test', kiteConfig);
  await test.run();
})();
