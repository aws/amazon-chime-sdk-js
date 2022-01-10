const {ClickVideoButton, ClickBackgroundReplacementButton, ClickBackgroundBlurButton} = require('../steps');
const {LocalVideoCheck, RemoteVideoCheck, VideoBackgroundReplacementCheck, VideoBackgroundBlurCheck} = require('../checks');
const {SdkTestUtils} = require('./SdkTestUtils');
const SdkBaseTest = require('./SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const {Window} = require('./Window');

const BACKGROUND_FILTER_BLUR_TYPE = "blur" ;
const BACKGROUND_FILTER_REPLACEMENT_TYPE = "replacement" ;

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};
class BackgroundFilterTest extends SdkBaseTest {

  filter_type;

  constructor(name, kiteConfig, filter_type) {
    super(name, kiteConfig, name);
    this.filter_type = filter_type;
  }


  async runIntegrationTest() {

    if (this.filter_type !== BACKGROUND_FILTER_BLUR_TYPE && this.filter_type !== BACKGROUND_FILTER_REPLACEMENT_TYPE) {
      throw new Error("Invalid filter type used in background filter test: " + this.filter_type);
    }

    const attendee_id = uuidv4()
    const remote_attendee_id =uuidv4();
    const session = this.seleniumSessions[0];
    const test_window_1 = await Window.existing(session.driver, "TEST1");
    const test_window_2 = await Window.openNew(session.driver, "TEST2");

    await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, attendee_id, session));
    await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, remote_attendee_id, session));
    await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    
    if (this.filter_type === BACKGROUND_FILTER_BLUR_TYPE) {
      await test_window_1.runCommands(async () => await ClickBackgroundBlurButton.executeStep(this, session));
    }
    else if (this.filter_type === BACKGROUND_FILTER_REPLACEMENT_TYPE) {
      await test_window_1.runCommands(async () => await ClickBackgroundReplacementButton.executeStep(this, session));
    }

    await test_window_1.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    if (this.filter_type === BACKGROUND_FILTER_BLUR_TYPE) {
      await test_window_1.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id));
      await test_window_2.runCommands(async () => await VideoBackgroundBlurCheck.executeStep(this, session, attendee_id));
    }
    else if (this.filter_type === BACKGROUND_FILTER_REPLACEMENT_TYPE) {    
      await test_window_1.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
      await test_window_2.runCommands(async () => await VideoBackgroundReplacementCheck.executeStep(this, session, attendee_id));
    }

    await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));   
    await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));   
    await test_window_1.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
    await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
    await this.waitAllSteps();

 }
}

module.exports = BackgroundFilterTest;


