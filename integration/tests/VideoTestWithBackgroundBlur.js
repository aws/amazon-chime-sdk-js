const { describe } = require('mocha');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addSetupSteps, 
  addVideoSteps, 
  addBackgroundSegmentationBlurSteps,
  addCleanupSteps 
} = require('./steps/VideoTestSteps');

/*
 * VideoTestWithBackgroundBlur - Two-participant video test with background segmentation filter with blur effect
 * 
 * Same as VideoTest but enables background segmentation (3.0) filter with blur effect video processing.
 * Verifies video send/receive works correctly with background blur active.
 * Uses pixel-based verification to ensure the filter is properly applied.
 */
describe('VideoTestWithBackgroundBlur', async function () {
  const testSetup = setupTestEnvironment('VideoTestWithBackgroundBlur', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  addSetupSteps(ctx);
  addVideoSteps(ctx);
  addBackgroundSegmentationBlurSteps(ctx, 'general');
  addCleanupSteps(ctx);
});
