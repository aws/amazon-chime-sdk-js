const AppTestStep = require('../utils/AppTestStep');

class OpenAppStep extends AppTestStep {
  constructor(kiteBaseTest) {
    super(kiteBaseTest);
  }

  static async executeStep(KiteBaseTest) {
    const step = new OpenAppStep(KiteBaseTest);
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Open app';
  }

  async run() {
    console.log(`Opening : ${this.url}`);
    await this.page.open(this);
  }
}

module.exports = OpenAppStep;
