const {OpenAppStep, AuthenticateUserStep, WaitForMeetingToBeCreated, JoinMeetingStep, WaitForRemoteParticipantsToJoinMeeting } = require('./steps');
const {VoiceFocusOfferedCheck, UserAuthenticationCheck, UserJoinedMeetingCheck, RosterCheck } = require('./checks');
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
class VoiceFocusEnabledTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "Voice Focus");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 1;
    const session = this.seleniumSessions[0];
    const attendeeID = uuidv4();

    await OpenAppStep.executeStep(this, session);

    // Join with Web Audio.
    await AuthenticateUserStep.executeStep(this, session, attendeeID, false, true);
    await UserAuthenticationCheck.executeStep(this, session);
    await VoiceFocusOfferedCheck.executeStep(this, session, 'OFFERED');

    // Click the checkbox.
    await session.page.enableVoiceFocusInLobby();

    await JoinMeetingStep.executeStep(this, session);
    await UserJoinedMeetingCheck.executeStep(this, session, attendeeID);

    // It should be enabled in the menu.
    await session.page.clickOnMicrophoneDropDownButton();
    if (!await session.page.isVoiceFocusPresentInDeviceMenu()) {
      throw new Error('Voice Focus not present in menu.');
    }
    if (!await session.page.isVoiceFocusEnabled()) {
      throw new Error('Voice Focus not enabled.');
    }

    await this.waitAllSteps();
  }
}

module.exports = VoiceFocusEnabledTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VoiceFocusEnabledTest('Voice Focus test', kiteConfig);
  await test.run();
})();
