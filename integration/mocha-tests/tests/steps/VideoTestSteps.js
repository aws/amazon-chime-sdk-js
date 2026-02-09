const { step } = require('mocha-steps');
const { addAllSetupSteps, addCleanupSteps, baseIgnoredEvents } = require('./SetupSteps');
const { VideoState, ContentShareState } = require('../../pages/MeetingPage');

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

  step('test attendee should turn off video', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOff());
  });

  step('should validate videoInputUnselected event', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputUnselected'], ignoredEvents, {});
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
 * Adds Video Fx background blur test steps with pixel-based verification.
 * This uses the difference-based check for Video Fx filters.
 * The pixel check is REQUIRED - test will fail if filter is not properly applied.
 */
function addVideoFxBackgroundBlurSteps(ctx) {
  let rawVideoSum = null;

  step('test attendee should turn video on for Video Fx blur test', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('test attendee should verify local video is on', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('capture raw video sum before applying Video Fx blur', async function () {
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  step('test attendee should enable Video Fx background blur', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableVideoFxBackgroundBlur('Low'));
  });

  step('Video Fx background blur should be verified with pixel difference check', async function () {
    await ctx.test_window.runCommands(async () => {
      const blurPassed = await this.pageOne.videoFxBackgroundBlurCheck(ctx.test_attendee_id, rawVideoSum);
      if (!blurPassed) {
        throw new Error('Video Fx background blur pixel difference check failed - filter not properly applied');
      }
    });
  });

  step('video should still be playing with Video Fx blur', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });
}

/**
 * Adds Video Fx background replacement test steps with pixel-based verification.
 * This uses the difference-based check for Video Fx filters.
 * The pixel check is REQUIRED - test will fail if filter is not properly applied.
 */
function addVideoFxBackgroundReplacementSteps(ctx) {
  let rawVideoSum = null;

  step('test attendee should turn video on for Video Fx replacement test', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('test attendee should verify local video is on', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });

  step('capture raw video sum before applying Video Fx replacement', async function () {
    await ctx.test_window.runCommands(async () => {
      rawVideoSum = await this.pageOne.computeVideoSum(ctx.test_attendee_id);
    });
  });

  step('test attendee should enable Video Fx background replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.enableVideoFxBackgroundReplacement('Default'));
  });

  step('Video Fx background replacement should be verified with pixel difference check', async function () {
    await ctx.test_window.runCommands(async () => {
      const replacementPassed = await this.pageOne.videoFxBackgroundReplacementCheck(ctx.test_attendee_id, rawVideoSum);
      if (!replacementPassed) {
        throw new Error('Video Fx background replacement pixel difference check failed - filter not properly applied');
      }
    });
  });

  step('video should still be playing with Video Fx replacement', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, ctx.test_attendee_id));
  });
}

module.exports = { 
  addSetupSteps, 
  addVideoSteps, 
  addContentShareSteps,
  addVideoFxBackgroundBlurSteps,
  addVideoFxBackgroundReplacementSteps,
  addCleanupSteps,
  ignoredEvents 
};
