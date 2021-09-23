const { AuthenticateUserStep, JoinMeetingStep, OpenAppStep, ClickContentShareButton, ClickVideoButton, ClickMediaCaptureButton, EndMeetingStep } = require('./steps');
const { ContentShareVideoCheck, LocalVideoCheck, RosterCheck, UserAuthenticationCheck, UserJoinedMeetingCheck } = require('./checks');
const { AppPage } = require('./pages/AppPage');
const { TestUtils } = require('./node_modules/kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { Window } = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

class MediaCaptureTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, 'MediaCapture');
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;
    const session = this.seleniumSessions[0];

    // Join a meeting from two browser sessions with video on
    const testAttendeeId = uuidv4();
    const monitorAttendeeId = uuidv4();

    const testWindow = await Window.existing(session.driver, 'TEST');
    const monitorWindow = await Window.openNew(session.driver, 'MONITOR');

    const meetingId = uuidv4();
    console.log(`testing region: ${this.region}, meetingId: ${meetingId}`);

    await testWindow.runCommands(async () => await this.addUserToMeeting(testAttendeeId, session, this.region));
    await testWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await testWindow.runCommands(async () => await ClickContentShareButton.executeStep(this, session, "ON"));
    await TestUtils.waitAround(5000);
    await testWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));
    await testWindow.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", testAttendeeId));

    await monitorWindow.runCommands(async () => await this.addUserToMeeting(monitorAttendeeId, session, this.region));
    await monitorWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await monitorWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));
    await monitorWindow.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", testAttendeeId));

    // Start media capture session
    await testWindow.runCommands(async () => await ClickMediaCaptureButton.executeStep(this, session));
    await testWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));
    await monitorWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));

    await TestUtils.waitAround(15000);

    // One at a time, have the browser sessions turn OFF and ON video & content share
    await testWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await testWindow.runCommands(async () => await ClickContentShareButton.executeStep(this, session, "OFF"));

    await TestUtils.waitAround(5000);

    await testWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));
    await testWindow.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "OFF", testAttendeeId));
    await testWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 3));
    await monitorWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 3));

    await testWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await testWindow.runCommands(async () => await ClickContentShareButton.executeStep(this, session, "ON"));

    await TestUtils.waitAround(5000);

    await testWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));
    await testWindow.runCommands(async () => await ContentShareVideoCheck.executeStep(this, session, "ON", testAttendeeId));
    await testWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));
    await monitorWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));

    await monitorWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await monitorWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_OFF'));

    await monitorWindow.runCommands(async () => await ClickVideoButton.executeStep(this, session));
    await monitorWindow.runCommands(async () => await LocalVideoCheck.executeStep(this, session, 'VIDEO_ON'));

    await TestUtils.waitAround(5000);

    await testWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));
    await monitorWindow.runCommands(async () => await RosterCheck.executeStep(this, session, 4));

    await testWindow.runCommands(async () => await EndMeetingStep.executeStep(this, session));
    await this.waitAllSteps();
  }

  async addUserToMeeting(attendee_id, sessionInfo, region) {
    await OpenAppStep.executeStep(this, sessionInfo);
    await AuthenticateUserStep.executeStep(this, sessionInfo, attendee_id, false, false, false, region);
    await UserAuthenticationCheck.executeStep(this, sessionInfo);
    await JoinMeetingStep.executeStep(this, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(this, sessionInfo, attendee_id);
  }
}

module.exports = MediaCaptureTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new MediaCaptureTest('Media Capture test', kiteConfig);
  await test.run();
})();
