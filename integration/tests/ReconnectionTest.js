const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { MeetingPage } = require('../pages/MeetingPage');
const NetworkEmulationController = require('../utils/NetworkEmulationController');
const setupTestEnvironment = require('./TestSetup');
const { 
  addOpenSteps,
  addAuthenticateSteps,
  addJoinSteps,
  addValidateMeetingStartSteps,
  addRosterCheckSteps,
  addCleanupSteps,
  baseIgnoredEvents
} = require('./steps/SetupSteps');

const ignoredEvents = baseIgnoredEvents;

/*
 * ReconnectionTest - Tests network disconnection and reconnection scenarios
 */
describe('ReconnectionTest', async function () {
  const testSetup = setupTestEnvironment('ReconnectionTest', MeetingPage, {
    requireTwoSessions: true,
  });

  const ctx = {};
  let network_one;

  testSetup.setupBaseTest();

  addOpenSteps(ctx, { requireTwoSessions: true });

  step('should setup network controller', async function () {
    await ctx.test_window.runCommands(async () => {
      network_one = await NetworkEmulationController.setup(
        this.driverFactoryOne.driver,
        this.logger
      );
    });
  });

  addAuthenticateSteps(ctx);
  addJoinSteps(ctx);
  addValidateMeetingStartSteps(ctx, { ignoredEvents, timeout: 10000 });
  addRosterCheckSteps(ctx);

  step('should simulate network disconnection and validate signalingDropped event', async function () {
    await ctx.test_window.runCommands(async () => {
      await network_one.offline();
      await this.pageOne.validateEvents(['signalingDropped'], ignoredEvents, {}, 20000);
    });
  });

  step('should test meeting reconnection scenario', async function () {
    await ctx.test_window.runCommands(async () => {
      await network_one.online();
      await this.pageOne.validateEvents(['meetingReconnected'], ignoredEvents, {}, 10000);
    });
  });

  addCleanupSteps(ctx, { ignoredEvents, additionalIgnored: ['meetingReconnected'] });
});
