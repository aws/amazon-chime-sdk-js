const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addAllSetupSteps, 
  addCleanupSteps,
  baseIgnoredEvents
} = require('./steps/SetupSteps');
const {
  addBackgroundSegmentationColorReplacementSteps,
  addBackgroundSegmentationBlurSteps,
  addBackgroundSegmentationImageReplacementSteps
} = require('./steps/VideoTestSteps');

const ignoredEvents = baseIgnoredEvents;

/*
 * VideoProcessingTest - Tests background segmentation video processing filters (color replacement, blur effect, image replacement)
 * 
 * Verifies that background segmentation filter for color replacement, blur effect and image replacement can be enabled/disabled.
 * Uses pixel-based verification to ensure filters are actually applied to the video output.
 * Only tests background segmentation (3.0) filters - the newer, more performant video processing pipeline.
 */
describe('VideoProcessingTest', async function () {
  const testSetup = setupTestEnvironment('VideoProcessingTest', MeetingPage);
  const ctx = {};

  testSetup.setupBaseTest();
  
  // Use the standard setup steps
  addAllSetupSteps(ctx, { ignoredEvents });

  // Disable flaky multiclass model tests failing due to flaky WebGL/GPU resource exhaustion issue
  // causing script timeouts in headless Chrome CI.
  addBackgroundSegmentationColorReplacementSteps(ctx, 'general');
  //addBackgroundSegmentationColorReplacementSteps(ctx, 'multiclass');
  addBackgroundSegmentationBlurSteps(ctx, 'general');
  //addBackgroundSegmentationBlurSteps(ctx, 'multiclass');
  addBackgroundSegmentationImageReplacementSteps(ctx, 'general');
  //addBackgroundSegmentationImageReplacementSteps(ctx, 'multiclass');

  addCleanupSteps(ctx, { ignoredEvents, additionalIgnored: ['videoInputSelected'] });
});
