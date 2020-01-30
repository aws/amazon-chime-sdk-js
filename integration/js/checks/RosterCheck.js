const {KiteTestError, Status, TestUtils} = require('kite-common');
const demo = require('../pages/AppPage');
const AppTestStep = require('../utils/AppTestStep');

class RosterCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, numberOfParticipant) {
    super(kiteBaseTest, sessionInfo);
    this.numberOfParticipant = numberOfParticipant;
  }

  static async executeStep(KiteBaseTest, sessionInfo, numberOfParticipant) {
    const step = new RosterCheck(KiteBaseTest, sessionInfo, numberOfParticipant);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if all the users are on roster';
  }

  metricName() {
    return 'RosterCheck'
  }

  emitMetricToCommonNamespace() {
    return true
  }

  async run() {
    const rosterCheckPassed = await this.page.rosterCheck(this.numberOfParticipant);
    if (!rosterCheckPassed) {
      throw new KiteTestError(Status.FAILED, 'Participants are not present on the roster');
    }
  }
}

module.exports = RosterCheck;
