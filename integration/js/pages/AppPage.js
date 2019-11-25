const {By, promise} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');

const elements = {
  meetingIdInput: By.id('inputMeeting'),
  attendeeNameInput: By.id('inputName'),
  authenticateButton: By.id('authenticate'),
  localVideoBotton: By.id('button-camera'),
  joinButton: By.id('joinButton'),
  meetingEndButtom: By.id('button-meeting-end'),
  meetingLeaveButton: By.id('button-meeting-leave'),
  screenShareButton: By.id('button-screen-share'),
  screenViewButton: By.id('button-screen-view'),
  roster: By.id('roster'),
  participants: By.css('li'),

  authenticationFlow: By.id('flow-authenticate'),
  deviceFlow: By.id('flow-devices'),
  meetingFlow: By.id('flow-meeting'),

  failedMeetingFlow: By.id('flow-failed-meeting'),
  microphoneDropDown440HzButton: By.id('dropdown-menu-microphone-440-Hz'),
  microphoneDropDownButton: By.id('button-microphone-drop'),
  microphoneButton: By.id('button-microphone'),

  meetingAudio: By.id('meeting-audio'),
};

const SessionStatus = {
  STARTED: 'Started',
  FAILED: 'Failed',
  CONNECTING: 'Connecting',
};

class AppPage {
  constructor(driver) {
    this.driver = driver;
  }

  async open(stepInfo) {
    await TestUtils.open(stepInfo);
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
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await authenticateButton.click();
  }

  async joinMeeting() {
    let joinButton = await this.driver.findElement(elements.joinButton);
    await joinButton.click();
  }

  async endTheMeeting() {
    let meetingEndButtom = await this.driver.findElement(elements.meetingEndButtom);
    await meetingEndButtom.click();
  }

  async leaveTheMeeting() {
    let meetingEndButtom = await this.driver.findElement(elements.meetingEndButtom);
    await meetingEndButtom.click();
  }

  async clickScreenShareButton() {
    let screenShareButton = await this.driver.findElement(elements.screenShareButton);
    await screenShareButton.click();
  }

  async clickScreenViewButton() {
    let screenViewButton = await this.driver.findElement(elements.screenViewButton);
    await screenViewButton.click();
  }

