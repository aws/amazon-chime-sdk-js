const config = {
  firefoxOptions: {
    browserName: 'firefox',
    'moz:firefoxOptions': {
      args: process.env.HEADLESS_MODE === 'true' ? 
        ['-start-debugger-server', '9222', '-headless'] : 
        ['-start-debugger-server', '9222'],
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
      args: process.env.HEADLESS_MODE === 'true' ? 
        [
          '--use-fake-device-for-media-stream', 
          '--use-fake-ui-for-media-stream',
          '--headless',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-dev-shm-usage'
        ] : 
        ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    },
  },
  safariOptions: {
    browserName: 'safari',
    // Safari doesn't support headless mode
  },
  sauceOptions: {
    platformName: process.env.PLATFORM_NAME || 'macOS 13',
    browserVersion: process.env.BROWSER_VERSION || 'latest',
    'sauce:options': {
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      noSSLBumpDomains: 'all',
      extendedDebugging: true,
      screenResolution: '1280x960',
    },
  },
};

module.exports = config;
