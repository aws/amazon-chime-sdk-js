const AppTestStep = require('../utils/AppTestStep');

class SelectNoAudioInputStep extends AppTestStep {
    constructor(kiteBaseTest, sessionInfo) {
        super(kiteBaseTest, sessionInfo);
    }

    static async executeStep(KiteBaseTest, sessionInfo) {
        const step = new SelectNoAudioInputStep(KiteBaseTest, sessionInfo);
        await step.execute(KiteBaseTest);
    }

    stepDescription() {
        return 'Select No Audio in the microphone dropdown menu';
    }

    metricName() {
        return 'SelectNoAudioInputStep';
    }

    async run() {
        await this.page.clickOnMicrophoneDropDownButton();
        await this.page.selectNoAudioInput();
        this.finished("selected_no_audio_input");
    }
}

module.exports = SelectNoAudioInputStep;
