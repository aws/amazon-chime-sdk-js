const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class SecurityPolicyViolationCheck extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo) {
    super(kiteBaseTest, sessionInfo);
  }

  static async executeStep(KiteBaseTest, sessionInfo) {
    const step = new SecurityPolicyViolationCheck(KiteBaseTest, sessionInfo);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Check if there is security policy violation event';
  }

  metricName() {
    return 'SecurityPolicyViolationCheck'
  }

  async run() {
    if (await this.page.checkSecurityPolicyViolation(this)) {
      throw new KiteTestError(Status.FAILED, 'Unexpected CSP violation detected, failing test. See console for details');
    }
  }
}

module.exports = SecurityPolicyViolationCheck;
