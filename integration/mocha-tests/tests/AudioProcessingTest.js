const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * AudioProcessingTest - Standalone Voice Focus Test
 * 
 * Verifies Voice Focus audio processing works without a peer connection.
 * Tests the audio processing pipeline in isolation (single participant, no meeting join).
 * 
 * This test will FAIL if Voice Focus is not supported - it does not skip.
 */
describe('AudioProcessingTest', async function () {
  const testSetup = setupTestEnvironment('AudioProcessingTest', MeetingPage);

  let test_window;

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
  });

  step('should authenticate with Allow Voice Focus enabled', async function () {
    const attendeeId = 'Audio Processing Test - ' + uuidv4();
    await test_window.runCommands(async () => await this.pageOne.enterMeetingId(uuidv4()));
    await test_window.runCommands(async () => await this.pageOne.enterAttendeeName(attendeeId));
    await test_window.runCommands(async () => await this.pageOne.enableAllowVoiceFocus());
    await test_window.runCommands(async () => await this.pageOne.authenticate());
  });

  step('Voice Focus should be offered', async function () {
    await test_window.runCommands(async () => {
      const result = await this.pageOne.checkVoiceFocusSupported();
      if (!result.supported) {
        throw new Error(`Voice Focus is not supported: ${result.reason}`);
      }
    });
  });

  step('should enable Voice Focus in lobby', async function () {
    await test_window.runCommands(async () => await this.pageOne.enableVoiceFocusInLobby());
  });

  step('Voice Focus should be enabled', async function () {
    await test_window.runCommands(async () => {
      const isEnabled = await this.pageOne.isVoiceFocusEnabled();
      if (!isEnabled) {
        throw new Error('Voice Focus not enabled');
      }
    });
  });

  step('should verify audio processing pipeline is active', async function () {
    await test_window.runCommands(async () => await this.pageOne.verifyAudioProcessingActive());
  });

  step('should verify basic audio setup works', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkAudioUIElements());
  });
});
