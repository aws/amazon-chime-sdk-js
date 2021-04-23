const {By} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');
const { v4: uuidv4 } = require('uuid');

let elements;

function findAllElements() {
  // These will be stale after a reload.
  elements = {
    meetingIdInput: By.id('inputMeeting'),
    attendeeNameInput: By.id('inputName'),
    joinMeetingButton: By.id('join-meeting'),
    startLocalVideoButton: By.id('start-local-video'),
    stopLocalVideoButton: By.id('stop-local-video'),
    unbindVideoElementTileIdInput: By.id('unbind-video-element-tile-id'),
    unbindVideoElementButton: By.id('unbind-video-element'),
    bindVideoElementTileIdInput: By.id('bind-video-element-tile-id'),
    bindVideoElementIdInput: By.id('bind-video-element-video-element'),
    bindVideoElementButton: By.id('bind-video-element'),
    localVideoTileState: By.id('tile-1-state'),
    addVideoTileButton: By.id('add-video-tile-btn'),
    hasStartedLocalVideoTileButton: By.id('has-started-local-video-tile-btn'),
    getLocalVideoTileButton: By.id('get-local-video-tile-btn'),
    haveVideoTileForAttendeeIdButton: By.id('have-video-tile-for-attendeeId-btn'),
    haveVideoTileForAttendeeIdInput: By.id('have-video-tile-for-attendee-id'),
    haveVideoTilesWithStreamsButton: By.id('have-video-tiles-with-streams-btn'),
    sendTileStateUpdateButton: By.id('send-tile-state-update-btn'),
    getAllVideoTilesButton: By.id('get-all-video-tiles-btn'),
    getAllRemoteVideoTilesButton: By.id('get-all-remote-video-tiles-btn'),
    removeAllVideoTilesButton: By.id('remove-all-video-tiles-btn'),
    videoTileElementId: By.id('video-tile-id'),
    totalRemoteVideoTilesElementId: By.id('total-remote-video-tiles-count'),
    totalVideoTilesElementId: By.id('total-video-tiles-count'),
    localVideoTileElementId: By.id('local-video-tile-id'),
    hasStartedLocalVideoTileElementId: By.id('has-started-local-video-tile-boolean'),
    haveVideoTileForAttendeeIdElementId: By.id('have-video-tile-for-attendeeId-boolean'),
    haveVideoTilesWithStreamsElementId: By.id('have-video-tiles-with-streams-boolean'),
    pinVideoTileAttendeeIdInput: By.id('pin-attendee-id'),
    pinVideoTileButton: By.id('pin-video-tile'),
    unpinVideoTileAttendeeIdInput: By.id('unpin-attendee-id'),
    unpinVideoTileButton: By.id('unpin-video-tile'),
    videoPreference: By.id('video-preference'),
  };
}

findAllElements();

class TestAppPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
  }

  findAllElements() {
    findAllElements();
  }

  async open(stepInfo) {
    await TestUtils.open(stepInfo);
  }

  async close(stepInfo) {
    await stepInfo.driver.close();
  }

  async enterMeetingId(meetingId) {
    let meetingIdInputBox = await this.driver.findElement(elements.meetingIdInput);
    await meetingIdInputBox.clear();
    await meetingIdInputBox.sendKeys(meetingId);
  }

  async enterAttendeeName() {
    this.attendeeName = uuidv4();
    let attendeeNameInputBox = await this.driver.findElement(elements.attendeeNameInput);
    await attendeeNameInputBox.clear();
    await attendeeNameInputBox.sendKeys(this.attendeeName);
  }

  async enterMeetingTitle(meetingTitle) {
    await this.enterMeetingId(meetingTitle);
    let joinMeetingButton = await this.driver.findElement(elements.joinMeetingButton);
    await joinMeetingButton.click();
  }

  async authenticate() {
    this.meetingTitle = uuidv4();
    await this.enterMeetingId(this.meetingTitle);
    let joinMeetingButton = await this.driver.findElement(elements.joinMeetingButton);
    await joinMeetingButton.click();
  }

  async waitForAuthentication() {
    await TestUtils.waitAround(5000);
  }

  async clickStartLocalVideoButton() {
    let startLocalVideoButton = await this.driver.findElement(elements.startLocalVideoButton);
    await startLocalVideoButton.click();
  }

  async clickStopLocalVideoButton() {
    let stopLocalVideoButton = await this.driver.findElement(elements.stopLocalVideoButton);
    await stopLocalVideoButton.click();
  }

  async clickUnbindVideoElementButton(tileId) {
    let unbindVideoElementButton = await this.driver.findElement(elements.unbindVideoElementButton);
    let unbindVideoElementTileIdInput = await this.driver.findElement(elements.unbindVideoElementTileIdInput);
    await unbindVideoElementTileIdInput.clear();
    await unbindVideoElementTileIdInput.sendKeys(tileId);
    await unbindVideoElementButton.click();
  }

  async clickPinVideoTileButton(attendeeId) {
    let pinVideoTileButton = await this.driver.findElement(elements.pinVideoTileButton);
    let pinVideoTileAttendeeIdInput = await this.driver.findElement(elements.pinVideoTileAttendeeIdInput);
    await pinVideoTileAttendeeIdInput.clear();
    await pinVideoTileAttendeeIdInput.sendKeys(attendeeId);
    await pinVideoTileButton.click();
  }

  async clickUnpinVideoTileButton(attendeeId) {
    let unpinVideoTileButton = await this.driver.findElement(elements.unpinVideoTileButton);
    let unpinVideoTileAttendeeIdInput = await this.driver.findElement(elements.unpinVideoTileAttendeeIdInput);
    await unpinVideoTileAttendeeIdInput.clear();
    await unpinVideoTileAttendeeIdInput.sendKeys(attendeeId);
    await unpinVideoTileButton.click();
  }

  async clickBindVideoElementButton(tileId, videoElementId) {
    let bindVideoElementButton = await this.driver.findElement(elements.bindVideoElementButton);
    let bindVideoElementTileIdInput = await this.driver.findElement(elements.bindVideoElementTileIdInput);
    let bindVideoElementIdInput = await this.driver.findElement(elements.bindVideoElementIdInput);
    await bindVideoElementIdInput.clear();
    await bindVideoElementTileIdInput.clear();
    await bindVideoElementIdInput.sendKeys(videoElementId);
    await bindVideoElementTileIdInput.sendKeys(tileId);
    await bindVideoElementButton.click();
  }

  async tileStateCheck(tileStateElementId, tileStateAttribute, tileStateValue) {
    let localVideoTileState = await this.driver.findElement(By.id(tileStateElementId));
    if (!localVideoTileState) {
      return false;
    }
    let tileState =  await localVideoTileState.getText();
    if (!tileState) {
      return false;
    }
    let tileStateJson = JSON.parse(tileState);
    let tileStateJsonAttribute = tileStateJson[tileStateAttribute];
    if (tileStateValue === tileStateJsonAttribute) {
      return true;
    }
    return false;
  }

  async videoPreferenceCheck(attendeeId, priority, targetSize) {
    let videoPreference = await this.driver.findElement(elements.videoPreference);
    if (!videoPreference) {
      return false;
    }
    let preference =  await videoPreference.getText();
    if (!preference) {
      return false;
    }
    let preferenceJson = JSON.parse(preference);
    let attendeeIdAttribute = preferenceJson['attendeeId'];
    let priorityAttribute = preferenceJson['priority'];
    let targetSizeAttribute = preferenceJson['targetSize'];
    if (attendeeIdAttribute === attendeeId &&
        priorityAttribute === priority &&
        targetSizeAttribute === targetSize) {
      return true;
    }
    return false;
  }

  async addVideoTileCheck(expectedTileId) {
    let tileIdElement = await this.driver.findElement(elements.videoTileElementId);
    if (!tileIdElement) {
      return false;
    }
    let tileIdText =  await tileIdElement.getText();
    if (!tileIdText) {
      return false;
    }
    
    if (expectedTileId === tileIdText) {
      return true;
    }
    return false;
  }

  async getAllRemoteVideoTilesCheck(expectedTotalRemoteVideoTilesCount) {
    let totalRemoteVideoTilesCountElement = await this.driver.findElement(elements.totalRemoteVideoTilesElementId);
    if (!totalRemoteVideoTilesCountElement) {
      return false;
    }
    let totalRemoteVideoTilesCount =  await totalRemoteVideoTilesCountElement.getText();
    if (!totalRemoteVideoTilesCount) {
      return false;
    }
    
    if (expectedTotalRemoteVideoTilesCount === totalRemoteVideoTilesCount) {
      return true;
    }
    return false;
  }

  async getAllVideoTilesCheck(expectedTotalVideoTilesCount) {
    let totalVideoTilesCountElement = await this.driver.findElement(elements.totalVideoTilesElementId);
    if (!totalVideoTilesCountElement) {
      return false;
    }
    let totalVideoTilesCount =  await totalVideoTilesCountElement.getText();
    if (!totalVideoTilesCount) {
      return false;
    }
    
    if (expectedTotalVideoTilesCount === totalVideoTilesCount) {
      return true;
    }
    return false;
  }

  async getLocalVideoTileCheck(expectedLocalTileId) {
    let localVideoTileIdElement = await this.driver.findElement(elements.localVideoTileElementId);
    if (!localVideoTileIdElement) {
      return false;
    }
    let localVideoTileId =  await localVideoTileIdElement.getText();
    if (!localVideoTileId) {
      return false;
    }
    
    if (expectedLocalTileId === localVideoTileId) {
      return true;
    }
    return false;
  }

  async elementBooleanCheck(expectedValue, element) {
    let booleanElement = await this.driver.findElement(elements[element]);
    if (!booleanElement) {
      return false;
    }
    let value =  await booleanElement.getText();
    
    if (expectedValue === value) {
      return true;
    }
    return false;
  }


  async clickAddVideoTileButton() {
    let addVideoTileButton = await this.driver.findElement(elements.addVideoTileButton);
    await addVideoTileButton.click();
  }

  async clickHasStartedLocalVideoTileButton() {
    let hasStartedLocalVideoTileButton = await this.driver.findElement(elements.hasStartedLocalVideoTileButton);
    await hasStartedLocalVideoTileButton.click();
  }

  async clickGetLocalVideoTileButton() {
    let getLocalVideoTileButton = await this.driver.findElement(elements.getLocalVideoTileButton);
    await getLocalVideoTileButton.click();
  }

  async clickHaveVideoTileForAttendeeIdButton(attendeeId) {
    let haveVideoTileForAttendeeIdButton = await this.driver.findElement(elements.haveVideoTileForAttendeeIdButton);
    let haveVideoTileForAttendeeIdInput = await this.driver.findElement(elements.haveVideoTileForAttendeeIdInput);
    await haveVideoTileForAttendeeIdInput.clear();
    await haveVideoTileForAttendeeIdInput.sendKeys(attendeeId);
    await haveVideoTileForAttendeeIdButton.click();
  }

  async clickSendTileStateUpdateButton() {
    let sendTileStateUpdateButton = await this.driver.findElement(elements.sendTileStateUpdateButton);
    await sendTileStateUpdateButton.click();
  }

  async clickGetAllVideoTilesButton() {
    let getAllVideoTilesButton = await this.driver.findElement(elements.getAllVideoTilesButton);
    await getAllVideoTilesButton.click();
  }

  async clickGetAllRemoteVideoTilesButton() {
    let clickGetAllRemoteVideoTilesButton = await this.driver.findElement(elements.getAllRemoteVideoTilesButton);
    await clickGetAllRemoteVideoTilesButton.click();
  }

  async clickHaveVideoTilesWithStreamsButton() {
    let haveVideoTilesWithStreamsButton = await this.driver.findElement(elements.haveVideoTilesWithStreamsButton);
    await haveVideoTilesWithStreamsButton.click();
  }

  async clickRemoveAllVideoTilesButton() {
    let removeAllVideoTilesButton = await this.driver.findElement(elements.removeAllVideoTilesButton);
    await removeAllVideoTilesButton.click();
  }

  async getBoundAttendeeIdStep() {
    let localVideoTileState = await this.driver.findElement(By.id('tile-1-state'));
    let tileState =  await localVideoTileState.getText();
    let tileStateJson = JSON.parse(tileState);
    let tileStateBoundAttendeeId = tileStateJson["boundAttendeeId"];
    return tileStateBoundAttendeeId;
  }
}

module.exports = TestAppPage;
