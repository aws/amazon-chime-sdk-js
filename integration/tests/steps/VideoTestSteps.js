const { step } = require('mocha-steps');
const { addAllSetupSteps, addCleanupSteps, baseIgnoredEvents } = require('./SetupSteps');
const { VideoState, ContentShareState } = require('../../pages/MeetingPage');
 const { retryAsync } = require('../../utils/HelperFunctions');

const ignoredEvents = baseIgnoredEvents;

/**
 * Adds all setup steps for video tests.
 */
function addSetupSteps(ctx, options = {}) {
  addAllSetupSteps(ctx, { ...options, ignoredEvents });
}

/**
 * Adds video on/off test steps.
 */
function addVideoSteps(ctx) {
  addEnableVideoSteps(ctx);
  addDisableVideoSteps(ctx);
}

/**
 * Adds video enabling test steps.
 */
function addEnableVideoSteps(ctx) {
  step('test attendee should turn on video', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('should validate videoInputSelected event', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputSelected'], ignoredEvents, {});
    });
  });

  step('test attendee should verify local video is on', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('monitor attendee should verify remote video is on', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
    }
  });
}

/**
 * Adds video disabling test steps.
 */
function addDisableVideoSteps(ctx) {
  step('test attendee should turn off video', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOff());
  });

  step('should validate videoInputUnselected event', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputUnselected'], [...ignoredEvents, 'videoInputSelected'], {});
    });
  });

  step('test attendee should verify local video is off', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, ctx.test_attendee_id));
  });

  step('monitor attendee should verify remote video is off', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, ctx.test_attendee_id));
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.OFF, ctx.test_attendee_id));
    }
  });
}

/**
 * Adds content share test steps.
 */
function addContentShareSteps(ctx) {
  step('test attendee should start content share', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.startContentShareTestVideo());
  });

  step('monitor attendee should see content share', async function () {
    // Content share is primarily verified on the remote viewer (monitor window)
    // The local sharer may not see their own content share as a video tile
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.PLAY)
      );
    } else {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.PLAY)
      );
    }
  });

  step('test attendee should pause content share', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.toggleContentSharePause());
  });

  step('monitor attendee should see paused content', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.PAUSE)
      );
    } else {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.PAUSE)
      );
    }
  });

  step('test attendee should stop content share', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.stopContentShare());
  });

  step('content share should be stopped', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.OFF)
      );
    } else {
      await ctx.monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.OFF)
      );
    }
  });
}

/**
 * Adds background segmentation (3.0) color replacement test steps with pixel-based verification.
 * This uses the blue-pixel-percentage-based check for background segmentation filters.
 * The pixel percentage check is REQUIRED - test will fail if filter is not properly applied.
 */
function addBackgroundSegmentationColorReplacementSteps(ctx, model) {
  let rawVideoSum = null;

  addEnableVideoSteps(ctx);

  step('test attendee should enable background segmentation color replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableBackgroundSegmentationColorReplacement(model));
  });

  step('should validate background segmentation color replacement filter events', async function () {
    await ctx.test_window.runCommands(async () => {
      // Enabling background segmentation color replacement triggers backgroundFilterConfigSelected and videoInputSelected
      await this.pageOne.validateEvents(
        ['backgroundFilterStarted', 'videoInputSelected'], 
        [...ignoredEvents, 'backgroundFilterConfigSelected'],
        {}
      );
    });
  });

  step('background segmentation color replacement should be active', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterApplied('backgroundColorReplacement')
    );
  });

  step('test attendee should verify the background segmentation color replacement video filter appropriately replaces the background with blue #0000FF', async function () {
    await ctx.test_window.runCommands(async () => {
      await retryAsync(async () => {
        const colorCheckPassed = await this.pageOne.checkBluePixelPercentage(ctx.test_attendee_id);
        if (!colorCheckPassed) {
          throw new Error('Background segmentation color replacement pixel percentage check failed in test window');
        }
      }, { logger: this.logger });
    });
  });

  step('monitor attendee should verify the background segmentation color replacement video filter appropriately replaces the background with blue #0000FF', async function (){
    const monitorPage = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
    await ctx.monitor_window.runCommands(async () => {
      await retryAsync(async () => {
        const colorCheckPassed = await monitorPage.checkBluePixelPercentage(ctx.test_attendee_id);
        if (!colorCheckPassed) {
          throw new Error('Background segmentation color replacement pixel percentage check failed in monitor window - filter not properly applied');
        }
      }, { logger: this.logger });
    });
  });

  step('video should still be playing with background segmentation color replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('test attendee should disable background segmentation color replacement', async function () {
    // First disable the current filter
    await ctx.test_window.runCommands(async () => await this.pageOne.disableVideoFilter());
    // Wait for filter to be fully disabled
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterDisabled()
    );
  });

  addDisableVideoSteps(ctx);
}

