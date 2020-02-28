const {Builder, Capabilities, logging} = require('selenium-webdriver');
const safari = require('../node_modules/selenium-webdriver/safari');
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const {AppPage} = require('../pages/AppPage');


const getPlatformName = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      if (capabilities.browserName === "safari") {
        return "macOS 10.13";
      }
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

const getSafariCapabilities = capabilities => {
  let cap = new safari.Options();
  cap.setTechnologyPreview(true);
  var prefs = new logging.Preferences();
  prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  prefs.setLevel(logging.Type.DRIVER, logging.Level.ALL);
  prefs.setLevel(logging.Type.CLIENT, logging.Level.ALL);
  prefs.setLevel(logging.Type.SERVER, logging.Level.ALL);
  cap.setLoggingPrefs(prefs);

  cap.set('platformName', getPlatformName(capabilities));
  cap.setBrowserVersion(capabilities.version);
  cap.set('sauce:options', getSauceLabsConfig(capabilities));
  return cap
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
    extendedDebugging: false,
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


class SaucelabsSession {
  static async createSession(capabilities) {
    let cap = {};
    if (capabilities.browserName === 'chrome') {
      cap = getChromeCapabilities(capabilities);
    } else if (capabilities.browserName === 'firefox') {
      cap = getFirefoxCapabilities(capabilities);
    } else {
      cap = getSafariCapabilities(capabilities);
    }
    const driver = await new Builder()
      .usingServer(getSauceLabsUrl())
      .withCapabilities(cap)
      .forBrowser(capabilities.browserName)
      .build();
    return new SaucelabsSession(driver);
  }

  constructor(inDriver) {
    this.driver = inDriver;
  }

  async init() {
    await this.getSessionId();
    this.name = "";
    this.logger = (message) => {
      const prefix = this.name === "" ? "" : `[${this.name} App] `;
      console.log(`${prefix}${message}`)
    };
    this.getAppPage();
  }

  async getSessionId() {
    if (this.sessionId === undefined) {
      const session = await this.driver.getSession();
      this.sessionId = session.getId();
    }
    return this.sessionId
  }

  setSessionName(inName) {
    this.name = inName;
  }

  getAppPage() {
    if (this.page === undefined) {
      this.page = new AppPage(this.driver, this.logger);
    }
    return this.page;
  }

  async updateTestResults(passed) {
    const sessionId = await this.getSessionId();
    console.log(`Publishing test results to saucelabs for session: ${sessionId} status: ${passed ? 'passed' : 'failed'}`);
    const url = `https://saucelabs.com/rest/v1/${process.env.SAUCE_USERNAME}/jobs/${sessionId}`;
    await axios.put(url, `{\"passed\": ${passed}}`, {
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json",
        "Authorization": 'Basic ' + Base64.encode(process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY)
      }
    })
  };

  async printRunDetails() {
    const sessionId = await this.getSessionId();
    const prefix = this.name === "" ? "" : `[${this.name} App] `;
    console.log(`${prefix}Saucelabs run details :`);
    console.log(JSON.stringify({
      run_details: {
        sessionId
      }
    }));
  }

  async quit() {
    await this.driver.quit();
  }
}

module.exports.SaucelabsSession = SaucelabsSession;
