const { By, until } = require('selenium-webdriver');
const { LogLevel } = require('../utils/Logger');
const { sleep } = require('../utils/HelperFunctions');

const DEFAULT_TIMEOUT_MS = 10000;
const TEST_TIMEOUT_MS = 30000;

let elements;

function findAllElements() {
  elements = {
    // Authentication flow
    authenticationFlow: By.id('flow-authenticate'),
    authenticateButton: By.id('authenticate'),
    inputRegion: By.id('inputRegion'),
    
    // Device selection
    audioInputSelect: By.id('audio-input'),
    audioOutputSelect: By.id('audio-output'),
    videoInputSelect: By.id('video-input'),
    
    // Readiness test flow
    readinessTestFlow: By.id('flow-readinesstest'),
    readinessHeader: By.id('readiness-header'),
    
    // Speaker test
    speakerTestButton: By.id('speakertest-button'),
    speakerTest: By.id('speaker-test'),
    speakerYes: By.id('speaker-yes'),
    speakerNo: By.id('speaker-no'),
    speakerUserFeedback: By.id('speaker-user-feedback'),
    
    // Test results
    micTest: By.id('mic-test'),
    videoTest: By.id('video-test'),
    cameraTest1: By.id('camera-test1'),
    cameraTest2: By.id('camera-test2'),
    cameraTest3: By.id('camera-test3'),
    networkUdpTest: By.id('networkudp-test'),
    networkTcpTest: By.id('networktcp-test'),
    audioConnectivityTest: By.id('audioconnectivity-test'),
    videoConnectivityTest: By.id('videoconnectivity-test'),
    contentShareTest: By.id('contentshare-test'),
    contentShareButton: By.id('contentshare-button'),
  };
}

class MeetingReadinessCheckerPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
    findAllElements();
  }

  async open(url) {
    this.logger.pushLogs(`Opening meeting readiness checker at url: ${url}`);
    await this.driver.get(url);
    await this.waitForPageToLoad();
  }

  async waitForPageToLoad() {
    await this.driver.wait(
      until.elementIsVisible(this.driver.findElement(elements.authenticationFlow)),
      DEFAULT_TIMEOUT_MS
    );
    this.logger.pushLogs('Meeting readiness checker page loaded');
  }

  async authenticate() {
    this.logger.pushLogs('Starting authentication for readiness checker');
    
    // Click authenticate button to start the readiness tests
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await this.driver.wait(until.elementIsEnabled(authenticateButton), DEFAULT_TIMEOUT_MS);
    await authenticateButton.click();
    
    // Wait for readiness test flow to appear
    await this.driver.wait(
      until.elementIsVisible(this.driver.findElement(elements.readinessTestFlow)),
      DEFAULT_TIMEOUT_MS * 2
    );
    
    this.logger.pushLogs('Authentication complete, readiness test flow visible', LogLevel.SUCCESS);
  }

  async runSpeakerTest() {
    this.logger.pushLogs('Running speaker test');
    
    // Wait for speaker test button to be enabled
    let speakerTestButton = await this.driver.findElement(elements.speakerTestButton);
    await this.driver.wait(until.elementIsEnabled(speakerTestButton), DEFAULT_TIMEOUT_MS);
    await speakerTestButton.click();
    
    // Wait for user feedback prompt to appear
    await sleep(2000);
    
    // Click "Yes" to indicate we can hear the audio (automated test assumes audio works)
    try {
      let speakerYes = await this.driver.findElement(elements.speakerYes);
      await speakerYes.click();
      this.logger.pushLogs('Clicked "Yes" for speaker feedback');
    } catch (error) {
      this.logger.pushLogs(`Could not click speaker feedback: ${error.message}`, LogLevel.WARN);
    }
    
    // Wait for speaker test result
    const result = await this.waitForTestResult(elements.speakerTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Speaker test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runMicTest() {
    this.logger.pushLogs('Running microphone test');
    const result = await this.waitForTestResult(elements.micTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Microphone test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runVideoTest() {
    this.logger.pushLogs('Running video test');
    const result = await this.waitForTestResult(elements.videoTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Video test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runNetworkUdpTest() {
    this.logger.pushLogs('Running network UDP test');
    const result = await this.waitForTestResult(elements.networkUdpTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Network UDP test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runNetworkTcpTest() {
    this.logger.pushLogs('Running network TCP test');
    const result = await this.waitForTestResult(elements.networkTcpTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Network TCP test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runAudioConnectivityTest() {
    this.logger.pushLogs('Running audio connectivity test');
    const result = await this.waitForTestResult(elements.audioConnectivityTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Audio connectivity test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async runVideoConnectivityTest() {
    this.logger.pushLogs('Running video connectivity test');
    const result = await this.waitForTestResult(elements.videoConnectivityTest, TEST_TIMEOUT_MS);
    this.logger.pushLogs(`Video connectivity test completed: ${result}`, LogLevel.SUCCESS);
    return result;
  }

  async waitForTestResult(elementLocator, timeoutMs) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const element = await this.driver.findElement(elementLocator);
        const text = await element.getText();
        const className = await element.getAttribute('class');
        
        // Check if test is still running (spinner)
        if (className && className.includes('spinner-border')) {
          await sleep(500);
          continue;
        }
        
        // Check if we have a result
        if (text && text.length > 0 && !text.includes('spinner')) {
          return text;
        }
      } catch (error) {
        // Element not found yet, wait and retry
        await sleep(500);
      }
    }
    
    throw new Error(`Test timed out after ${timeoutMs}ms`);
  }

  async getReadinessHeader() {
    const header = await this.driver.findElement(elements.readinessHeader);
    return await header.getText();
  }
}

module.exports = { MeetingReadinessCheckerPage };
