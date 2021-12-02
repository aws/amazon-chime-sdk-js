const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class TranscriptsReceivedCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, compareContentForSpeakerFn) {
    super(kiteBaseTest, sessionInfo);
    this.expectedTranscriptContentBySpeaker = expectedTranscriptContentBySpeaker;
    this.compareContentForSpeakerFn = compareContentForSpeakerFn;
  }

  static async executeStep(KiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, compareContentForSpeakerFn) {
    const step = new TranscriptsReceivedCheck(KiteBaseTest, sessionInfo, expectedTranscriptContentBySpeaker, compareContentForSpeakerFn);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if transcripts were received and appeared on the page';
  }

  metricName() {
    return 'TranscriptionReceivedCheck'
  }

  async run() {
    if (!await this.page.checkTranscriptsFromLastStart(this.expectedTranscriptContentBySpeaker, this.compareContentForSpeakerFn)) {
      throw new KiteTestError(Status.FAILED, 'Expected transcripts do not appear on the page');
    }
  }
}

module.exports = TranscriptsReceivedCheck;
