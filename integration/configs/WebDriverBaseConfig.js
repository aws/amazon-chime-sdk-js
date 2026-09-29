const getConfig = () => {
  const platformName = process.env.PLATFORM_NAME || 'macOS 13';
  const macVersionMatch = platformName.match(/^macOS\s+(\d+)/);
  const isMacOS14OrHigher = macVersionMatch && parseInt(macVersionMatch[1], 10) >= 14;

  // Only tests that verify pixel output (e.g. background segmentation filters) need a
  // deterministic fake video source. The file lives on the machine running the test, so it is
  // only reachable when the browser is on the same host (`--host local`). On remote hosts like
  // SauceLabs the path does not exist, which breaks video device enumeration for every test.
  let testName = '';
  try {
    testName = (JSON.parse(process.env.TEST || '{}').name) || '';
  } catch (e) {
    testName = '';
  }
  const testsNeedingCustomVideoFile = ['VideoProcessingTest'];
  const useCustomVideoFile =
    process.env.HOST === 'local' && testsNeedingCustomVideoFile.includes(testName);
  const customVideoFileArgs = useCustomVideoFile
    ? ['--use-file-for-fake-video-capture=' + require('path').resolve(__dirname, '../fake_stream/output.y4m')]
    : [];

  return {
    firefoxOptions: {
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: process.env.HEADLESS_MODE === 'true'
          ? ['-start-debugger-server', '9222', '-headless']
          : ['-start-debugger-server', '9222'],
        prefs: {
          'media.navigator.streams.fake': true,
          'media.navigator.permission.disabled': true,
          'media.peerconnection.video.h264_enabled': true,
          'media.webrtc.hw.h264.enabled': true,
          'media.webrtc.platformencoder': true,
          'devtools.chrome.enabled': true,
          'devtools.debugger.prompt-connection': false,
          'devtools.debugger.remote-enabled': true,
        },
      },
    },
    chromeOptions: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args:
          process.env.HEADLESS_MODE === 'true'
            ? [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
                ...customVideoFileArgs,
                '--headless=new',
                '--window-size=1920,1080',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--enable-webgl',
                '--enable-webgl2-compute-context',
                '--use-gl=angle',
                '--use-angle=swiftshader',
              ]
            : [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
                '--disable-local-discovery',
                ...customVideoFileArgs,
                '--window-size=1920,1080',
              ],
      },
      ...(process.env.ENABLE_BROWSER_LOGGING === 'true' && { 'goog:loggingPrefs': { browser: 'ALL' } }),
    },
    safariOptions: {
      browserName: 'safari',
    },
    edgeOptions: {
      browserName: 'MicrosoftEdge',
      'ms:edgeOptions': {
        args:
          process.env.HEADLESS_MODE === 'true'
            ? [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
                '--headless=new',
                '--window-size=1920,1080',
                '--no-sandbox',
                '--disable-dev-shm-usage',
              ]
            : [
                '--use-fake-device-for-media-stream',
                '--use-fake-ui-for-media-stream',
                '--window-size=1920,1080',
              ],
      },
      ...(process.env.ENABLE_BROWSER_LOGGING === 'true' && { 'goog:loggingPrefs': { browser: 'ALL' } }),
    },
    sauceOptions: {
      browserName: process.env.BROWSER_NAME || 'chrome',
      platformName,
      browserVersion: process.env.BROWSER_VERSION || 'latest',
      'sauce:options': {
        tunnelName: process.env.JOB_ID,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        noSSLBumpDomains: 'all',
        extendedDebugging: !isMacOS14OrHigher,
        screenResolution: '1920x1440',
      },
    },
  };
};

module.exports = getConfig;
