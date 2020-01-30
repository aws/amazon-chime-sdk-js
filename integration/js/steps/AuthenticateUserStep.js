const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class AuthenticateUserStep extends AppTestStep {
  constructor(kiteBaseTest, sessionInfo, attendee_id) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
  }

  static async executeStep(KiteBaseTest, sessionInfo, attendee_id) {
    const step = new AuthenticateUserStep(KiteBaseTest, sessionInfo, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Authenticating user';
  }

  metricName() {
    return 'UserAuthenticationStep'
  }

  async run() {
    this.logger("attendee id: " + this.attendee_id);
    await this.page.enterAttendeeName(this.attendee_id);

    await this.page.authenticate();
    this.logger("waiting to authenticate");
    let authenticationState = await this.page.waitForAuthentication();
    if (authenticationState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Authentication timeout');
    }
  }
}

module.exports = AuthenticateUserStep;
