const { TestUtils } = require('kite-common');
const VideoFxBackgroundFilterBaseTest = require('./utils/VideoFxBackgroundFilterBaseTest');

const { ClickVideoFxBackgroundBlurButton, ComputeRawVideoSum } = require('./steps');
const { VideoFxBackgroundCheck } = require('./checks');

class VideoFxBackgroundBlurTest extends VideoFxBackgroundFilterBaseTest {
  constructor(kiteConfig) {
    super('Video Fx Background Blur Test', kiteConfig, 'video fx blur');
  }

  async getRawVideoSum(test_run_info) {
    const { test_window_1, attendee_id, session } = test_run_info;
    // Need a singleton array as returning the sum directory from this class isn't possible
    // without changing the implementation of TestStep in kite-common
    const raw_video_sum_singleton = [0];
    await test_window_1.runCommands(
      async () => await ComputeRawVideoSum.executeStep(this, session, attendee_id, raw_video_sum_singleton)
    );
    const raw_video_sum = raw_video_sum_singleton[0];
    return raw_video_sum;
  }

  async clickBackgroundFilterButton(test_run_info) {
    const { test_window_1, session } = test_run_info;
    await test_window_1.runCommands(
      async () => await ClickVideoFxBackgroundBlurButton.executeStep(this, session)
    );
  }

  async checkBackgroundFilter(test_run_info, raw_video_sum) {
    const { test_window_1, attendee_id, session } = test_run_info;
    await test_window_1.runCommands(
      async () =>
        await VideoFxBackgroundCheck.executeStep(this, session, attendee_id, this.filter_type, raw_video_sum)
    );
  }
}

module.exports = VideoFxBackgroundBlurTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoFxBackgroundBlurTest(kiteConfig);
  await test.run();
})();
