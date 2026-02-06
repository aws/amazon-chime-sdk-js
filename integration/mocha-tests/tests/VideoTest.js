const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage, VideoState, ContentShareState } = require('../pages/MeetingPage');
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
  // The test browser audio devices occasionally trigger the failure detection. Until we figure out
  // why that occurs, we will just ignore them  
  const ignoredEvents = ['sendingAudioFailed', 'sendingAudioRecovered'];

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

  step('should validate meeting start events', async function () {
    const expected = [
      'videoInputUnselected',
      'audioInputSelected',
      'meetingStartRequested',
      'attendeePresenceReceived',
      'meetingStartSucceeded',
    ];

    await test_window.runCommands(async () =>
      this.pageOne.validateEvents(expected, ignoredEvents, {})
    );

    const monitorPage = this.numberOfSessions === 1 ? this.pageOne : this.pageTwo;
    await monitor_window.runCommands(async () =>
      monitorPage.validateEvents(expected, ignoredEvents, {})
    );
  });

  step('should have two participants in the roster', async function () {
    await test_window.runCommands(async () => await this.pageOne.rosterCheck(2));

    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.rosterCheck(2));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.rosterCheck(2));
    }
  });

  step('test attendee should turn on video', async function () {
    await test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('should validate videoInputSelected event', async function () {
    await test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputSelected'], ignoredEvents, {});
    });
  });

  step('test attendee should verify local video is on', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
  });

  step('monitor attendee should verify remote video is on', async function () {
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.PLAY, test_attendee_id));
    }
  });

  step('test attendee should turn off video', async function () {
    await test_window.runCommands(async () => await this.pageOne.turnVideoOff());
  });

  step('should validate videoInputUnselected event', async function () {
    await test_window.runCommands(async () => {
      await this.pageOne.validateEvents(['videoInputUnselected'], ignoredEvents, {});
    });
  });

  step('test attendee should verify local video is off', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, test_attendee_id));
  });

  step('monitor attendee should verify remote video is off', async function () {
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.OFF, test_attendee_id));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.OFF, test_attendee_id));
    }
  });

  // Content Share Section
  step('test attendee should start content share', async function () {
    await test_window.runCommands(async () => await this.pageOne.startContentShareTestVideo());
  });

  step('both attendees should see content share', async function () {
    await test_window.runCommands(async () => 
      await this.pageOne.checkContentShareVideoState(ContentShareState.PLAY, test_attendee_id)
    );
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.PLAY, test_attendee_id)
      );
    } else {
      await monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.PLAY, test_attendee_id)
      );
    }
  });

  // Content Share Pause/Resume Section
  step('test attendee should pause content share', async function () {
    await test_window.runCommands(async () => await this.pageOne.toggleContentSharePause());
  });

  step('both attendees should see paused content', async function () {
    await test_window.runCommands(async () => 
      await this.pageOne.checkContentShareVideoState(ContentShareState.PAUSE, test_attendee_id)
    );
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.PAUSE, test_attendee_id)
      );
    } else {
      await monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.PAUSE, test_attendee_id)
      );
    }
  });

  // Content Share Stop Section
  step('test attendee should stop content share', async function () {
    await test_window.runCommands(async () => await this.pageOne.stopContentShare());
  });

  step('content share should be stopped for both', async function () {
    await test_window.runCommands(async () => 
      await this.pageOne.checkContentShareVideoState(ContentShareState.OFF, test_attendee_id)
    );
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => 
        await this.pageOne.checkContentShareVideoState(ContentShareState.OFF, test_attendee_id)
      );
    } else {
      await monitor_window.runCommands(async () => 
        await this.pageTwo.checkContentShareVideoState(ContentShareState.OFF, test_attendee_id)
      );
    }
  });

  // Video Processing Section - Background Blur
  step('test attendee should turn video back on for filter test', async function () {
    await test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('test attendee should verify local video is on before applying filter', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
  });

  step('test attendee should enable background blur', async function () {
    await test_window.runCommands(async () => await this.pageOne.enableBackgroundBlur());
  });

  step('background blur should be active', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoFilterApplied('backgroundBlur'));
  });

  step('video should still be playing with filter', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
  });

  step('monitor attendee should see filtered video', async function () {
    if (this.numberOfSessions === 1) {
      await monitor_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
    } else {
      await monitor_window.runCommands(async () => await this.pageTwo.checkVideoState(VideoState.PLAY, test_attendee_id));
    }
  });
});
