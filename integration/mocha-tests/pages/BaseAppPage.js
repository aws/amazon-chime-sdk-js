const { By, until } = require('selenium-webdriver');
const { LogLevel } = require('../utils/Logger');

let elements;

function findAllElements() {
  // These will be stale after a reload.
  elements = {
    meetingIdInput: By.id('inputMeeting'),
    attendeeNameInput: By.id('inputName'),
    authenticateButton: By.id('authenticate'),
    joinButton: By.id('joinButton'),
    roster: By.id('roster'),
    participants: By.css('li'),

    authenticationFlow: By.id('flow-authenticate'),
    deviceFlow: By.id('flow-devices'),
    meetingFlow: By.id('flow-meeting'),

    microphoneDropDownButton: By.id('button-microphone-drop'),
    microphoneButton: By.id('button-microphone'),
    microphoneDropDown: By.id('dropdown-menu-microphone'),
    microphoneDropDown440HzButton: By.id('dropdown-menu-microphone-440-Hz'),
  };
}

class BaseAppPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
    findAllElements();
  }

  async open(url) {
    this.logger.pushLogs(`Opening demo at url: ${url}`);
    await this.driver.get(url);
    await this.waitForBrowserDemoToLoad();
  }

  async waitForBrowserDemoToLoad() {
    await this.driver.wait(
      until.elementIsVisible(this.driver.findElement(elements.authenticationFlow))
    );
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

  async selectRegion(region) {
    await this.driver.findElement(By.css(`option[value=${region}]`)).click();
  }

  async authenticate() {
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await authenticateButton.click();
    await this.waitForUserAuthentication();
  }

  async waitForUserAuthentication() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.joinButton)));
  }

  async joinMeeting() {
    let joinButton = await this.driver.findElement(elements.joinButton);
    await joinButton.click();
    await this.waitForUserJoin();
  }

  async waitForUserJoin() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.meetingFlow)));
  }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await this.driver.wait(until.elementIsVisible(microphoneButton));
    await microphoneButton.click();
  }

  async getMicrophoneStatus() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await this.driver.wait(until.elementIsVisible(microphoneButton));
    let classNamesString = await microphoneButton.getAttribute('class');
    let classNames = classNamesString.split(' ');
    return classNames;
  }

  async muteMicrophone() {
    let classNames = await this.getMicrophoneStatus();

    if (classNames[1] === 'btn-success') {
      this.logger.pushLogs('Microphone is currently unmuted; muting the microphone');
      await this.clickMicrophoneButton();
    } else if (classNames[1] === 'btn-outline-secondary') {
      this.logger.pushLogs('Microphone button is already muted; no action taken');
    } else {
      this.logger.pushLogs('Unkown microphone button state encountered!!', LogLevel.ERROR);
    }
  }

  async unmuteMicrophone() {
    let classNames = await this.getMicrophoneStatus();

    if (classNames[1] === 'btn-success') {
      this.logger.pushLogs('Microphone is already unmuted; no action taken');
    } else if (classNames[1] === 'btn-outline-secondary') {
      this.logger.pushLogs('Microphone button is currently muted; unmuting the microphone');
      await this.clickMicrophoneButton();
    } else {
      this.logger.pushLogs('Unkown microphone button state encountered!!', LogLevel.ERROR);
    }
  }

  async getNumberOfParticipants() {
    const participantElements = await this.driver.findElements(elements.participants);
    this.logger.pushLogs(`Number of participants on roster: ${participantElements.length}`);
    return participantElements.length;
  }

  async rosterCheck(numberOfParticipant = 1) {
    await this.driver.wait(async () => {
      return (await this.getNumberOfParticipants()) == numberOfParticipant;
    }, 5000);
  }

  async clickOnMicrophoneDropdownButton() {
    let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
    await this.driver.wait(until.elementIsVisible(microphoneDropDownButton));
    await microphoneDropDownButton.click();
    await this.driver.wait(
      until.elementIsVisible(this.driver.findElement(elements.microphoneDropDown))
    );
  }

  async playRandomTone() {
    await this.unmuteMicrophone();
    await this.clickOnMicrophoneDropdownButton();
    let microphoneDropDown440HzButton = await this.driver.findElement(
      elements.microphoneDropDown440HzButton
    );
    await this.driver.wait(until.elementIsVisible(microphoneDropDown440HzButton));
    await microphoneDropDown440HzButton.click();
  }

  async stopPlayingRandomTone() {
    await this.muteMicrophone();
  }
}

module.exports = BaseAppPage;
