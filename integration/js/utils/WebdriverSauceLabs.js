const {Builder, Capabilities, logging} = require('selenium-webdriver');
const safari = require('../node_modules/selenium-webdriver/safari');
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const { AppPage, MeetingReadinessCheckerPage, MessagingSessionPage } = require('../pages');

const getPlatformName = capabilities => {
  switch (capabilities.platform) {
    case 'MAC':
      if (capabilities.browserName === "safari") {
        return "macOS 10.13";
      }
      return 'macOS 10.14';
    case 'WINDOWS':
      return 'Windows 10';
    case 'LINUX':
      return 'Linux';
    case 'IOS':
      return 'iOS';
    case 'ANDROID':
      return 'Android';
    default:
      return '';
  }
};

const getFirefoxCapabilities = (capabilities) => {
  return {
    platformName: getPlatformName(capabilities),
    browserName: 'Firefox',
    browserVersion: capabilities.version,
    resolution: '1920x1080',
    'moz:firefoxOptions': {
      args: [
        "-start-debugger-server",
        "9222"
      ],
      prefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
        'media.peerconnection.video.h264_enabled': true,
        'media.webrtc.hw.h264.enabled': true,
        'media.webrtc.platformencoder': true,
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
    tunnelIdentifier: process.env.JOB_ID,
    ...(capabilities.platform.toUpperCase() !== 'LINUX' && {
      extendedDebugging: true
    })
  }
};

const getSauceLabsDomain = (platform)  => {
  const platformUpperCase = platform.toUpperCase();
  if (platformUpperCase === 'LINUX') {
    return 'us-east-1.saucelabs.com';
  } else if (platformUpperCase === 'ANDROID' || platformUpperCase === 'IOS') {
    return 'us1-manual.app.testobject.com';
  }
  return 'saucelabs.com';
};

const getSafariIOSConfig = (capabilities) => {
  return {
    platformName: 'iOS',
    platformVersion: capabilities.version,
    testobject_api_key: '059183B9A1A148D188B3AC5BA1ECBD52',
    deviceOrientation: 'portrait',
    name: capabilities.name,
  };
};

const getChromeAndroidConfig = capabilities => {
  return {
    platformName: 'Android',
    platformVersion: capabilities.version,
    testobject_api_key: '059183B9A1A148D188B3AC5BA1ECBD52',
    deviceOrientation: 'portrait',
    chromeOptions: {
      'args': ['use-fake-device-for-media-stream', 'use-fake-ui-for-media-stream'],
      'w3c': false
    },
    name: capabilities.name,
  };
};

const getSauceLabsUrl = (domain) => {
  if (isMobileDomain(domain)) {
    return (
      'https://us1-manual.app.testobject.com/wd/hub'
    );
  }
  return (
    'https://' +
    process.env.SAUCE_USERNAME +
    ':' +
    process.env.SAUCE_ACCESS_KEY +
    `@ondemand.${domain}:443/wd/hub`
  );
};

const isMobileDomain = (domain) => {
  return domain === 'us1-manual.app.testobject.com' ? true : false;
}

class SaucelabsSession {
  static async createSession(capabilities, appName) {
    let cap = {};
    if (capabilities.browserName === 'chrome') {
      if (capabilities.platform === 'ANDROID') {
        cap = getChromeAndroidConfig(capabilities);
      } else {
        cap = getChromeCapabilities(capabilities);
      }
    } else if (capabilities.browserName === 'firefox') {
      cap = getFirefoxCapabilities(capabilities);
    } else {
      if (capabilities.platform === 'IOS') {
        cap = getSafariIOSConfig(capabilities);
      } else {
        cap = getSafariCapabilities(capabilities);
      }
    }
    const domain = getSauceLabsDomain(capabilities.platform);
    const driver = await new Builder()
      .usingServer(getSauceLabsUrl(domain))
      .withCapabilities(cap)
      .forBrowser(capabilities.browserName)
      .build();
    return new SaucelabsSession(driver, domain, appName);
  }

  constructor(inDriver, domain, appName) {
    this.driver = inDriver;
    this.domain = domain;
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

  async getDeviceName() {
    if (isMobileDomain(this.domain) && this.deviceName === undefined) {
      const session = await this.driver.getSession();
      this.deviceName = session.getCapability('testobject_device_name');
    }
    return this.deviceName;
  }

  async getMobileTestRunURL() {
    if (isMobileDomain(this.domain) && this.mobileTestRunURL === undefined) {
      const session = await this.driver.getSession();
      this.mobileTestRunURL = session.getCapability('testobject_test_report_url');
    }
    return this.mobileTestRunURL;
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
    const sessionId = await this.getSessionId();
    console.log(`Publishing test results to saucelabs for session: ${sessionId} status: ${passed ? 'passed' : 'failed'}`);
    let url = "";
    if (isMobileDomain(this.domain)) {
      url = `https://app.testobject.com/api/rest/v2/appium/session/${sessionId}/test/`;
    } else {
      url = `https://${this.domain}/rest/v1/${process.env.SAUCE_USERNAME}/jobs/${sessionId}`;
    }
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
