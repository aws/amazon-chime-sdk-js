const AppTestStep = require("../utils/AppTestStep");
const {KiteTestError, Status} = require("kite-common");

class SendingAudioFailureAndRecoveryCheck extends AppTestStep {
    constructor(kiteBaseTest, sessionInfo, expectedEvent, waitTimeMs) {
        super(kiteBaseTest, sessionInfo);
        this.expectedEvent = expectedEvent;
        this.waitTimeMs = waitTimeMs;
    }

    static async executeStep(KiteBaseTest, sessionInfo, expectedEvent, waitTimeMs) {
        const step = new SendingAudioFailureAndRecoveryCheck(KiteBaseTest, sessionInfo, expectedEvent, waitTimeMs);
        await step.execute(KiteBaseTest);
    }

    stepDescription() {
        return 'Check the sending audio failure/recovery events are working';
    }

    async run() {
        const passed = await this.page.sendingAudioCheck(this, this.expectedEvent, this.waitTimeMs);
        if (!passed) {
            throw new KiteTestError(Status.FAILED, 'Sending audio failure/recovery check failed');
        }
        this.finished("sending_audio_failure_and_recovery_check_complete");
    }
}

module.exports = SendingAudioFailureAndRecoveryCheck;
