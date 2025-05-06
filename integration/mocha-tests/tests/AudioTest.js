const { describe, before, after, it } = require('mocha');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');

const { LogLevel } = require('../utils/Logger');
const setupTestEnvironment = require('../steps/TestSetup');

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
  let test_window;
  let monitor_window;
  let test_attendee_id;
  let monitor_attendee_id;
  let meetingId;
  let numberOfSessions;
  const testSetup = setupTestEnvironment('AudioTest');
  testSetup.setupBaseTest();

  describe('on single session', async function () {
    // before(async function () {
    //   if (numberOfSessions !== 1) {
    //     this.logger.log(
    //       `Skipping single session test because number of sessions required is ${numberOfSessions}`,
    //       LogLevel.WARN
    //     );
    //     this.skip();
    //   }
    // });

    afterEach(async function () {
      this.logger.printLogs();
    });

    describe('setup', async function () {
      it('should open the meeting demo in two tabs', async function () {
        test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
        monitor_window = await Window.openNew(this.driverFactoryOne.driver, this.logger, 'MONITOR');

        await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
        await monitor_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
      });

      it('should authenticate the user to the meeting', async function () {
        meetingId = uuidv4();
        test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
        monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

        await test_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));
        await monitor_window.runCommands(async () => await this.pageOne.enterMeetingId(meetingId));

        await test_window.runCommands(
          async () => await this.pageOne.enterAttendeeName(test_attendee_id)
        );
        await monitor_window.runCommands(
          async () => await this.pageOne.enterAttendeeName(monitor_attendee_id)
        );

        // TODO: Add region selection option if needed
        // await test_window.runCommands(async () => await page.selectRegion());
        // await monitor_window.runCommands(async () => await page.selectRegion());

        await test_window.runCommands(async () => await this.pageOne.authenticate());
        await monitor_window.runCommands(async () => await this.pageOne.authenticate());
      });
    });

    describe('user', async function () {
      it('should join the meeting', async function () {
        await test_window.runCommands(async () => await this.pageOne.joinMeeting());
        await monitor_window.runCommands(async () => await this.pageOne.joinMeeting());
      });
    });

    describe('meeting', async function () {
      it('should have two participants in the roster', async function () {
        await test_window.runCommands(async () => await this.pageOne.rosterCheck(2));
        await monitor_window.runCommands(async () => await this.pageOne.rosterCheck(2));
      });
    });

    describe('both attendee', async () => {
      it('should be muted at the start of the test', async function () {
        await test_window.runCommands(async () => await this.pageOne.muteMicrophone());
        await monitor_window.runCommands(async () => await this.pageOne.muteMicrophone());
      });
    });

    describe('test attendee', async function () {
      it('should play random tone', async function () {
        await test_window.runCommands(async () => await this.pageOne.playRandomTone());
      });
    });

    describe('monitor attendee', async function () {
      it('should check for random tone in the meeting', async function () {
        await monitor_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_ON'));
      });
    });

    describe('test user', async function () {
      it('should stop playing random tone', async function () {
        await test_window.runCommands(async () => await this.pageOne.stopPlayingRandomTone());
      });
    });

    describe('monitor user', async function () {
      it('should check for no random tone in the meeting', async function () {
        await test_window.runCommands(async () => await this.pageOne.runAudioCheck('AUDIO_OFF'));
      });
    });
  });
});
