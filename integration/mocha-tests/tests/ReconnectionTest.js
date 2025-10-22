const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage } = require('../pages/MeetingPage');
const NetworkEmulationController = require('../utils/NetworkEmulationController');
const setupTestEnvironment = require('./TestSetup');

/*
 * ReconnectionTest - Tests network and connection scenarios
 */
describe('ReconnectionTest', async function () {
  // Force two sessions so we can target only one attendee’s network
  const testSetup = setupTestEnvironment('ReconnectionTest', MeetingPage, {
    requireTwoSessions: true,
  });

  const ignoredEvents = ['sendingAudioFailed', 'sendingAudioRecovered', 'videoInputSelected'];

  let meetingId;
  let network_one;

  let test_window;
  let monitor_window;

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    // Two sessions: separate browsers
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    monitor_window = await Window.existing(this.driverFactoryTwo.driver, this.logger, 'MONITOR');

    await test_window.runCommands(async () => this.pageOne.open(this.driverFactoryOne.url));
    await monitor_window.runCommands(async () => this.pageTwo.open(this.driverFactoryTwo.url));
  });

  step('should setup network controller', async function () {
    await test_window.runCommands(async () => {
      network_one = await NetworkEmulationController.setup(
        this.driverFactoryOne.driver,
        this.logger
      );
    });
  });

  step('should authenticate the user to the meeting', async function () {
    meetingId = uuidv4();
    const test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
    const monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

    await test_window.runCommands(async () => {
      await this.pageOne.enterMeetingId(meetingId);
      await this.pageOne.enterAttendeeName(test_attendee_id);
      await this.pageOne.authenticate();
    });

    await monitor_window.runCommands(async () => {
      await this.pageTwo.enterMeetingId(meetingId);
      await this.pageTwo.enterAttendeeName(monitor_attendee_id);
      await this.pageTwo.authenticate();
    });
  });

  step('should join the meeting', async function () {
    await test_window.runCommands(async () => this.pageOne.joinMeeting());
    await monitor_window.runCommands(async () => this.pageTwo.joinMeeting());
  });

  step('should validate meeting start events', async function () {
    const expected = [
      'videoInputUnselected',
      'audioInputSelected',
      'meetingStartRequested',
      'attendeePresenceReceived',
      'meetingStartSucceeded',
    ];

    await test_window.runCommands(async () =>
      this.pageOne.validateEvents(expected, ignoredEvents, {}, 10000)
    );

    await monitor_window.runCommands(async () =>
      this.pageTwo.validateEvents(expected, ignoredEvents, {}, 10000)
    );
  });

  step('should have two participants in the roster', async function () {
    await test_window.runCommands(async () => this.pageOne.rosterCheck(2));
    await monitor_window.runCommands(async () => this.pageTwo.rosterCheck(2));
  });

  step(
    'should simulate network disconnection and validate signalingDropped event',
    async function () {
      await test_window.runCommands(async () => {
        await network_one.offline();
        await this.pageOne.validateEvents(['signalingDropped'], ignoredEvents, {}, 20000);
      });
    }
  );

  step('should test meeting reconnection scenario', async function () {
    await test_window.runCommands(async () => {
      await network_one.online();
      await this.pageOne.validateEvents(['meetingReconnected'], ignoredEvents, {}, 10000);
    });
  });

  step('should leave all participants to trigger meetingEnded', async function () {
    await test_window.runCommands(async () => {
      await this.pageOne.leaveMeeting();
    });

    await monitor_window.runCommands(async () => {
      const page = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
      await page.leaveMeeting();
    });
  });

  step('should validate meetingEnded events after cleanup', async function () {
    // Due to timing issues, the connection may be broken by backend before the client is gracefully closed. Until we
    // fix emission of this event in this case, just ignore 'signalingDropped' and 'meetingReconnected' events.

    const expectedEvents = ['meetingEnded'];
    const leaveIgnoredEvents = ignoredEvents.concat(['signalingDropped', 'meetingReconnected']);

    await test_window.runCommands(async () => {
      await this.pageOne.validateEvents(
        expectedEvents,
        leaveIgnoredEvents,
        {}
      );
    });

    await monitor_window.runCommands(async () => {
      const page = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
      await page.validateEvents(
        expectedEvents,
        leaveIgnoredEvents,
        {}
      );
    });
  });
});
