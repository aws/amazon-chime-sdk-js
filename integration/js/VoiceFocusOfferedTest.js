const {OpenAppStep, AuthenticateUserStep } = require('./steps');
const {VoiceFocusOfferedCheck, UserAuthenticationCheck } = require('./checks');
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

/*
* 1. Starts a meeting.
* 2. Enters the lobby without Web Audio.
* 3. Verifies that Voice Focus is not offered.
* 4. Reloads the page.
* 5. Enters the lobby with Web Audio.
* 6. Verifies that Voice Focus is offered.
* */
class VoiceFocusOfferedTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Voice Focus");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 1;
    const session = this.seleniumSessions[0];

    const attendeeID = uuidv4();

    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeID, false, false);
    await UserAuthenticationCheck.executeStep(this, session);
    await VoiceFocusOfferedCheck.executeStep(this, session, 'NOT_OFFERED');

    await session.driver.navigate().refresh();
    session.page.findAllElements();

    await OpenAppStep.executeStep(this, session);
    await AuthenticateUserStep.executeStep(this, session, attendeeID, false, true);
    await UserAuthenticationCheck.executeStep(this, session);
    await VoiceFocusOfferedCheck.executeStep(this, session, 'OFFERED');

    await this.waitAllSteps();
  }
}

module.exports = VoiceFocusOfferedTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VoiceFocusOfferedTest('Voice Focus test', kiteConfig);
  await test.run();
})();
