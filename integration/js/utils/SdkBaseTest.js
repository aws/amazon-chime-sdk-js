const {KiteBaseTest, TestUtils} = require('../node_modules/kite-common');
const {SaucelabsSession} = require('./WebdriverSauceLabs');
const {emitMetric} = require('./CloudWatch');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

class SdkBaseTest extends KiteBaseTest {
  constructor(name, kiteConfig, testName) {
    super(name, kiteConfig);
    this.baseUrl = this.url;
    if (testName === 'ContentShareOnlyAllowTwoTest') {
      this.url = this.url + '?max-content-share=true' + '&m=' + kiteConfig.uuid;
    } else {
      this.url = this.url + '?m=' + kiteConfig.uuid;
    }
    this.meetingTitle = kiteConfig.uuid;
    this.testName = testName;
    this.testReady = false;
    this.testFinish = false;
    this.capabilities["name"] = process.env.STAGE !== undefined ? `${testName}-${process.env.TEST_TYPE}-${process.env.STAGE}`: `${testName}-${process.env.TEST_TYPE}`;
    this.seleniumSessions = [];
    this.timeout = this.payload.testTimeout ? this.payload.testTimeout : 60;
    if (this.numberOfParticipant > 1) {
      this.attendeeId = uuidv4();
      this.io.emit("test_name", testName);
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
      this.io.on("meeting_created", () => {
        this.meetingCreated = true;
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
    if (this.io !== undefined) {
      const createMeetingUrl = `${this.baseUrl}meeting?title=${this.meetingTitle}`;
      this.io.emit("setup_test", createMeetingUrl, this.attendeeId);
    }
  }

  async createSeleniumSession(capabilities) {
    const invalidSessionIdRegEx = new RegExp(/^new_request:/);
    for (let i =0; i< 3; i++) {
      const session = await SaucelabsSession.createSession(capabilities);
      const sessionId = await session.getSessionId();
      if (invalidSessionIdRegEx.test(sessionId)) {
        console.log(`Invalid Saucelabs session id : ${sessionId}. Retrying: ${i+1}`);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        console.log(`Successfully create a Saucelabs session: ${sessionId}`);
        return session;
      }
    }
    throw new Error('Failed to create Selenium session');
  }

  numberOfSessions(browser) {
    if (this.payload.seleniumSessions && this.payload.seleniumSessions[browser]){
      return this.payload.seleniumSessions[browser]
    }
    return 1;
    // return this.payload.seleniumSessions === undefined || this.payload.seleniumSessions < 1 ? 1 : this.payload.seleniumSessions;
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
    const numberOfSeleniumSessions = this.numberOfSessions(this.capabilities.browserName);

    console.log(`Provisioning ${numberOfSeleniumSessions} sessions on ${process.env.SELENIUM_GRID_PROVIDER}`);
    for (let i = 0; i < numberOfSeleniumSessions; i++) {
      try {
        const session = await this.createSeleniumSession(this.capabilities);
        await session.init();
        this.seleniumSessions.push(session)
      } catch (e) {
        console.log('Failed to initialize');
        console.log(e);
        await emitMetric(this.testName, this.capabilities, 'E2E', 0);
        await this.updateSeleniumTestResult(false);
        await this.quitSeleniumSessions();
        return;
      }
    }

    let retryCount = 0;
    while (retryCount < maxRetries) {
      //Wait for other to be ready
      if (this.numberOfParticipant > 1) {
        this.io.emit('test_ready', true);
        await this.waitForTestReady();
        if (!this.testReady) {
          this.io.emit('test_ready', false);
          await emitMetric(this.testName, this.capabilities, 'E2E', 0);
          await this.updateSeleniumTestResult(false);
          await this.quitSeleniumSessions();
          console.log('[OTHER_PARTICIPANT] failed to be ready');
          return;
        }
      }
      this.testFinish = false;
      this.initializeState();
      if (retryCount !== 0) {
        console.log(`Retrying : ${retryCount}`);
      }
      try {
        console.log("Running test on: " + process.env.SELENIUM_GRID_PROVIDER);
        await this.runIntegrationTest();
      } catch (e) {
        console.log(e);
      } finally {
        const metricValue = this.failedTest || this.remoteFailed ? 0 : 1;
        await emitMetric(this.testName, this.capabilities, 'E2E', metricValue);
        await this.updateSeleniumTestResult(!this.failedTest && !this.remoteFailed);
      }
      if (this.payload.canaryLogPath !== undefined) {
        this.writeCompletionTimeTo(this.payload.canaryLogPath)
      }
      // Retry if the local or remote test failed
      if (!this.failedTest && !this.remoteFailed) {
        break;
      }
      // If the other participant did not reach finish state then dont retry
      if (this.numberOfParticipant > 1 && !this.testFinish) {
        console.log('[OTHER_PARTICIPANT] timed out')
        this.io.emit('test_ready', false);
        break;
      }
      retryCount++;
    }

    try {
      for (let i = 0; i < this.seleniumSessions.length; i++) {
        await this.seleniumSessions[i].printRunDetails(!this.failedTest && !this.remoteFailed)
      }
    } catch (e) {
      console.log(e);
    } finally {
      await this.quitSeleniumSessions();
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
}

module.exports = SdkBaseTest;
