const {Builder, Capabilities, logging} = require('selenium-webdriver');
const safari = require('../node_modules/selenium-webdriver/safari');
const axios = require('axios');
const Base64 = require('js-base64').Base64;
const { AppPage, MeetingReadinessCheckerPage, MessagingSessionPage, TestAppPage } = require('../pages');

const SAUCE_LAB_DOMAIN = 'us-west-1.saucelabs.com';
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
      return 'Linux Beta';
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

  if (capabilities.platform.toUpperCase() === 'LINUX') {
    chromeOptions['args'].push('--enable-features=WebRTCPipeWireCapturer')
  }

  /**
   * Recently, SauceLabs loads the web page in test and runs into "Your connection is not private" error.
   * Content share test is also failing with WebSocket connection failed issues which SauceLabs says may
   * be related.
   *
   * Per SauceLabs suggestion add '--ignore-certificate-errors' to all tests and
   * few explicit ones for content share test as most errors are on MAC platform.
   */
  chromeOptions.args.push('--ignore-certificate-errors');
  if (capabilities.platform.toUpperCase() === 'MAC' && capabilities.name.includes('ContentShare')) {
    const args = [
      "start-maximized",
      "disable-infobars",
      "ignore-gpu-blacklist",
      "test-type",
      "disable-gpu"
    ];
    chromeOptions.args = [...chromeOptions.args, ...args];
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
  return (name.includes(blurName) || name.includes(repName)) ?  process.env.PRE_RUN_SCRIPT_URL : "";
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
    ...(!((capabilities.name).includes('ContentShare')) && {
      screenResolution: '1280x960',
    }),
    tunnelIdentifier: process.env.JOB_ID,
    ...((capabilities.platform.toUpperCase() !== 'LINUX' &&
      !((capabilities.name).includes('ContentShare'))) && {
        extendedDebugging: true
      }),
      prerun : prerunScript
  }
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
    const domain = SAUCE_LAB_DOMAIN;
    const driver = await new Builder()
      .usingServer(getSauceLabsUrl(domain))
      .withCapabilities(cap)
      .forBrowser(capabilities.browserName)
      .build();

    // Selenium is supposed to have a default timeout of 30 seconds, but on IOS Safari
    // it is undefined. This will override the timeout in this case or any similar cases.
    const defaultTimeout = 30000;
    let timeouts = await driver.manage().getTimeouts()
    if (timeouts.script == undefined || timeouts.script < defaultTimeout) {
      await driver.manage().setTimeouts({script: defaultTimeout})
    }

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
