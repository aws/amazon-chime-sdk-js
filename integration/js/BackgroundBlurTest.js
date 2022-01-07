const {ClickBackgroundBlurButton} = require('./steps');
const {VideoBackgroundBlurCheck} = require('./checks');
const {TestUtils} = require('kite-common');
const BackgroundFilterBaseTest = require('./utils/BackgroundFilterBaseTest');

class BackgroundBlurTest extends BackgroundFilterBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig);
  }

  async clickBackgroundFilterButton(test_run_info)  {
    const {test_window_1, session} = test_run_info;
    await test_window_1.runCommands(async () => await ClickBackgroundBlurButton.executeStep(this, session));
  }

  async checkBackgroundFilter(test_run_info) {
    const {test_window_1, test_window_2, session, attendee_id} = test_run_info;
    await test_window_1.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id));
    await test_window_2.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id));
  }
}

module.exports = BackgroundBlurTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundBlurTest('Background Blur Test', kiteConfig);
  await test.run();
})();
