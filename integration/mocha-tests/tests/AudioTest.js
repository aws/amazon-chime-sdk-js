const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * 1. Starts a meeting
 * 2. Adds 2 participants to the meeting
 * 3. Turns on the audio tone for both
 * 4. One attendee plays random tone
 * 5. Checks if the other participant is able to hear the tone
 * 6. Same attendee mutes the audio
 * 7. Checks if the other participant is not able to hear the audio
 * */
describe('AudioTest', async function () {
  // Get the test setup functions
  const testSetup = setupTestEnvironment('AudioTest', MeetingPage);

  let test_window;
  let monitor_window;
  let test_attendee_id;
  let monitor_attendee_id;
  let meetingId;

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    if (this.numberOfSessions === 1) {
      // Single session: use two tabs
      test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
      monitor_window = await Window.openNew(this.driverFactoryOne.driver, this.logger, 'MONITOR');

      await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
      await monitor_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
    } else {
      // Multiple sessions: use separate browsers
      test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
      monitor_window = await Window.existing(this.driverFactoryTwo.driver, this.logger, 'MONITOR');

      await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
      await monitor_window.runCommands(async () => await this.pageTwo.open(this.driverFactoryTwo.url));
    }
  });

  step('should authenticate the user to the meeting', async function () {
    meetingId = uuidv4();
    test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
    monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

    await test_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));
    await test_window.runCommands(async () => await this.pageOne.enterAttendeeName(test_attendee_id));
    await test_window.runCommands(async () => await this.pageOne.authenticate());

    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));
      await monitor_window.runCommands(async () => await this.pageOne.enterAttendeeName(monitor_attendee_id));
      await monitor_window.runCommands(async () => await this.pageOne.authenticate());
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.enterMeetingId(meetingId));
      await monitor_window.runCommands(async () => await this.pageTwo.enterAttendeeName(monitor_attendee_id));
      await monitor_window.runCommands(async () => await this.pageTwo.authenticate());
    }
  });

  step('should join the meeting', async function () {
    await test_window.runCommands(async () => await this.pageOne.joinMeeting());

    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.joinMeeting());
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.joinMeeting());
    }
  });

  step('should have two participants in the roster', async function () {
    await test_window.runCommands(async () => await this.pageOne.rosterCheck(2));

    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.rosterCheck(2));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.rosterCheck(2));
    }
  });

  step('both attendee should be muted at the start of the test', async function () {
    await test_window.runCommands(async () => await this.pageOne.muteMicrophone());

    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.muteMicrophone());
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.muteMicrophone());
    }
  });

  step('test attendee should play random tone', async function () {
    await test_window.runCommands(async () => await this.pageOne.playRandomTone());
  });

  step('monitor attendee should check for random tone in the meeting', async function () {
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_ON'));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.runAudioCheck('AUDIO_ON'));
    }
  });

  step('test attendee should stop playing random tone', async function () {
    await test_window.runCommands(async () => await this.pageOne.stopPlayingRandomTone());
  });

  step('monitor attendee should check for no random tone in the meeting', async function () {
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_OFF'));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.runAudioCheck('AUDIO_OFF'));
    }
  });
});
