const {TestUtils} = require('kite-common');
const BackgroundFilterTest = require("./utils/BackgroundFilterTest");

module.exports = BackgroundFilterTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new BackgroundFilterTest('Background Blur Test', kiteConfig, 'blur');
  await test.run();
})();