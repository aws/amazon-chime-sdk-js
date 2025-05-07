const { describe, it } = require('mocha');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage, VideoState} = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * 1. Starts a meeting
 * 2. Adds 2 participants to the meeting
 * 3. One attendee enables video
 * 4. Check if both attendees are able to view the video
 * 5. Same attendee disables video
 * 6. Check if both attendees are not able to view the video
 * */
describe('VideoTest', async function () {
  // Get the test setup functions
  const testSetup = setupTestEnvironment('VideoTest', MeetingPage);

  let test_window;
  let monitor_window;
  let test_attendee_id;
  let monitor_attendee_id;
  let meetingId;

  testSetup.setupBaseTest();

  describe('setup', async function () {
    it('should open the meeting demo', async function () {
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

    it('should authenticate the user to the meeting', async function () {
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
  });

  describe('join meeting', async function () {
    it('should join the meeting', async function () {
      await test_window.runCommands(async () => await this.pageOne.joinMeeting());

      if (this.numberOfSessions === 1) {
        await monitor_window.runCommands(async () => await this.pageOne.joinMeeting());
      } else {
        await monitor_window.runCommands(async () => await this.pageTwo.joinMeeting());
      }
    });
  });

  describe('roster check', async function () {
    it('should have two participants in the roster', async function () {
      await test_window.runCommands(async () => await this.pageOne.rosterCheck(2));

      if (this.numberOfSessions === 1) {
        await monitor_window.runCommands(async () => await this.pageOne.rosterCheck(2));
      } else {
        await monitor_window.runCommands(async () => await this.pageTwo.rosterCheck(2));
      }
    });
  });

  describe('test attendee', async function () {
    it('should turn on video', async function () {
      await test_window.runCommands(async () => await this.pageOne.turnVideoOn());
    });

    it('should verify local video is on', async function () {
      await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
    });
  });

  describe('monitor attendee', async function () {
    it('should verify remote video is on', async function () {
      if (this.numberOfSessions === 1) {
        await monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
      } else {
        await monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.PLAY, test_attendee_id));
      }
    });
  });

  describe('test attendee', async function () {
    it('should turn off video', async function () {
      await test_window.runCommands(async () => await this.pageOne.turnVideoOff());
    });

    it('should verify local video is off', async function () {
      await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, test_attendee_id));
    });
  });

  describe('monitor attendee', async function () {
    it('should verify remote video is off', async function () {
      if (this.numberOfSessions === 1) {
        await monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, test_attendee_id));
      } else {
        await monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.OFF, test_attendee_id));
      }
    });
  });
});
