const {TestUtils} = require('kite-common');
const BackgroundFilterBaseTest = require("./utils/BackgroundFilterBaseTest");

const {ClickBackgroundBlurButton} = require('./steps');
const {VideoBackgroundBlurCheck} = require('./checks');

class BackgroundBlurTest extends BackgroundFilterBaseTest {
  constructor(kiteConfig) {
    super('Background Blur Test', kiteConfig, 'blur');
  }

  async clickBackgroundFilterButton(test_run_info) {
    const {test_window_1, session} = test_run_info;
    await test_window_1.runCommands(async () => await ClickBackgroundBlurButton.executeStep(this, session));
  }

  async checkBackgroundFilter(test_run_info) {
    const {test_window_1, test_window_2, attendee_id, session} = test_run_info;
    await test_window_1.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id, this.filter_type));
    await test_window_2.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id, this.filter_type));
  }
}

module.exports = BackgroundBlurTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundBlurTest(kiteConfig);
  await test.run();
})();