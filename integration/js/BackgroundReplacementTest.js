const {TestUtils} = require('kite-common');
const BackgroundFilterBaseTest = require('./utils/BackgroundFilterBaseTest');

const {ClickBackgroundReplacementButton} = require('./steps');
const {VideoBackgroundBlurCheck} = require('./checks');

class BackgroundReplacementTest extends BackgroundFilterBaseTest {
  constructor(kiteConfig) {
    super('Background Replacement Test', kiteConfig, 'replacement');
  }

  async clickBackgroundFilterButton(test_run_info) {
    const {test_window_1, session} = test_run_info;
    await test_window_1.runCommands(async () => await ClickBackgroundReplacementButton.executeStep(this, session));
  }

  async checkBackgroundFilter(test_run_info) {
    await test_window_1.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id, this.filter_type));
    await test_window_2.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id, this.filter_type));
  }
}

module.exports = BackgroundReplacementTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundReplacementTest(kiteConfig);
  await test.run();
})();
