const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * MeetingEndTest - Tests server-side meeting end behavior
 * 
 * Verifies that:
 * 1. A meeting can be ended via the server-side API
 * 2. After ending, new participants cannot join the same meeting
 * 
 * This is different from "leave" which just removes the participant.
 */
describe('MeetingEndTest', async function () {
  const testSetup = setupTestEnvironment('MeetingEndTest', MeetingPage);

  let test_window;
  let test_attendee_id;
  let meetingId;

  const ignoredEvents = ['sendingAudioFailed', 'sendingAudioRecovered'];

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
  });

  step('should authenticate user', async function () {
    meetingId = uuidv4();
    test_attendee_id = 'End Test - ' + uuidv4().toString();

    await test_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));
    await test_window.runCommands(async () => await this.pageOne.enterAttendeeName(test_attendee_id));
    await test_window.runCommands(async () => await this.pageOne.authenticate());
  });

  step('should join the meeting', async function () {
    await test_window.runCommands(async () => await this.pageOne.joinMeeting());
  });

  step('should validate meeting start events', async function () {
    const expected = [
      'videoInputSelected',
      'videoInputUnselected',
      'audioInputSelected',
      'meetingStartRequested',
      'attendeePresenceReceived',
      'meetingStartSucceeded',
    ];
    await test_window.runCommands(async () =>
      this.pageOne.validateEvents(expected, ignoredEvents, {}, 10000)
    );
  });

  step('should verify roster has 1 participant', async function () {
    await test_window.runCommands(async () => await this.pageOne.rosterCheck(1));
  });

  step('should end the meeting via server API', async function () {
    await test_window.runCommands(async () => await this.pageOne.endMeeting());
  });

  step('should validate meetingEnded event', async function () {
    await test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['meetingEnded'], ignoredEvents.concat(['signalingDropped']), {});
    });
  });

  step('should try to rejoin the ended meeting and fail', async function () {
    // Open the demo again
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
    
    // Try to authenticate with the same meeting ID
    await test_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));
    await test_window.runCommands(async () => await this.pageOne.enterAttendeeName(test_attendee_id));
    
    // This should fail because the meeting has ended
    await test_window.runCommands(async () => {
      const joinFailed = await this.pageOne.authenticateAndExpectFailure();
      if (!joinFailed) {
        throw new Error('Expected authentication to fail for ended meeting, but it succeeded');
      }
      this.logger.pushLogs('Correctly failed to join ended meeting');
    });
  });
});
