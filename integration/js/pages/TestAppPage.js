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

  async enterAttendeeName(attendeeName) {
    let attendeeNameInputBox = await this.driver.findElement(elements.attendeeNameInput);
    await attendeeNameInputBox.clear();
    await attendeeNameInputBox.sendKeys(attendeeName);
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

}

module.exports = TestAppPage;
