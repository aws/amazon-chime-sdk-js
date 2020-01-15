const {KiteTestError, Status, TestUtils} = require('kite-common');
const demo = require('../pages/AppPage');
const AppTestStep = require('../utils/AppTestStep');

class RosterCheck extends AppTestStep {
  constructor(kiteBaseTest, numberOfParticipant) {
    super(kiteBaseTest);
    this.numberOfParticipant = numberOfParticipant;
  }

  static async executeStep(KiteBaseTest, numberOfParticipant) {
    const step = new RosterCheck(KiteBaseTest, numberOfParticipant);
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
