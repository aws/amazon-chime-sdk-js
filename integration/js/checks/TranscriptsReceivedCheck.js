const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class TranscriptsReceivedCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, isMedicalTranscribe, compareContentForSpeakerFn) {
    super(kiteBaseTest, sessionInfo);
    this.expectedTranscriptContentBySpeaker = expectedTranscriptContentBySpeaker;
    this.isMedicalTranscribe = isMedicalTranscribe;
    this.compareContentForSpeakerFn = compareContentForSpeakerFn;
  }

  static async executeStep(KiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, isMedicalTranscribe, compareContentForSpeakerFn) {
    const step = new TranscriptsReceivedCheck(KiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, isMedicalTranscribe, compareContentForSpeakerFn);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if transcripts were received and appeared on the page';
  }

  metricName() {
    return 'TranscriptionReceivedCheck'
  }

  async run() {
    if (!await this.page.checkTranscriptsFromLastStart(this.expectedTranscriptContentBySpeaker, this.isMedicalTranscribe, this.compareContentForSpeakerFn)) {
      throw new KiteTestError(Status.FAILED, 'Expected transcripts do not appear on the page');
    }
  }
}

module.exports = TranscriptsReceivedCheck;
