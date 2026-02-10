const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../../utils/Window');

const baseIgnoredEvents = ['sendingAudioFailed', 'sendingAudioRecovered'];

/**
 * Adds steps to open the meeting demo in browser windows.
 */
function addOpenSteps(ctx, options = {}) {
  const { requireTwoSessions = false } = options;

  step('should open the meeting demo', async function () {
    if (requireTwoSessions || this.numberOfSessions === 2) {
      // Two sessions: separate browsers
      ctx.test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
      ctx.monitor_window = await Window.existing(this.driverFactoryTwo.driver, this.logger, 'MONITOR');

      await ctx.test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.open(this.driverFactoryTwo.url));
    } else {
      // Single session: use two tabs
      ctx.test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
      ctx.monitor_window = await Window.openNew(this.driverFactoryOne.driver, this.logger, 'MONITOR');

      await ctx.test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
      await ctx.monitor_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
    }
  });
}

/**
 * Adds steps to authenticate users to the meeting.
 */
function addAuthenticateSteps(ctx, options = {}) {
  const { enableVoiceFocus = false } = options;

  step('should authenticate the user to the meeting', async function () {
    ctx.meetingId = uuidv4();
    ctx.test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
    ctx.monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

    await ctx.test_window.runCommands(async () => await this.pageOne.enterMeetingId(ctx.meetingId));
    await ctx.test_window.runCommands(async () => await this.pageOne.enterAttendeeName(ctx.test_attendee_id));
    
    if (enableVoiceFocus) {
      await ctx.test_window.runCommands(async () => await this.pageOne.enableAllowVoiceFocus());
    }
    
    await ctx.test_window.runCommands(async () => await this.pageOne.authenticate());

    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.enterMeetingId(ctx.meetingId));
      await ctx.monitor_window.runCommands(async () => await this.pageOne.enterAttendeeName(ctx.monitor_attendee_id));
      await ctx.monitor_window.runCommands(async () => await this.pageOne.authenticate());
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.enterMeetingId(ctx.meetingId));
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.enterAttendeeName(ctx.monitor_attendee_id));
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.authenticate());
    }
  });

  if (enableVoiceFocus) {
    step('Voice Focus should be supported', async function () {
      await ctx.test_window.runCommands(async () => {
        const result = await this.pageOne.checkVoiceFocusSupported();
        if (!result.supported) {
          throw new Error(`Voice Focus is not supported: ${result.reason}`);
        }
      });
    });

    step('should enable Voice Focus in lobby', async function () {
      await ctx.test_window.runCommands(async () => await this.pageOne.enableVoiceFocusInLobby());
    });
  }
}

/**
 * Adds steps to join the meeting.
 */
function addJoinSteps(ctx) {
  step('should join the meeting', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.joinMeeting());

    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.joinMeeting());
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.joinMeeting());
    }
  });
}

/**
 * Adds steps to validate meeting start events.
 */
function addValidateMeetingStartSteps(ctx, options = {}) {
  const { ignoredEvents = baseIgnoredEvents, timeout } = options;

  step('should validate meeting start events', async function () {
    const expected = [
      'videoInputSelected',
      'videoInputUnselected',
      'audioInputSelected',
      'meetingStartRequested',
      'attendeePresenceReceived',
      'meetingStartSucceeded',
    ];

    await ctx.test_window.runCommands(async () =>
      this.pageOne.validateEvents(expected, ignoredEvents, {}, timeout)
    );

    const monitorPage = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
    await ctx.monitor_window.runCommands(async () =>
      monitorPage.validateEvents(expected, ignoredEvents, {}, timeout)
    );
  });
}

/**
 * Adds steps to verify roster count.
 */
function addRosterCheckSteps(ctx, options = {}) {
  const { expectedCount = 2 } = options;

  step(`should have ${expectedCount} participants in the roster`, async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.rosterCheck(expectedCount));

    if (this.numberOfSessions === 1) {
      await ctx.monitor_window.runCommands(async () => await this.pageOne.rosterCheck(expectedCount));
    } else {
      await ctx.monitor_window.runCommands(async () => await this.pageTwo.rosterCheck(expectedCount));
    }
  });
}

/**
 * Adds Voice Focus verification step after joining.
 */
function addVoiceFocusVerifySteps(ctx) {
  step('Voice Focus should be enabled after joining', async function () {
    await ctx.test_window.runCommands(async () => {
      const isEnabled = await this.pageOne.isVoiceFocusEnabled();
      if (!isEnabled) {
        throw new Error('Voice Focus not enabled after joining meeting');
      }
      this.logger.pushLogs('Voice Focus confirmed enabled in meeting');
    });
  });
}

/**
 * Adds cleanup steps (leave meeting, validate meetingEnded).
 */
function addCleanupSteps(ctx, options = {}) {
  const { ignoredEvents = baseIgnoredEvents, additionalIgnored = [] } = options;
  const allIgnored = ignoredEvents.concat(additionalIgnored);

  step('should leave all participants', async function () {
    await ctx.test_window.runCommands(async () => await this.pageOne.leaveMeeting());

    await ctx.monitor_window.runCommands(async () => {
      const page = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
      await page.leaveMeeting();
    });
  });

  step('should validate meetingEnded events', async function () {
    await ctx.test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['meetingEnded'], allIgnored.concat(['signalingDropped']), {});
    });

    await ctx.monitor_window.runCommands(async () => {
      const page = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
      await page.validateEvents(['meetingEnded'], allIgnored.concat(['signalingDropped']), {});
    });
  });
}

/**
 * Convenience function to add all standard setup steps.
 */
function addAllSetupSteps(ctx, options = {}) {
  const { enableVoiceFocus = false, requireTwoSessions = false, ignoredEvents, timeout } = options;
  
  addOpenSteps(ctx, { requireTwoSessions });
  addAuthenticateSteps(ctx, { enableVoiceFocus });
  addJoinSteps(ctx);
  addValidateMeetingStartSteps(ctx, { ignoredEvents, timeout });
  addRosterCheckSteps(ctx);
  
  if (enableVoiceFocus) {
    addVoiceFocusVerifySteps(ctx);
  }
}

module.exports = { 
  addOpenSteps,
  addAuthenticateSteps,
  addJoinSteps,
  addValidateMeetingStartSteps,
  addRosterCheckSteps,
  addVoiceFocusVerifySteps,
  addCleanupSteps,
  addAllSetupSteps,
  baseIgnoredEvents
};
