const {KiteBaseTest} = require('../node_modules/kite-common');
const {AppPage} = require('../pages/AppPage');
const {getWebDriverSauceLabs} = require('./WebderiverSauceLabs');
const {getWebDriverBrowserStack} = require('./WebdriverBrowserStack');
const {getBuildId, getRunDetails} = require('./BrowserStackLogs');
const {emitMetric} = require('./CloudWatch');
const {putTestResults} = require('./SauceLabsApis');

class SdkBaseTest extends KiteBaseTest {
  constructor(name, kiteConfig, testName) {
    super(name, kiteConfig);
    this.baseUrl = this.url;
    this.url = this.url + '?m=' + kiteConfig.uuid;
    this.testName = testName;
    this.capabilities["name"] = `${testName}-${process.env.TEST_TYPE}`;
    if (this.numberOfParticipant > 1) {
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
    if (this.io !== undefined) {
      this.io.emit("test_start");
    }
  }

  seleniumGridProvide() {
    return process.env.SELENIUM_GRID_PROVIDER
  }

  async getWebDriver(capabilities) {
    if (this.seleniumGridProvide() === "browserstack") {
      return await getWebDriverBrowserStack(capabilities);
    } else {
      return await getWebDriverSauceLabs(capabilities);
    }
  }

  async printRunDetails(session_id) {
    if (this.seleniumGridProvide() === "browserstack") {
      const build_id = await getBuildId();
      console.log(JSON.stringify({
        build_details: {
          build_id,
          session_id
        }
      }));
      const run_details = await getRunDetails(session_id);
      console.log("Browserstack run details :");
      console.log(JSON.stringify(run_details))
    } else {
      console.log("Saucelabs run details :");
      console.log(JSON.stringify({
        run_details: {
          session_id
        }
      }));
    }
  }

  async testScript() {
    const maxRetries = this.payload.retry === undefined || this.payload.retry < 1 ? 5 : this.payload.retry;
    let session_id = '';
    this.driver = await this.getWebDriver(this.capabilities);
    const session = await this.driver.getSession();
    session_id = session.getId();
    let retryCount = 0;
    while (retryCount <= maxRetries) {
      this.initializeState();
      if (retryCount !== 0) {
        console.log(`Retrying : ${retryCount}`);
      }
      try {
        console.log("Running test on: " + this.seleniumGridProvide());
        this.page = new AppPage(this.driver);
        await this.runIntegrationTest();
      } catch (e) {
        console.log(e);
      } finally {
        const metricValue = this.failedTest || this.remoteFailed ? 0 : 1;
        await emitMetric(this.testName, this.capabilities, 'E2E', metricValue);
        if (this.seleniumGridProvide() === "saucelabs") {
          await putTestResults(session_id, !this.failedTest)
        }
      }
      // Retry if the local or remote test failed
      if (!this.failedTest && !this.remoteFailed) {
        break;
      }
      retryCount++;
    }

    try{
      await this.printRunDetails(session_id);
    }catch (e) {
      console.log(e);
    }finally {
      await this.driver.quit();
    }
  }

  async runIntegrationTest() {
  }
}

module.exports = SdkBaseTest;
