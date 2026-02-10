const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * HealthMonitorTest - Tests audio/video health monitoring events
 * 
 * Verifies that the SDK properly detects and reports:
 * - sendingAudioFailed: When audio transmission fails
 * - sendingAudioRecovered: When audio transmission recovers
 * 
 * This test can be extended in the future to cover additional health events.
 */
describe('HealthMonitorTest', async function () {
  const testSetup = setupTestEnvironment('HealthMonitorTest', MeetingPage);

  let test_window;
  let test_attendee_id;
  let meetingId;

  // Don't ignore the health events - we want to capture them
  const ignoredEvents = [];

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
  });

  step('should authenticate user', async function () {
    meetingId = uuidv4();
    test_attendee_id = 'Health Test - ' + uuidv4().toString();

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

  step('should select no audio input to trigger sendingAudioFailed', async function () {
    await test_window.runCommands(async () => await this.pageOne.selectNoAudioInput());
  });

  step('should detect sendingAudioFailed event', async function () {
    await test_window.runCommands(async () => {
      // audioInputSelected fires when selecting "No Audio" input, so we ignore it here
      await this.pageOne.validateEvents(['sendingAudioFailed'], ignoredEvents.concat(['audioInputSelected']), {}, 10000);
      this.logger.pushLogs('sendingAudioFailed event detected successfully');
    });
  });

  step('should play speech audio to trigger sendingAudioRecovered', async function () {
    await test_window.runCommands(async () => await this.pageOne.playSpeechAudio());
  });

  step('should detect sendingAudioRecovered event', async function () {
    await test_window.runCommands(async () => {
      // audioInputSelected fires when playing speech audio, so we ignore it here
      await this.pageOne.validateEvents(['sendingAudioRecovered'], ignoredEvents.concat(['audioInputSelected']), {}, 10000);
      this.logger.pushLogs('sendingAudioRecovered event detected successfully');
    });
  });

  step('should stop speech audio', async function () {
    await test_window.runCommands(async () => await this.pageOne.stopSpeechAudio());
  });

  step('should leave the meeting', async function () {
    await test_window.runCommands(async () => await this.pageOne.leaveMeeting());
  });

  step('should validate meetingEnded event', async function () {
    await test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['meetingEnded'], ignoredEvents.concat(['signalingDropped', 'sendingAudioFailed']), {});
    });
  });
});
