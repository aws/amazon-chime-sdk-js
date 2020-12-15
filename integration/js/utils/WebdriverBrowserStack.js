const {Builder} = require('selenium-webdriver');
const {getBuildId, getRunDetails} = require('./BrowserStackLogs');
const {AppPage} = require('../pages/AppPage');
const {MeetingReadinessCheckerPage} = require('../pages/MeetingReadinessCheckerPage');
const { MessagingSessionPage } = require('../pages/MessagingSessionPage');
const { TestAppPage } = require('../pages');

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
    'https://' +
    process.env.BROWSER_STACK_USERNAME +
    ':' +
    process.env.BROWSER_STACK_ACCESSKEY +
    '@hub-cloud.browserstack.com/wd/hub'
  );
};

class BrowserStackSession {
  static async createSession(capabilities, appName) {
    let cap = {};
    if (capabilities.browserName === 'chrome') {
      cap = getChromeCapabilities(capabilities);
    } else {
      cap = getFirefoxCapabilities(capabilities);
    }
    const driver = await new Builder()
      .usingServer(getBrowserStackUrl())
      .withCapabilities(cap)
      .build();
    return new BrowserStackSession(driver, appName);
  }

  constructor(inDriver, appName) {
    this.driver = inDriver;
    this.appName = appName;
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
      switch (this.appName) {
        case 'meetingReadinessChecker':
          this.page = new MeetingReadinessCheckerPage(this.driver, this.logger);
          break;
        case 'messagingSession':
          this.page = new MessagingSessionPage(this.driver, this.logger);
          break;
        case 'testApp':
          this.page = new TestAppPage(this.driver, this.logger);
          break;
        default:
          this.page = new AppPage(this.driver, this.logger);
          break;
      }
    }
  }

  async updateTestResults(passed) {
    // todo: we are not using browserstack currently so this is not implemented
  };

  async printRunDetails() {
    const sessionId = await this.getSessionId();
    const buildId = await getBuildId();
    console.log(JSON.stringify({
      build_details: {
        buildId,
        sessionId
      }
    }));
    const run_details = await getRunDetails(sessionId);
    console.log("Browserstack run details :");
    console.log(JSON.stringify(run_details))
  }

  async quit() {
    await this.driver.quit();
  }
}

module.exports.BrowserStackSession = BrowserStackSession;
module.exports.getOS = getOS;
module.exports.getOSVersion = getOSVersion;
