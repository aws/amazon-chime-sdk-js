const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingReadinessCheckerPage } = require('../pages/MeetingReadinessCheckerPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * MeetingReadinessCheckerTest - Tests the Meeting Readiness Checker functionality
 * 
 * Run with: npm run test -- --test-name MeetingReadinessCheckerTest --host local --test-type integration-test --retry 0 --headless true --app meetingReadinessChecker
 * 
 * Verifies that the meeting readiness checker can:
 * 1. Initialize and authenticate
 * 2. Run audio input test (microphone)
 * 3. Run video input test (camera)
 * 4. Run network connectivity tests (TCP/UDP)
 * 5. Run audio/video connectivity tests
 */
describe('MeetingReadinessCheckerTest', async function () {
  const testSetup = setupTestEnvironment('MeetingReadinessCheckerTest', MeetingReadinessCheckerPage);

  let test_window;

  testSetup.setupBaseTest();

  step('should open the meeting readiness checker', async function () {
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
  });

  step('should authenticate and start readiness tests', async function () {
    await test_window.runCommands(async () => await this.pageOne.authenticate());
  });

  step('should run speaker test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runSpeakerTest();
      this.logger.pushLogs(`Speaker test result: ${result}`);
    });
  });

  step('should run microphone test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runMicTest();
      if (!result.includes('Succeeded')) {
        throw new Error(`Microphone test failed: ${result}`);
      }
      this.logger.pushLogs(`Microphone test result: ${result}`);
    });
  });

  step('should run video test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runVideoTest();
      if (!result.includes('Succeeded')) {
        throw new Error(`Video test failed: ${result}`);
      }
      this.logger.pushLogs(`Video test result: ${result}`);
    });
  });

  step('should run network UDP test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runNetworkUdpTest();
      if (!result.includes('Succeeded')) {
        throw new Error(`Network UDP test failed: ${result}`);
      }
      this.logger.pushLogs(`Network UDP test result: ${result}`);
    });
  });

  step('should run network TCP test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runNetworkTcpTest();
      if (!result.includes('Succeeded')) {
        throw new Error(`Network TCP test failed: ${result}`);
      }
      this.logger.pushLogs(`Network TCP test result: ${result}`);
    });
  });

  step('should run audio connectivity test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runAudioConnectivityTest();
      if (!result.includes('Succeeded')) {
        throw new Error(`Audio connectivity test failed: ${result}`);
      }
      this.logger.pushLogs(`Audio connectivity test result: ${result}`);
    });
  });

  step('should run video connectivity test', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.runVideoConnectivityTest();
      // In headless mode, VideoNotSent is acceptable since there's no real camera
      if (!result.includes('Succeeded') && !result.includes('VideoNotSent')) {
        throw new Error(`Video connectivity test failed: ${result}`);
      }
      this.logger.pushLogs(`Video connectivity test result: ${result}`);
    });
  });
});
