const {Builder, Capabilities, logging} = require('selenium-webdriver');
const safari = require('../node_modules/selenium-webdriver/safari');
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const { AppPage, MeetingReadinessCheckerPage, MessagingSessionPage, TestAppPage } = require('../pages');

const getPlatformName = capabilities => {
  const { browserName, version, platform } = capabilities;
  switch (platform) {
    case 'MAC':
      if (browserName === 'safari') {
        return version === 'latest' ? 'macOS 12' : 'macOS 10.13';
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

const getChromeOptions = capabilities => {
  let chromeOptions = {};
  if (capabilities.useFakeMedia) {
    chromeOptions['args'] = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];
    if (capabilities.video) {
      chromeOptions['args'].push('--use-file-for-fake-video-capture=' + fetchMediaPath(capabilities.video, capabilities.browserName));
    }
    if (capabilities.audio) {
      chromeOptions['args'].push('--use-file-for-fake-audio-capture=' + fetchMediaPath(capabilities.audio, capabilities.browserName));
    }
  }
  return chromeOptions;
}

const fetchMediaPath = function(media, browserName) {
  let extension;
  if (media.type === 'Video') {
    if (browserName === 'chrome') {
      extension = '.y4m';
    } else {
      extension = '.mp4';
    }
  } else {
    extension = '.wav';
  }
  return media.directory + media.filename + extension;
}

const getPrerunScript = (capabilities) =>{
  const name = capabilities.name;
  const blurName = "Background Blur Test";
  const repName = "Background Replacement Test";
  return (name.includes(blurName) || name.includes(repName)) ?  'storage:d0547958-c138-4b74-8c59-4fa51d98f5d1' : "";
}
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
  cap.set('goog:chromeOptions', getChromeOptions(capabilities));
  cap.set('resolution', '1920x1080');
  cap.set('sauce:options', getSauceLabsConfig(capabilities));
  return cap;
};

const getSauceLabsConfig = (capabilities) => {
  const prerunScript  = getPrerunScript(capabilities);
  return {
    name: capabilities.name,
    tags: [capabilities.name],
    seleniumVersion: '3.141.59',
    tunnelIdentifier: process.env.JOB_ID,
    ...((capabilities.platform.toUpperCase() !== 'LINUX' &&
      !((capabilities.name).includes('ContentShare'))) && {
        extendedDebugging: true
      }),
      prerun : prerunScript
  }
};

const getSauceLabsDomain = (platform)  => {
  const platformUpperCase = platform.toUpperCase();
  if (platformUpperCase === 'LINUX') {
    return 'us-east-1.saucelabs.com';
  }
  return 'us-west-1.saucelabs.com';
};

const getSafariIOSConfig = (capabilities) => {
  return {
    platformName: capabilities.platform,
    platformVersion: capabilities.version,
    deviceOrientation: 'portrait',
    autoAcceptAlerts: "true",
    name: capabilities.name,
  };
};

const getChromeAndroidConfig = capabilities => {

  return {
    platformName: capabilities.platform,
    platformVersion: capabilities.version,
    deviceOrientation: 'portrait',
    chromeOptions: {
      'args': ['use-fake-device-for-media-stream', 'use-fake-ui-for-media-stream'],
      'w3c': false
    },
    name: capabilities.name
  };
};

const getSauceLabsUrl = (domain) => {
  return (
    'https://' +
    process.env.SAUCE_USERNAME +
    ':' +
    process.env.SAUCE_ACCESS_KEY +
    `@ondemand.${domain}:443/wd/hub`
  );
};

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
      // This is needed to obtain the job ID from mobile tests and only works on mobile tests
      const cap = await this.driver.getCapabilities();
      const url = cap.get('testobject_test_report_api_url')
      if(url !== undefined)
      {
        this.sessionId = url.substring(url.lastIndexOf('/')+1);
      }
      else
      {
        const session = await this.driver.getSession();
        this.sessionId = session.getId();
      }
    }
    return this.sessionId
  }

  async getDeviceName() {
    if (this.deviceName === undefined) {
      const session = await this.driver.getSession();
      this.deviceName = session.getCapability('testobject_device_name');
    }
    return this.deviceName;
  }

  async getMobileTestRunURL() {
    if (this.mobileTestRunURL === undefined) {
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
    this.driver.executeScript(`sauce:job-result=${passed}`)
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
