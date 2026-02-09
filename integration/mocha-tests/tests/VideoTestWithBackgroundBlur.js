const { describe } = require('mocha');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addSetupSteps, 
  addVideoSteps, 
  addVideoFxBackgroundBlurSteps,
  addCleanupSteps 
} = require('./steps/VideoTestSteps');

/*
 * VideoTestWithBackgroundBlur - Two-participant video test with VideoFx background blur
 * 
 * Same as VideoTest but enables VideoFx (2.0) background blur video processing.
 * Verifies video send/receive works correctly with background blur active.
 * Uses pixel-based verification to ensure the filter is properly applied.
 */
describe('VideoTestWithBackgroundBlur', async function () {
  const testSetup = setupTestEnvironment('VideoTestWithBackgroundBlur', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  addSetupSteps(ctx);
  addVideoSteps(ctx);
  addVideoFxBackgroundBlurSteps(ctx);
  addCleanupSteps(ctx);
});
