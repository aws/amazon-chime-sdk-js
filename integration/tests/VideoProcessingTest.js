const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');
const { 
  addAllSetupSteps, 
  addCleanupSteps,
  baseIgnoredEvents
} = require('./steps/SetupSteps');

const ignoredEvents = baseIgnoredEvents;

/*
 * VideoProcessingTest - Tests VideoFx video processing filters (blur and replacement)
 * 
 * Verifies that VideoFx background blur and background replacement filters can be enabled/disabled.
 * Uses pixel-based verification to ensure filters are actually applied to the video output.
 * Only tests VideoFx (2.0) filters - the newer, more performant video processing pipeline.
 */
describe('VideoProcessingTest', async function () {
  const testSetup = setupTestEnvironment('VideoProcessingTest', MeetingPage);
  const ctx = {};
  let rawVideoSum = null;

  testSetup.setupBaseTest();
  
  // Use the standard setup steps
  addAllSetupSteps(ctx, { ignoredEvents });

  // Turn on video first
  step('test attendee should turn on video', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('should validate videoInputSelected event', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputSelected'], ignoredEvents, {});
    });
  });

  // Capture raw video sum before applying any filter (for VideoFx difference-based checks)
  step('capture raw video sum before applying VideoFx blur', async function () {
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  // Test VideoFx Background Blur
  step('test attendee should enable VideoFx background blur', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableVideoFxBackgroundBlur('Low'));
  });

  step('should validate VideoFx background blur filter events', async function () {
    await ctx.test_window.runCommands(async () => {
      // Enabling VideoFx blur triggers backgroundFilterConfigSelected and videoInputSelected
      await this.pageOne.validateEvents(
        ['backgroundFilterConfigSelected', 'videoInputSelected'], 
        ignoredEvents, 
        {}
      );
    });
  });

  step('VideoFx background blur should be active', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterApplied('backgroundBlur')
    );
  });

  // Required pixel-based VideoFx background blur verification
  step('VideoFx background blur should be verified with pixel check', async function () {
    await ctx.test_window.runCommands(async () => {
      const blurPassed = await this.pageOne.videoFxBackgroundBlurCheck(ctx.test_attendee_id, rawVideoSum);
      if (!blurPassed) {
        throw new Error('VideoFx background blur pixel check failed - filter not properly applied');
      }
    });
  });

  // Capture new raw video sum before switching to replacement
  step('capture raw video sum before applying VideoFx replacement', async function () {
    // First disable the current filter
    await ctx.test_window.runCommands(async () => await this.pageOne.disableVideoFilter());
    // Wait for filter to be fully disabled
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterDisabled()
    );
    // Capture the raw video sum
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  // Test VideoFx Background Replacement
  step('test attendee should enable VideoFx background replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableVideoFxBackgroundReplacement('Default'));
  });

  step('should validate VideoFx background replacement filter events', async function () {
    await ctx.test_window.runCommands(async () => {
      // Enabling replacement triggers videoInputSelected and backgroundFilterConfigSelected
      await this.pageOne.validateEvents(
        ['videoInputSelected', 'backgroundFilterConfigSelected'], 
        ignoredEvents, 
        {}
      );
    });
  });

  step('VideoFx background replacement should be active', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterApplied('backgroundReplacement')
    );
  });

  // Required pixel-based VideoFx background replacement verification
  step('VideoFx background replacement should be verified with pixel check', async function () {
    await ctx.test_window.runCommands(async () => {
      const replacementPassed = await this.pageOne.videoFxBackgroundReplacementCheck(ctx.test_attendee_id, rawVideoSum);
      if (!replacementPassed) {
        throw new Error('VideoFx background replacement pixel check failed - filter not properly applied');
      }
    });
  });

  // Disable filter
  step('test attendee should disable video filter', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.disableVideoFilter());
  });

  step('video filter should be disabled', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterDisabled()
    );
  });

  addCleanupSteps(ctx, { ignoredEvents, additionalIgnored: ['videoInputSelected'] });
});
