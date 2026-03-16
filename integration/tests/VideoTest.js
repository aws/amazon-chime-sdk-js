const { describe } = require('mocha');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addSetupSteps, 
  addVideoSteps, 
  addContentShareSteps,
  addCleanupSteps 
} = require('./steps/VideoTestSteps');

/*
 * VideoTest - Two-participant video test
 * 
 * Tests video send/receive and content share between two participants.
 */
describe('VideoTest', async function () {
  const testSetup = setupTestEnvironment('VideoTest', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  addSetupSteps(ctx);
  addVideoSteps(ctx);
  addContentShareSteps(ctx);
  addCleanupSteps(ctx);
});
