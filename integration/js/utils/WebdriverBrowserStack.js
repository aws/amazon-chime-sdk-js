const {Builder} = require('selenium-webdriver');

const getOS = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      return 'OS X';
    case 'WINDOWS':
      return 'windows';
    default:
      return '';
  }
};

const getOSVersion = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      return 'Mojave';
    case 'WINDOWS':
      return '10';
    default:
      return '';
  }
};

const getFirefoxCapabilities = capabilities => {
  return {
    ...getBrowserStackOptions(capabilities),
    os: getOS(capabilities),
    os_version: getOSVersion(capabilities),
    browserName: 'Firefox',
    browser_version: capabilities.version,
    resolution: '1920x1080',
    'browserstack.selenium_version': '3.10.0',
    'moz:firefoxOptions': {
      prefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
      },
    },
  };
};

const getChromeCapabilities = capabilities => {
  return {
    ...getBrowserStackOptions(capabilities),
    os: getOS(capabilities),
    os_version: getOSVersion(capabilities),
    browserName: 'Chrome',
    browser_version: capabilities.version,
    resolution: '1920x1080',
    'browserstack.selenium_version': '3.5.2',
    chromeOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
  };
};

const getBrowserStackOptions = (capabilities) => {
  return {
    'browserstack.local': process.env.BROWSERSTACK_LOCAL_ENABLED,
    'browserstack.localIdentifier': process.env.BROWSERSTACK_LOCAL_IDENTIFIER,
    'browserstack.debug': 'true',
    'browserstack.networkLogs': capabilities.browserName === 'firefox',
    'browserstack.console': 'verbose'
  };
};

const getBrowserStackUrl = () => {
  return (
    'http://' +
    process.env.BROWSER_STACK_USERNAME +
    ':' +
    process.env.BROWSER_STACK_ACCESSKEY +
    '@hub.browserstack.com/wd/hub'
  );
};

getWebDriverBrowserStack = async capabilities => {
  let cap = {};
  if (capabilities.browserName === 'chrome') {
    cap = getChromeCapabilities(capabilities);
  } else {
    cap = getFirefoxCapabilities(capabilities);
  }
  return await new Builder()
    .usingServer(getBrowserStackUrl())
    .withCapabilities(cap)
    .build();
};

module.exports.getWebDriverBrowserStack = getWebDriverBrowserStack;
module.exports.getOS = getOS;
module.exports.getOSVersion = getOSVersion;
