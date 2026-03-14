const { describe } = require('mocha');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addSetupSteps, 
  addAudioSteps, 
  addDataMessageSteps,
  addCleanupSteps 
} = require('./steps/AudioTestSteps');

/*
 * AudioTest - Two-participant audio test
 * 
 * Tests audio send/receive and data messaging between two participants.
 */
describe('AudioTest', async function () {
  const testSetup = setupTestEnvironment('AudioTest', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  addSetupSteps(ctx, { enableVoiceFocus: false });
  addAudioSteps(ctx);
  addDataMessageSteps(ctx);
  addCleanupSteps(ctx);
});
