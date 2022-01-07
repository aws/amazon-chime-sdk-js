const {ClickBackgroundReplacementButton} = require('./steps');
const {VideoBackgroundReplacementCheck} = require('./checks');
const {TestUtils} = require('kite-common');
const BackgroundFilterBaseTest = require('./utils/BackgroundFilterBaseTest');

class BackgroundReplacementTest extends BackgroundFilterBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig);
  }

  async clickBackgroundFilterButton(test_run_info)  {
    const {test_window_1, session} = test_run_info;
    await test_window_1.runCommands(async () => await ClickBackgroundReplacementButton.executeStep(this, session));
  }

  async checkBackgroundFilter(test_run_info) {
    const {test_window_1, test_window_2, session, attendee_id} = test_run_info;
    await test_window_1.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
    await test_window_2.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
  }
}

module.exports = BackgroundReplacementTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundReplacementTest('Background Replacement Test', kiteConfig);
  await test.run();
})();
