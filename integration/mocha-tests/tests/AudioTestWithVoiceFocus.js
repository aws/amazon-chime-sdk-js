const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addSetupSteps, 
  addCleanupSteps 
} = require('./steps/AudioTestSteps');

/*
 * AudioTestWithVoiceFocus - Two-participant audio test with Voice Focus
 * 
 * Verifies Voice Focus audio processing is enabled and working by:
 * 1. Enabling Voice Focus before joining the meeting
 * 2. Playing prerecorded speech audio (which Voice Focus processes, unlike synthetic tones)
 * 3. Verifying the monitor attendee can hear the speech audio
 * 4. Verifying the audio processing pipeline is active
 */
describe('AudioTestWithVoiceFocus', async function () {
  const testSetup = setupTestEnvironment('AudioTestWithVoiceFocus', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  addSetupSteps(ctx, { enableVoiceFocus: true });
  
  // Voice Focus specific verification - verify audio processing is active
  step('should verify audio processing pipeline is active', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.verifyAudioProcessingActive();
    });
  });

  // Play speech audio and verify monitor can hear it
  step('test attendee should play speech audio', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.playSpeechAudio(true); // loop=true for continuous playback
    });
  });

  step('monitor attendee should hear the speech audio', async function () {
    await ctx.monitor_window.runCommands(async () => {
      const page = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
      // Use audio detection - speech audio should pass through Voice Focus
      await page.checkAudioReceived();
    });
  });

  step('test attendee should stop speech audio', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.stopSpeechAudio();
    });
  });

  // Ignore audioInputSelected events during cleanup since stopping speech audio triggers it
  addCleanupSteps(ctx, { additionalIgnored: ['audioInputSelected'] });
});
