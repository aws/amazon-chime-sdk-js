const {OpenAppStep, WaitForMeetingToBeCreated, JoinVideoTestMeetingStep, ClickStartLocalVideoButton, AuthenticateUserStep, ClickStopLocalVideoButton, ClickHasStartedLocalVideoTileButton, ClickAddVideoTileButton, ClickGetLocalVideoTileButton, ClickHaveVideoTileForAttendeeIdButton, ClickSendTileStateUpdateButton, ClickGetAllVideoTilesButton, ClickGetAllRemoteVideoTilesButton, ClickHaveVideoTilesWithStreamsButton, ClickRemoveAllVideoTilesButton, WaitForRemoteUserToJoinMeeting} = require('./steps');
const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {TileStateCheck, AddVideoTileCheck, GetAllVideoTilesCheck, HasStartedLocalVideoTileCheck, HaveVideoTilesWithStreamsCheck, GetAllRemoteVideoTilesCheck, GetLocalVideoTileCheck, HaveVideoTileForAttendeeIdCheck} = require('./checks');
const { v4: uuidv4 } = require('uuid');

class VideoTestEnd2End extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, "TestAppVideoEnd2End");
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;
    const attendeeId = uuidv4();
    const meetingTitle = 'video_end2end_test_' + uuidv4() ;
    const session = this.seleniumSessions[0];
    const useSimulcast = this.useSimulcast;
    await OpenAppStep.executeStep(this, session);
    // local user join meeting step 
    await JoinVideoTestMeetingStep.executeStep(this, session, attendeeId, meetingTitle, useSimulcast);
    // local user call startLocalVideoTile to start sharing the local video tile which was created in addVideoTile Step 
    // Binds the created local video tile to the local video stream and then returns its tile id.
    await ClickStartLocalVideoButton.executeStep(this, session);
    // check if hasStartedLocalVideoTile is true to verify the local video tile has been started.
    await ClickHasStartedLocalVideoTileButton.executeStep(this, session);
    await HasStartedLocalVideoTileCheck.executeStep(this, session, 'true');
    // returns the current local video tile if it executed.
    await ClickGetLocalVideoTileButton.executeStep(this, session);
    await GetLocalVideoTileCheck.executeStep(this, session, '1')
    // returns the number of all video tiles
    await ClickGetAllVideoTilesButton.executeStep(this,session);
    await GetAllVideoTilesCheck.executeStep(this, session, '1');
    // reutrns the number of all remote video tiles
    await ClickGetAllRemoteVideoTilesButton.executeStep(this,session);
    await GetAllRemoteVideoTilesCheck.executeStep(this, session, '0');
    // check if haveVideoTileForAttendeeId is ture to verify the attendeeId is associated with a video tile
    await ClickHaveVideoTileForAttendeeIdButton.executeStep(this, session);
    await HaveVideoTileForAttendeeIdCheck.executeStep(this, session, 'true');
    // check if haveVideoTilesWithStreams is true∂
    await ClickHaveVideoTilesWithStreamsButton.executeStep(this, session);
    await HaveVideoTilesWithStreamsCheck.executeStep(this, session, 'true');
    // stop local video tile and verify
    await ClickStopLocalVideoButton.executeStep(this, session);
    await ClickHasStartedLocalVideoTileButton.executeStep(this, session);
    await HasStartedLocalVideoTileCheck.executeStep(this, session, 'false');
    await ClickHaveVideoTilesWithStreamsButton.executeStep(this, session);
    await HaveVideoTilesWithStreamsCheck.executeStep(this, session, 'false');
    // call sendTileStateUpdate to broadcase tile state updates
    await ClickSendTileStateUpdateButton.executeStep(this, session);
    // call removeAllVideoTiles
    await ClickRemoveAllVideoTilesButton.executeStep(this, session);
    await ClickGetAllVideoTilesButton.executeStep(this,session);
    await GetAllVideoTilesCheck.executeStep(this, session, '0');
     // create a video tile
    await ClickAddVideoTileButton.executeStep(this, session);
    await AddVideoTileCheck.executeStep(this, session, '2');
    await this.waitAllSteps();
  }
}

module.exports = VideoTestEnd2End;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new VideoTestEnd2End('Test App End2End Video Test', kiteConfig);
  await test.run();
})();