/**
 * Adds background segmentation (3.0) blur test steps with pixel-based verification.
 * This uses the difference-based check for background segmentation filters.
 * The pixel check is REQUIRED - test will fail if filter is not properly applied.
 */
function addBackgroundSegmentationBlurSteps(ctx, model) {
  let rawVideoSum = null;

  addEnableVideoSteps(ctx);

  step('capture raw video sum before applying background segmentation blur', async function () {
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  step('test attendee should enable background segmentation blur', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableBackgroundSegmentationBlur('Low', model));
  });

  step('should validate background segmentation blur filter events', async function () {
    await ctx.test_window.runCommands(async () => {
      // Enabling background segmentation blur triggers backgroundFilterConfigSelected and videoInputSelected
      await this.pageOne.validateEvents(
        ['backgroundFilterStarted', 'videoInputSelected'], 
        [...ignoredEvents, 'backgroundFilterConfigSelected'],
        {}
      );
    });
  });

  step('background segmentation background blur should be active', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterApplied('backgroundBlur')
    );
  });

  step('background segmentation blur should be verified with pixel difference check', async function () {
    await ctx.test_window.runCommands(async () => {
      const blurPassed = await this.pageOne.videoFxBackgroundBlurCheck(ctx.test_attendee_id, rawVideoSum);
      if (!blurPassed) {
        throw new Error('Background segmentation blur pixel difference check failed - filter not properly applied');
      }
    });
  });

  step('video should still be playing with background segmentation blur', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('test attendee should disable background segmentation blur', async function () {
    // First disable the current filter
    await ctx.test_window.runCommands(async () => await this.pageOne.disableVideoFilter());
    // Wait for filter to be fully disabled
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterDisabled()
    );
  });

  addDisableVideoSteps(ctx);
}

/**
 * Adds background segmentation (3.0) image replacement test steps with pixel-based verification.
 * This uses the difference-based check for background segmentation filters.
 * The pixel check is REQUIRED - test will fail if filter is not properly applied.
 */
function addBackgroundSegmentationImageReplacementSteps(ctx, model) {
  let rawVideoSum = null;

  addEnableVideoSteps(ctx);

  step('capture raw video sum before applying background segmentation image replacement', async function () {
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  step('test attendee should enable background segmentation image replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableBackgroundSegmentationImageReplacement(model));
  });

  step('should validate background segmentation image replacement filter events', async function () {
    await ctx.test_window.runCommands(async () => {
      // Enabling background segmentation image replacement triggers backgroundFilterConfigSelected and videoInputSelected
      await this.pageOne.validateEvents(
        ['backgroundFilterStarted', 'videoInputSelected'], 
        [...ignoredEvents, 'backgroundFilterConfigSelected'],
        {}
      );
    });
  });

  step('background segmentation image replacement should be active', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterApplied('backgroundReplacement')
    );
  });

  step('background segmentation image replacement should be verified with pixel difference check', async function () {
    await ctx.test_window.runCommands(async () => {
      const replacementPassed = await this.pageOne.videoFxBackgroundReplacementCheck(ctx.test_attendee_id, rawVideoSum);
      if (!replacementPassed) {
        throw new Error('Background segmentation image replacement pixel difference check failed - filter not properly applied');
      }
    });
  });

  step('video should still be playing with background segmentation image replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('test attendee should disable background segmentation image replacement', async function () {
    // First disable the current filter
    await ctx.test_window.runCommands(async () => await this.pageOne.disableVideoFilter());
    // Wait for filter to be fully disabled
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkVideoFilterDisabled()
    );
  });

  addDisableVideoSteps(ctx);
}

module.exports = { 
  addSetupSteps, 
  addVideoSteps, 
  addContentShareSteps,
  addBackgroundSegmentationColorReplacementSteps,
  addBackgroundSegmentationBlurSteps,
  addBackgroundSegmentationImageReplacementSteps,
  addCleanupSteps,
  ignoredEvents 
};
