const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class AuthenticateUserStep extends AppTestStep {
  constructor(kiteBaseTest, attendee_id) {
    super(kiteBaseTest);
    this.attendee_id = attendee_id;
  }

  static async executeStep(KiteBaseTest, attendee_id) {
    const step = new AuthenticateUserStep(KiteBaseTest, attendee_id);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Authenticating user';
  }

  metricName() {
    return 'UserAuthenticationStep'
  }

  async run() {
    console.log("attendee id: " + this.attendee_id);
    await this.page.enterAttendeeName(this.attendee_id);

    await this.page.authenticate();
    console.log("waiting to authenticate");
    let authenticationState = await this.page.waitForAuthentication();
    if (authenticationState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Authentication timeout');
    }
  }
}

module.exports = AuthenticateUserStep;
