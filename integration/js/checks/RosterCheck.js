const {KiteTestError, Status, TestUtils} = require('kite-common');
const demo = require('../pages/AppPage');
const AppTestStep = require('../utils/AppTestStep');
const RosterCheckConfig = require('./RosterCheckConfig');

class RosterCheck extends AppTestStep {

  constructor(kiteBaseTest, sessionInfo, numberOfParticipant, config) {
    super(kiteBaseTest, sessionInfo);
    this.numberOfParticipant = numberOfParticipant;
    this.config = config;
  }

  static async executeStep(KiteBaseTest, sessionInfo, numberOfParticipant, config = new RosterCheckConfig()) {
    const step = new RosterCheck(KiteBaseTest, sessionInfo, numberOfParticipant, config);
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
    const rosterCheckPassed = await this.page.rosterCheck(this.numberOfParticipant, this.config.checkCount, this.config.waitTimeMs);
    if (!rosterCheckPassed) {
      throw new KiteTestError(Status.FAILED, 'Participants are not present on the roster');
    }
  }
}

module.exports = RosterCheck;