  async clickCameraButton() {
    let localVideoButton = await this.driver.findElement(elements.localVideoBotton);
    await localVideoButton.click();
  }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await microphoneButton.click();
  }

  async playRandomTone() {
    let tone = await this.driver.findElement(elements.microphoneDropDown440HzButton);
    await tone.click();
  }

  async clickOnMicrophoneDropDownButton() {
    let microphoneDropDown = await this.driver.findElement(elements.microphoneDropDownButton);
    await microphoneDropDown.click();
  }

  async getNumberOfParticipantsOnRoster() {
    const roster = await this.driver.findElement(elements.roster);
    const participantElements = await this.driver.findElements(elements.participants);
    console.log(`Number of participants on roster: ${participantElements.length}`);
    return participantElements.length;
  }

  async getSessionStatus() {
    // TODO: find a way to check if the user was able to join the meeting or not
    await TestUtils.waitAround(5 * 1000); // wait for 5 secs
    return SessionStatus.STARTED;
  }

  async waitForAuthentication() {
    let timeout = 10;
    let i = 0;
    let authenticating = true;
    while (authenticating && i < timeout) {
      authenticating = await this.isAuthenticating();
      if (authenticating === false) {
        return 'done'
      }
      i++;
      await TestUtils.waitAround(1000);
    }
    return 'failed'
  }

  async waitToJoinTheMeeting() {
    let timeout = 20;
    let i = 0;
    let joining = true;
    while (joining && i < timeout) {
      joining = await this.isJoiningMeeting();
      if (joining === false) {
        return 'done'
      }
      i++;
      await TestUtils.waitAround(1000);
    }
    return 'failed'
  }

  async isJoiningMeeting() {
    return await this.driver.findElement(elements.deviceFlow).isDisplayed();
  }

  async isAuthenticating() {
    return await this.driver.findElement(elements.authenticationFlow).isDisplayed();
  }

  async checkIfMeetingAuthenticated() {
    return await this.driver.findElement(elements.deviceFlow).isDisplayed();
  }

  async checkIfUserJoinedTheMeeting() {
    return await this.driver.findElement(elements.meetingFlow).isDisplayed();
  }

  async checkIfFailedToJoinMeeting() {
    return await this.driver.findElement(elements.failedMeetingFlow).isDisplayed();
  }

  async rosterCheck(numberOfParticipants) {
    let i = 0;
    let timeout = 10;
    while (i < timeout) {
      try {
        const participantCountOnRoster = await this.getNumberOfParticipantsOnRoster();
        if (participantCountOnRoster.toString() === numberOfParticipants) {
          return true;
        }
      } catch (err) {
      }
      await TestUtils.waitAround(10);
      i++;
    }
    return false;
  }

  async videoCheck(stepInfo, index, expectedState = 'video') {
    let checked; // Result of the verification
    let i = 0; // iteration indicator
    let timeout = 10;
    checked = await TestUtils.verifyVideoDisplayByIndex(stepInfo.driver, index);
    while ((checked.result !== expectedState) && i < timeout) {
      checked = await TestUtils.verifyVideoDisplayByIndex(stepInfo.driver, index);
      i++;
      await TestUtils.waitAround(1000);
    }
    return checked.result;
  }

  async videoCheckLong(stepInfo, index, expectedState) {
    let checked; // Result of the verification
    let i = 0; // iteration indicator
    let timeout = 10;
    checked = await TestUtils.verifyVideoDisplayByIndex(stepInfo.driver, index);
    while ((checked.result !== expectedState) && i < timeout) {
      checked = await TestUtils.verifyVideoDisplayByIndex(stepInfo.driver, index);
      i++;
      await TestUtils.waitAround(1000);
    }
    // after the video is in desired state, monitor it for 30 secs to check if it stays in that state.
    i = 0;
    timeout = 60;
    let success = 0;
    let total = 0;
    while (i < timeout) {
      checked = await TestUtils.verifyVideoDisplayByIndex(stepInfo.driver, index);
      i++;
      if (checked.result === expectedState) {
        success++;
      }
      total++;
      await TestUtils.waitAround(1000);
    }
    if (success / total > 0.75) {
      return true
    }
    return false;
  }

  async audioCheck(stepInfo, expectedState) {
    const res = await this.driver.executeAsyncScript(async () => {
      var callback = arguments[arguments.length - 1];

      const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
      };

      var minToneError = Infinity;
      var maxToneError = -Infinity;
      var audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
      const stream = document.getElementById('meeting-audio').srcObject;
      const source = audioContext.createMediaStreamSource(stream);
      var analyser = audioContext.createAnalyser();
      var frequencyData = new Float32Array(analyser.frequencyBinCount);
      source.connect(analyser);
      await sleep(1000);
      var successfulToneChecks = 0;
      var totalToneChecks = 0;
      var errorData = [];
      var hotBinFrequencyData = [];

      const checkToneFor = async (runCount, freq) => {
        let i = 0;
        for (i = 0; i < runCount; i++) {
          checkTone(freq);
          i++;
          await sleep(100)
        }
      };

      const checkTone = (targetReceiveFrequency) => {
        analyser.getFloatFrequencyData(frequencyData);
        let maxBinDb = -Infinity;
        let hotBinFrequency = 0;
        const binSize = audioContext.sampleRate / analyser.fftSize; // default fftSize is 2048
        for (let i = 0; i < frequencyData.length; i++) {
          const v = frequencyData[i];
          if (v > maxBinDb) {
            maxBinDb = v;
            hotBinFrequency = i * binSize;
          }
        }
        const error = Math.abs(hotBinFrequency - targetReceiveFrequency);
        errorData.push(error);
        hotBinFrequencyData.push(hotBinFrequency);
        if (maxBinDb > -Infinity) {
          if (error < minToneError) {
            minToneError = error;
          }
          if (error > maxToneError) {
            maxToneError = error;
          }
        }
        if (error <= 2 * binSize) {
          successfulToneChecks++;
        }
        totalToneChecks++;
        return hotBinFrequency
      };

      await checkToneFor(50, 440);
      callback(successfulToneChecks / totalToneChecks);
    });
    console.log(`Audio check success rate: ${res * 100}% expected: ${expectedState === "AUDIO_ON" ? 100 : 0}%`);
    if (expectedState === "AUDIO_ON") {
      if (res >= 0.75) {
        return true
      }
      return false
    } else {
      if (res === 0) {
        return true
      }
      return false
    }
  }


  async getScreenSharePixelSum() {
    return await this.driver.executeAsyncScript(async () => {
      var callback = arguments[arguments.length - 1];
      const getSum = (total, num) => {
        return total + num;
      };
      var canvas = document.querySelector('canvas');
      var sum = 0;
      if (canvas !== null && canvas !== undefined) {
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, 1000, 600).data;
        var sum = imageData.reduce(getSum);
      }
      callback(sum);
    });
  }

  async checkScreenShare(expectedState) {
    let pixelData = [];
    let i = 0;
    let timeout = 10;
    let pixelSum = await this.getScreenSharePixelSum();
    pixelData.push(pixelSum);
    while (i < timeout) {
      let pixelDataLen = pixelData.length;
      if (expectedState === "video" && pixelData[pixelDataLen - 1] - pixelData[pixelDataLen - 2] === 0) {
        return pixelData[pixelDataLen - 2] == 0 ? 'blank' : 'still';
      }
      if (expectedState === "blank" && pixelSum !== 0) {
        return 'video';
      }
      await TestUtils.waitAround(1000);
      pixelSum = await this.getScreenSharePixelSum();
      pixelData.push(pixelSum);
      i++;
    }
    return expectedState
  }

}

module.exports.AppPage = AppPage;
module.exports.SessionStatus = SessionStatus;
