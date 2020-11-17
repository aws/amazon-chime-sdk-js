const {KiteBaseTest, TestUtils} = require('../node_modules/kite-common');
const {AllureTestReport} = require('../node_modules/kite-common/report');
const {SetTestBrokenStep} = require('../steps');
const {SaucelabsSession} = require('./WebdriverSauceLabs');
const {BrowserStackSession} = require('./WebdriverBrowserStack');
const {LocalSession} = require('./WebdriverLocal');
const {emitMetric} = require('./CloudWatch');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class SdkBaseTest extends KiteBaseTest {
  constructor(name, kiteConfig, testName) {
    super(name, kiteConfig);
    this.baseUrl = this.url;
    if (testName === 'ContentShareOnlyAllowTwoTest') {
      this.url += '?max-content-share=true';
    }

    if (testName === 'MessagingSessionTest') {
      this.userArn = this.payload.userArn;
    }

    this.originalURL = this.url;
    this.testReady = false;
    this.testFinish = false;
    this.testName = testName;
    this.useSimulcast = !!this.payload.useSimulcast;
    if (this.useSimulcast) {
      this.testName += 'Simulcast';
    }
    this.useVideoProcessor = !!this.payload.useVideoProcessor;
    if (this.useVideoProcessor) {
      this.testName += 'Processor';
    }
    this.capabilities["name"] = process.env.STAGE !== undefined ? `${this.testName}-${process.env.TEST_TYPE}-${process.env.STAGE}`: `${this.testName}-${process.env.TEST_TYPE}`;
    this.seleniumSessions = [];
    this.timeout = this.payload.testTimeout ? this.payload.testTimeout : 60;
    if (this.numberOfParticipant > 1) {
      this.io.emit("test_name", this.testName);
      this.io.emit("test_capabilities", this.capabilities);
      this.io.on('all_clients_ready', isReady => {
        this.testReady = !!isReady;
      });
      this.io.on("remote_video_on", (id) => {
        console.log(`[${id}] turned on video`);
        this.numVideoRemoteOn += 1;
        this.numVideoRemoteOff = Math.max(1, this.numVideoRemoteOff - 1);
      });
      this.io.on("remote_video_off", (id) => {
        console.log(`[${id}] turned off video`);
        this.numVideoRemoteOff += 1;
        this.numVideoRemoteOn = Math.max(1, this.numVideoRemoteOn - 1);
      });
      this.io.on("video_check_completed_by_other_participants", (id) => {
        console.log(`[${id}] completed video checks`);
        this.numOfParticipantsCompletedVideoCheck += 1;
      });
      this.io.on("audio_check_completed_by_other_participants", (id) => {
        console.log(`[${id}] completed audio checks`);
        this.numOfParticipantsCompletedAudioCheck += 1;
      });
      this.io.on("remote_audio_on", (id) => {
        console.log(`[${id}] turned on audio`);
        this.numRemoteAudioOn += 1;
        this.numRemoteAudioOff = Math.max(1, this.numRemoteAudioOff - 1);
      });
      this.io.on("remote_audio_off", (id) => {
        console.log(`[${id}] turned off audio`);
        this.numRemoteAudioOff += 1;
        this.numRemoteAudioOn = Math.max(1, this.numRemoteAudioOn - 1);
      });
      this.io.on("failed", () => {
        console.log("[OTHER_PARTICIPANT] test failed, quitting...");
        this.remoteFailed = true;
      });
      this.io.on("participant_count", count => {
        console.log("Number of participants on the meeting: " + count);
        this.numRemoteJoined = count;
      });
      this.io.on("meeting_created", meetingId => {
        this.meetingCreated = true;
        this.meetingTitle = meetingId;
        this.url = this.originalURL + '?m=' + this.meetingTitle;
      });
      this.io.on("finished", () => {
        this.testFinish = true;
      });
    }
  }

  initializeState() {
    this.failedTest = false;
    this.numVideoRemoteOn = 1;
    this.numVideoRemoteOff = 1;
    this.numOfParticipantsCompletedVideoCheck = 1;
    this.numOfParticipantsCompletedAudioCheck = 1;
    this.numRemoteAudioOn = 1;
    this.numRemoteAudioOff = 1;
    this.remoteFailed = false;
    this.numRemoteJoined = 0;
    this.meetingCreated = false;
    //Reset the status so KITE does not skip all the steps in next run
    this.report = new AllureTestReport(this.name);
    if (this.io !== undefined) {
      this.attendeeId = uuidv4();
      console.log("attendee id generated: " + this.attendeeId);
      this.io.emit("setup_test", this.baseUrl, this.attendeeId);
    } else {
      this.meetingTitle = uuidv4();
      if (this.originalURL.indexOf('?') !== -1) {
        this.url = this.originalURL + '&m=' + this.meetingTitle;
      } else {
        this.url = this.originalURL + '?m=' + this.meetingTitle;
      }
    }
  }

  async createSeleniumSession(capabilities) {
    if (process.env.SELENIUM_GRID_PROVIDER === "browserstack") {
      const session = await BrowserStackSession.createSession(capabilities, this.getAppName());
      return session;
    } else if (process.env.SELENIUM_GRID_PROVIDER === "local") {
      const session = await LocalSession.createSession(capabilities, this.remoteUrl, this.getAppName());
      return session;
    } else {
      const invalidSessionIdRegEx = new RegExp(/^new_request:/);
      for (let i =0; i< 3; i++) {
        const session = await SaucelabsSession.createSession(capabilities, this.getAppName());
        const sessionId = await session.getSessionId();
        if (invalidSessionIdRegEx.test(sessionId)) {
          console.log(`Invalid Saucelabs session id : ${sessionId}. Retrying: ${i+1}`);
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.log(`Successfully create a Saucelabs session: ${sessionId}`);
          if (this.isMobilePlatform()) {
            this.capabilities.deviceName = await session.getDeviceName();
            console.log(`Using device: ${this.capabilities.deviceName}`);
            const testMobileURL = await session.getMobileTestRunURL();
            console.log(`Test report URL: ${testMobileURL}`);
          }
          return session;
        }
      }
      throw new Error('Failed to create Selenium session');
    }
  }

  async initializeSeleniumSession(numberOfSeleniumSessions) {
    console.log(`Provisioning ${numberOfSeleniumSessions} sessions on ${process.env.SELENIUM_GRID_PROVIDER}`);
    this.seleniumSessions = [];
    for (let i = 0; i < numberOfSeleniumSessions; i++) {
      try {
        const session = await this.createSeleniumSession(this.capabilities);
        await session.init();
        this.seleniumSessions.push(session);
      } catch (e) {
        console.log('Failed to initialize');
        console.log(e);
        await this.updateSeleniumTestResult(false);
        await this.quitSeleniumSessions();
        await emitMetric('Common', this.capabilities, 'SeleniumInit', 0);
        throw(e);
      }
    }
    emitMetric('Common', this.capabilities, 'SeleniumInit', 1);
    return true;
  }

  numberOfSessions() {
    if (this.payload.seleniumSessions && (this.payload.seleniumSessions[this.capabilities.browserName])){
      return this.payload.seleniumSessions[this.capabilities.browserName]
    }
    if (this.payload.seleniumSessions && (this.payload.seleniumSessions[this.capabilities.platform])){
      return this.payload.seleniumSessions[this.capabilities.platform]
    }
    return 1;
  }

  writeCompletionTimeTo(filePath) {
    try {
      const epochTimeInSeconds = Math.round(new Date().getTime() / 1000);
      fs.appendFileSync(`${filePath}/last_run_timestamp`, `${epochTimeInSeconds}\n`, {flag: 'a+'});
      console.log(`Wrote canary completion timestamp : ${epochTimeInSeconds}`);
    } catch (e) {
      console.log(`Failed to write last completed canary timestamp to a file : ${e}`)
    }
  }

  async testScript() {
    const maxRetries = this.payload.retry === undefined || this.payload.retry < 1 ? 5 : this.payload.retry;
    const numberOfSeleniumSessions = this.numberOfSessions();

    let retryCount = 0;
    while (retryCount < maxRetries) {
      if (retryCount !== 0) {
        console.log(`Retrying : ${retryCount}`);
      }
      try {
        if (!await this.initializeSeleniumSession(numberOfSeleniumSessions)) {
          await emitMetric(this.testName, this.capabilities, 'E2E', 0);
          return;
        }

        //Wait for other to be ready
        if (this.numberOfParticipant > 1 && this.io) {
          this.io.emit('test_ready', true);
          await this.waitForTestReady();
          if (!this.testReady) {
            this.io.emit('test_ready', false);
            console.log('[OTHER_PARTICIPANT] failed to be ready');
            this.remoteFailed = true;
            return;
          }
        }
        this.testFinish = false;
        this.initializeState();
        console.log("Running test on: " + process.env.SELENIUM_GRID_PROVIDER);
        await this.runIntegrationTest();
      } catch (e) {
        console.error(e);
        this.failedTest = true;
        await SetTestBrokenStep.executeStep(this, 'Error exception when running test');
      } finally {
        await this.closeCurrentTest(!this.failedTest && !this.remoteFailed);
      }
      if (this.payload.canaryLogPath !== undefined) {
        this.writeCompletionTimeTo(this.payload.canaryLogPath)
      }
      // Retry if the local or remote test failed
      if (!this.failedTest && !this.remoteFailed) {
        break;
      }
      if (this.numberOfParticipant > 1 && this.io) {
        this.io.emit('test_ready', false);
        if (!this.testFinish) {
          console.log('[OTHER_PARTICIPANT] timed out')
          break;
        }
      }
      retryCount++;
    }
  }

  async runIntegrationTest() {
  }

  async waitForTestReady() {
    const maxWaitTime = 60*1000 //1 min since SauceLabs timeout after 90s
    const interval = 100;
    let waitTime = 0;
    while (waitTime < maxWaitTime) {
      if (this.testReady) {
        return;
      }
      console.log(`Waiting for others: ${waitTime}`);
      waitTime += interval;
      await TestUtils.waitAround(interval);
    }
  }

  async updateSeleniumTestResult(testResult) {
    for (let i = 0; i < this.seleniumSessions.length; i++) {
      await this.seleniumSessions[i].updateTestResults(testResult);
    }
  }

  async quitSeleniumSessions() {
    for (let i = 0; i < this.seleniumSessions.length; i++) {
      await this.seleniumSessions[i].quit();
    }
  }

  async printRunDetails(testResult) {
    for (let i = 0; i < this.seleniumSessions.length; i++) {
      await this.seleniumSessions[i].printRunDetails(testResult)
    }
  }

  async closeCurrentTest(testResult) {
    try {
      await this.updateSeleniumTestResult(testResult);
      await emitMetric(this.testName, this.capabilities, 'E2E', testResult? 1 : 0);
      await this.printRunDetails(testResult);
    } catch (e) {
      console.log(e);
    } finally {
      await this.quitSeleniumSessions();
    }
  }

  isMobilePlatform() {
    return this.capabilities.platform === 'ANDROID' || this.capabilities.platform === 'IOS';
  }

  getAppName() {
    if(this.testName && this.testName.toLowerCase().includes('meetingreadinesschecker')) {
      return 'meetingReadinessChecker';
    } else if (this.testName && this.testName.toLowerCase().includes('messagingsession')) {
      return 'messagingSession';
    } else if (this.testName && this.testName.toLowerCase().includes('testapp')) {
      return 'testApp';
    } else {
        return 'meeting'
    };
  }
}

module.exports = SdkBaseTest;
