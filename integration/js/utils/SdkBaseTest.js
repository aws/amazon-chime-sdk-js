const {KiteBaseTest} = require('../node_modules/kite-common');
const {AppPage} = require('../pages/AppPage');
const {SaucelabsSession} = require('./WebderiverSauceLabs');
const {BrowserStackSession} = require('./WebdriverBrowserStack');
const {emitMetric} = require('./CloudWatch');
const uuidv4 = require('uuid/v4');

class SdkBaseTest extends KiteBaseTest {
  constructor(name, kiteConfig, testName) {
    super(name, kiteConfig);
    this.baseUrl = this.url;
    this.url = this.url + '?m=' + kiteConfig.uuid;
    this.meetingTitle = kiteConfig.uuid;
    this.testName = testName;
    this.capabilities["name"] = `${testName}-${process.env.TEST_TYPE}`;
    this.timeout = this.payload.testTimeout ? this.payload.testTimeout : 60;
    if (this.numberOfParticipant > 1) {
      this.attendeeId = uuidv4();
      this.io.emit("test_name", testName);
      this.io.emit("test_capabilities", this.capabilities);
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
    if (process.env.SELENIUM_GRID_PROVIDER === "browserstack") {
      return await BrowserStackSession.createSession(capabilities);
    } else {
      return await SaucelabsSession.createSession(capabilities);
    }
  }

  numberOfSessions(browser) {
    if (this.payload.seleniumSessions && this.payload.seleniumSessions[browser]){
      return this.payload.seleniumSessions[browser]
    }
    return 1;
    // return this.payload.seleniumSessions === undefined || this.payload.seleniumSessions < 1 ? 1 : this.payload.seleniumSessions;
  }

  async testScript() {
    const maxRetries = this.payload.retry === undefined || this.payload.retry < 1 ? 5 : this.payload.retry;
    const numberOfSeleniumSessions = this.numberOfSessions(this.capabilities.browserName);

    console.log(`Provisioning ${numberOfSeleniumSessions} sessions on ${process.env.SELENIUM_GRID_PROVIDER}`);
    this.seleniumSessions = [];
    for (let i = 0; i < numberOfSeleniumSessions; i++) {
      const session = await this.createSeleniumSession(this.capabilities);
      await session.init();
      this.seleniumSessions.push(session)
    }

    let retryCount = 0;
    while (retryCount < maxRetries) {
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
        for (let i = 0; i < this.seleniumSessions.length; i++) {
          await this.seleniumSessions[i].updateTestResults(!this.failedTest && !this.remoteFailed)
        }
      }
      // Retry if the local or remote test failed
      if (!this.failedTest && !this.remoteFailed) {
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
      for (let i = 0; i < this.seleniumSessions.length; i++) {
        await this.seleniumSessions[i].quit();
      }
    }
  }

  async runIntegrationTest() {
  }
}

module.exports = SdkBaseTest;
