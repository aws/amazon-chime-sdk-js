const { describe, before, after, it } = require('mocha');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const WebDriverFactory = require('../utils/WebDriverFactory');
const SdkBaseTest = require('../utils/SdkBaseTest');
const AudioTestPage = require('../pages/AudioTestPage');
const { Logger, LogLevel } = require('../utils/Logger');

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
  describe('run test', async function () {
    let driverFactoryOne;
    let driverFactoryTwo;
    let baseTestConfigOne;
    let baseTestConfigTwo;
    let pageOne;
    let pageTwo;
    let test_window;
    let monitor_window;
    let test_attendee_id;
    let monitor_attendee_id;
    let meetingId;
    let numberOfSessions;
    let failureCount;

    before(async function () {
      this.logger = new Logger('AudioTest');
      this.logger.log('Retrieving the base test config');
      baseTestConfigOne = new SdkBaseTest();
      this.logger.log('Configuring the webdriver');
      driverFactoryOne = new WebDriverFactory(
        baseTestConfigOne.testName,
        baseTestConfigOne.host,
        baseTestConfigOne.testType,
        baseTestConfigOne.url
      );
      await driverFactoryOne.build();
      this.logger.log('Using the webdriver, opening the browser window');
      numberOfSessions = driverFactoryOne.numberOfSessions;
      driverFactoryOne.driver.manage().window().maximize();
      this.logger.log('Instantiating selenium helper class');
      pageOne = new AudioTestPage(driverFactoryOne.driver, this.logger);
      failureCount = 0;
    });

    afterEach(async function () {
      if (this.currentTest.state === 'failed') failureCount += 1;
    });

    after(async function () {
      this.logger.log('Closing the webdriver');
      const passed = failureCount === 0;

      await driverFactoryOne.quit(passed);

      if (passed === true) {
        this.logger.log('AudioTest passed!!!', LogLevel.SUCCESS);
        process.exit(0);
      } else {
        this.logger.log('AudioTest failed!!!', LogLevel.ERROR);
        process.exit(1);
      }
    });

    describe('on single session', async function () {
      before(async function () {
        if (numberOfSessions !== 1) {
          this.logger.log(
            `Skipping single session test because number of sessions required is ${numberOfSessions}`,
            LogLevel.WARN
          );
          this.skip();
        }
      });

      afterEach(async function () {
        this.logger.printLogs();
      });

      describe('setup', async function () {
        it('should open the meeting demo in two tabs', async function () {
          test_window = await Window.existing(driverFactoryOne.driver, this.logger, 'TEST');
          monitor_window = await Window.openNew(driverFactoryOne.driver, this.logger, 'MONITOR');

          await test_window.runCommands(async () => await pageOne.open(driverFactoryOne.url));
          await monitor_window.runCommands(async () => await pageOne.open(driverFactoryOne.url));
        });

        it('should authenticate the user to the meeting', async function () {
          meetingId = uuidv4();
          test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
          monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

          await test_window.runCommands(async () => await pageOne.enterMeetingId(meetingId));
          await monitor_window.runCommands(async () => await pageOne.enterMeetingId(meetingId));

          await test_window.runCommands(
            async () => await pageOne.enterAttendeeName(test_attendee_id)
          );
          await monitor_window.runCommands(
            async () => await pageOne.enterAttendeeName(monitor_attendee_id)
          );

          // TODO: Add region selection option if needed
          // await test_window.runCommands(async () => await page.selectRegion());
          // await monitor_window.runCommands(async () => await page.selectRegion());

          await test_window.runCommands(async () => await pageOne.authenticate());
          await monitor_window.runCommands(async () => await pageOne.authenticate());
        });
      });

      describe('user', async function () {
        it('should join the meeting', async function () {
          await test_window.runCommands(async () => await pageOne.joinMeeting());
          await monitor_window.runCommands(async () => await pageOne.joinMeeting());
        });
      });

      describe('meeting', async function () {
        it('should have two participants in the roster', async function () {
          await test_window.runCommands(async () => await pageOne.rosterCheck(2));
          await monitor_window.runCommands(async () => await pageOne.rosterCheck(2));
        });
      });

      describe('both attendee', async () => {
        it('should be muted at the start of the test', async function () {
          // TODO: Currently, the meeting demo does not have an option for the attendee to join muted.
          // Using selenium to mute the attendees at this point. The demo should be updated to allow an option to join in the future.
          await test_window.runCommands(async () => await pageOne.muteMicrophone());
          await monitor_window.runCommands(async () => await pageOne.muteMicrophone());
        });
      });

      describe('test attendee', async function () {
        it('should play random tone', async function () {
          await test_window.runCommands(async () => await pageOne.playRandomTone());
        });
      });

      describe('monitor attendee', async function () {
        it('should check for random tone in the meeting', async function () {
          await monitor_window.runCommands(async () => await pageOne.runAudioCheck('AUDIO_ON'));
        });
      });

      describe('test user', async function () {
        it('should stop playing random tone', async function () {
          await test_window.runCommands(async () => await pageOne.stopPlayingRandomTone());
        });
      });

      describe('monitor user', async function () {
        it('should check for no random tone in the meeting', async function () {
          await test_window.runCommands(async () => await pageOne.runAudioCheck('AUDIO_OFF'));
        });
      });
    });

    describe('on two sessions', async function () {
      before(async function () {
        if (numberOfSessions !== 2) {
          this.logger.log(
            `Skipping two sessions test because number of sessions required is ${numberOfSessions}`,
            LogLevel.WARN
          );
          this.skip();
        } else {
          baseTestConfigTwo = new SdkBaseTest();
          driverFactoryTwo = new WebDriverFactory(
            baseTestConfigTwo.testName,
            baseTestConfigTwo.host,
            baseTestConfigTwo.testType,
            baseTestConfigTwo.url
          );
          await driverFactoryTwo.build();
          driverFactoryTwo.driver.manage().window().maximize();
          pageTwo = new AudioTestPage(driverFactoryTwo.driver, this.logger);
        }
      });

      after(async function () {
        if (numberOfSessions === 2) {
          driverFactoryTwo.driver.quit();
        }
      });

      afterEach(async function () {
        this.logger.printLogs();
      });

      describe('setup', async function () {
        it('should open the meeting demo in two windows', async function () {
          test_window = await Window.existing(driverFactoryOne.driver, this.logger, 'TEST');
          monitor_window = await Window.existing(driverFactoryTwo.driver, this.logger, 'MONITOR');

          await test_window.runCommands(async () => await pageOne.open(driverFactoryOne.url));
          await monitor_window.runCommands(async () => await pageTwo.open(driverFactoryOne.url));
        });

        it('should authenticate the user to the meeting', async function () {
          meetingId = uuidv4();
          test_attendee_id = 'Test Attendee - ' + uuidv4().toString();
          monitor_attendee_id = 'Monitor Attendee - ' + uuidv4().toString();

          await test_window.runCommands(async () => await pageOne.enterMeetingId(meetingId));
          await monitor_window.runCommands(async () => await pageTwo.enterMeetingId(meetingId));

          await test_window.runCommands(
            async () => await pageOne.enterAttendeeName(test_attendee_id)
          );
          await monitor_window.runCommands(
            async () => await pageTwo.enterAttendeeName(monitor_attendee_id)
          );

          // TODO: Add region selection option if needed
          // await test_window.runCommands(async () => await page.selectRegion());
          // await monitor_window.runCommands(async () => await page.selectRegion());

          await test_window.runCommands(async () => await pageOne.authenticate());
          await monitor_window.runCommands(async () => await pageTwo.authenticate());
        });
      });

      describe('user', async function () {
        it('should join the meeting', async function () {
          await test_window.runCommands(async () => await pageOne.joinMeeting());
          await monitor_window.runCommands(async () => await pageTwo.joinMeeting());
        });
      });

      describe('meeting', async function () {
        it('should have two participants in the roster', async function () {
          await test_window.runCommands(async () => await pageOne.rosterCheck(2));
          await monitor_window.runCommands(async () => await pageTwo.rosterCheck(2));
        });
      });

      describe('both attendee', async () => {
        it('should be muted at the start of the test', async function () {
          // TODO: Currently, the meeting demo does not have an option for the attendee to join muted.
          // Using selenium to mute the attendees at this point. The demo should be updated to allow an option to join in the future.
          await test_window.runCommands(async () => await pageOne.muteMicrophone());
          await monitor_window.runCommands(async () => await pageTwo.muteMicrophone());
        });
      });

      describe('test attendee', async function () {
        it('should play random tone', async function () {
          await test_window.runCommands(async () => await pageOne.playRandomTone());
        });
      });

      describe('monitor attendee', async function () {
        it('should check for random tone in the meeting', async function () {
          await monitor_window.runCommands(async () => await pageTwo.runAudioCheck('AUDIO_ON'));
        });
      });

      describe('test user', async function () {
        it('should stop playing random tone', async function () {
          await test_window.runCommands(async () => await pageOne.stopPlayingRandomTone());
        });
      });

      describe('monitor user', async function () {
        it('should check for no random tone in the meeting', async function () {
          await test_window.runCommands(async () => await pageTwo.runAudioCheck('AUDIO_OFF'));
        });
      });
    });
  });
});
