
const {TestUtils} = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {OpenAppStep, AuthenticateUserStep, JoinMeetingStep, SelectNoAudioInputStep, PlayPrerecordedSpeechStep} = require("./steps");
const {UserAuthenticationCheck, SendingAudioFailureAndRecoveryCheck, UserJoinedMeetingCheck} = require("./checks");
const {v4: uuidv4} = require("uuid");

class SendingAudioFailureAndRecoveryTest extends SdkBaseTest {
    constructor(name, kiteConfig) {
        super(name, kiteConfig, "Sending Audio Failure and Recovery Test");
    }

    async runIntegrationTest() {
        this.numberOfParticipant = 1;
        const session = this.seleniumSessions[0];
        const attendeeID = uuidv4();

        await OpenAppStep.executeStep(this, session);
        await AuthenticateUserStep.executeStep(this, session, attendeeID, false, false, true);
        await UserAuthenticationCheck.executeStep(this, session);
        await JoinMeetingStep.executeStep(this, session);
        await UserJoinedMeetingCheck.executeStep(this, session, attendeeID);
        await SelectNoAudioInputStep.executeStep(this, session);
        await SendingAudioFailureAndRecoveryCheck.executeStep(this, session, 'sendingAudioFailed', 4000);
        await PlayPrerecordedSpeechStep.executeStep(this, session);
        await SendingAudioFailureAndRecoveryCheck.executeStep(this, session, 'sendingAudioRecovered', 2000);
        await this.waitAllSteps();
    }
}


module.exports = SendingAudioFailureAndRecoveryTest;

(async () => {
    const kiteConfig = await TestUtils.getKiteConfig(__dirname);
    let test = new SendingAudioFailureAndRecoveryTest('Sending Audio Failure and Recovery Test', kiteConfig);
    await test.run();
})();
