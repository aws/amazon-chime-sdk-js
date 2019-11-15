const {Builder, Capabilities, logging} = require('selenium-webdriver');

const getPlatformName = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      return 'macOS 10.14';
    case 'WINDOWS':
      return 'Windows 10';
    default:
      return '';
  }
};


const getFirefoxCapabilities = (capabilities) => {
  return {
    platformName: getPlatformName(capabilities),
    browserName: 'Firefox',
    browser_version: capabilities.version,
    resolution: '1920x1080',
    'moz:firefoxOptions': {
      args: [
        "-start-debugger-server",
        "9222"
      ],
      prefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
        'devtools.chrome.enabled': true,
        'devtools.debugger.prompt-connection': false,
        'devtools.debugger.remote-enabled': true
      },
    },
    'loggingPrefs': {
      performance: 'ALL',
      browser: 'ALL',
      driver: 'ALL'
    },
    'sauce:options': getSauceLabsConfig(capabilities)
  };
};

const getChromeCapabilities = capabilities => {
  let cap = Capabilities.chrome();
  var prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  prefs.setLevel(logging.Type.DRIVER, logging.Level.ALL);
  prefs.setLevel(logging.Type.CLIENT, logging.Level.ALL);
  prefs.setLevel(logging.Type.SERVER, logging.Level.ALL);
  cap.set('platformName', getPlatformName(capabilities));
  cap.setLoggingPrefs(prefs);
  cap.setBrowserVersion(capabilities.version);
  cap.set('goog:chromeOptions', {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  cap.set('resolution', '1920x1080');
  cap.set('sauce:options', getSauceLabsConfig(capabilities));
  return cap
};

const getSauceLabsConfig = (capabilities) => {
  return {
    name: capabilities.name,
    tags: [capabilities.name],
    seleniumVersion: '3.141.59',
    extendedDebugging: true,
    capturePerformance: true,
    crmuxdriverVersion: 'beta',
    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
  }
};

const getSauceLabsUrl = () => {
  return (
    'https://' +
    process.env.SAUCE_USERNAME +
    ':' +
    process.env.SAUCE_ACCESS_KEY +
    '@ondemand.saucelabs.com:443/wd/hub'
  );
};

getWebDriverSauceLabs = async capabilities => {
  console.log(getSauceLabsUrl());
  let cap = {};
  if (capabilities.browserName === 'chrome') {
    cap = getChromeCapabilities(capabilities);
  } else {
    cap = getFirefoxCapabilities(capabilities);
  }
  return await new Builder()
    .usingServer(getSauceLabsUrl())
    .withCapabilities(cap)
    .forBrowser(capabilities.browserName)
    .build();
};

module.exports.getWebDriverSauceLabs = getWebDriverSauceLabs;
