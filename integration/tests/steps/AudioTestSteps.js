const { step } = require('mocha-steps');
const { addAllSetupSteps, addCleanupSteps, baseIgnoredEvents } = require('./SetupSteps');

const ignoredEvents = baseIgnoredEvents;

/**
 * Adds all setup steps for audio tests.
 */
function addSetupSteps(ctx, options = {}) {
  addAllSetupSteps(ctx, { ...options, ignoredEvents });
}

/**
 * Adds audio send/receive test steps.
 */
function addAudioSteps(ctx) {
  step('both attendees should be muted at the start of the test', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.muteMicrophone());

    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.muteMicrophone());
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.muteMicrophone());
    }
  });

  step('test attendee should play random tone', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.playRandomTone());
  });

  step('should validate test attendee audio input event', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['audioInputSelected'], ignoredEvents, {});
    });
  });

  step('monitor attendee should hear the tone', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_ON'));
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.runAudioCheck('AUDIO_ON'));
    }
  });

  step('test attendee should stop playing random tone', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.stopPlayingRandomTone());
  });

  step('monitor attendee should not hear the tone', async function () {
    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_OFF'));
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.runAudioCheck('AUDIO_OFF'));
    }
  });
}

/**
 * Adds data messaging test steps.
 */
function addDataMessageSteps(ctx) {
  step('test attendee should send data message', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.sendDataMessage('Test message 1')
    );
  });

  step('test attendee should see own message', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkDataMessageReceived('Test message 1')
    );
  });

  step('monitor attendee should receive message', async function () {
    const monitorPage = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
    await ctx.monitor_window.runCommands(async () => 
      await monitorPage.checkDataMessageReceived('Test message 1')
    );
  });

  step('monitor attendee should send reply', async function () {
    const monitorPage = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
    await ctx.monitor_window.runCommands(async () => 
      await monitorPage.sendDataMessage('Test message 2')
    );
  });

  step('test attendee should receive reply', async function () {
    await ctx.test_window.runCommands(async () => 
      await this.pageOne.checkDataMessageReceived('Test message 2')
    );
  });
}

module.exports = { 
  addSetupSteps, 
  addAudioSteps, 
  addDataMessageSteps,
  addCleanupSteps,
  ignoredEvents 
};
