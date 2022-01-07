const {ClickVideoButton} = require('../steps');
const {LocalVideoCheck, RemoteVideoCheck} = require('../checks');
const {SdkTestUtils} = require('./SdkTestUtils');
const SdkBaseTest = require('./SdkBaseTest');
const { v4: uuidv4 } = require('uuid');
const {Window} = require('./Window');

class BackgroundFilterBaseTest extends SdkBaseTest {
    constructor(name, kiteConfig) {
        super(name, kiteConfig, name);
    }

    async runIntegrationTest() {
        const attendee_id = uuidv4()
        const remote_attendee_id =uuidv4();
        const session = this.seleniumSessions[0];
        const test_window_1 = await Window.existing(session.driver, "TEST1");
        const test_window_2 = await Window.openNew(session.driver, "TEST2");

        const test_run_info = {
            attendee_id,
            remote_attendee_id,
            session,
            test_window_1,
            test_window_2
        };
        await test_window_1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, attendee_id, session));
        await test_window_2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, remote_attendee_id, session));
        await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));
        await this.clickBackgroundFilterButton(test_run_info);
        await test_window_1.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));
        await this.checkBackgroundFilter(test_run_info);
        await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_ON'));   
        await test_window_1.runCommands(async () => await ClickVideoButton.executeStep(this, session));   
        await test_window_1.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
        await test_window_2.runCommands(async () => await RemoteVideoCheck.executeStep(this, session, 'VIDEO_OFF'));   
        await this.waitAllSteps();
    }
    
    async clickBackgroundFilterButton(test_run_info)  {
        throw new Error("clickBackgroundFilterButton is not implemented");
    }

    async checkBackgroundFilter(test_run_info) {
        throw new Error("checkBackgroundFilter is not implemented");
    }
    
}

module.exports = BackgroundFilterBaseTest;


