const {By, Key, until} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');
const {performance} = require('perf_hooks');

let elements;

function findAllElements() {
  // These will be stale after a reload.
  elements = {
    meetingIdInput: By.id('inputMeeting'),
    sipMeetingIdInput: By.id('sip-inputMeeting'),
    voiceConnectorIdInput: By.id('voiceConnectorId'),
    attendeeNameInput: By.id('inputName'),
    authenticateButton: By.id('authenticate'),
    localVideoButton: By.id('button-camera'),
    addVoiceFocusInput: By.id('add-voice-focus'),        // Checkbox.
    joinButton: By.id('joinButton'),
    meetingEndButtom: By.id('button-meeting-end'),
    meetingLeaveButton: By.id('button-meeting-leave'),
    contentShareButton: By.id('button-content-share'),
    contentShareDropButton: By.id('button-content-share-drop'),
    contentShareVideoTestButton: By.id('dropdown-item-content-share-screen-test-video'),
    contentSharePauseButton: By.id('button-pause-content-share'),

    videoFilterDropButton: By.id('button-video-filter-drop'),
  
    dataMessageSendInput: By.id('send-message'),
    sipAuthenticateButton: By.id('button-sip-authenticate'),
    roster: By.id('roster'),
    participants: By.css('li'),
    switchToSipFlow: By.id('to-sip-flow'),

    authenticationFlow: By.id('flow-authenticate'),
    deviceFlow: By.id('flow-devices'),
    meetingFlow: By.id('flow-meeting'),
    sipAuthenticateFlow: By.id('flow-sip-authenticate'),
    sipUriFlow: By.id('flow-sip-uri'),

    failedMeetingFlow: By.id('flow-failed-meeting'),
    microphoneDropDownVoiceFocusButton: By.id('toggle-dropdown-menu-microphone-Amazon-Voice-Focus'),
    microphoneDropDown440HzButton: By.id('dropdown-menu-microphone-440-Hz'),
    microphoneDropDownButton: By.id('button-microphone-drop'),
    microphoneButton: By.id('button-microphone'),

    emojiFilterButton: By.id('dropdown-menu-filter-Emojify'),

    meetingAudio: By.id('meeting-audio'),
    sipUri: By.id('sip-uri'),
    simulcastFeature: By.id('simulcast'),
    webAudioFeature: By.id('webaudio'),
    simulcastFeatureLabel: By.css('label[for="simulcast"]'),
    webAudioFeatureLabel: By.css('label[for="webaudio"]'),
  };
}

findAllElements();

const SessionStatus = {
  STARTED: 'Started',
  FAILED: 'Failed',
  CONNECTING: 'Connecting',
};

class AppPage {
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
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await authenticateButton.click();
  }

  async chooseUseWebAudio() {
    let webAudioFeature = await this.driver.findElement(elements.webAudioFeature);
    let webAudioFeatureLabel = await this.driver.findElement(elements.webAudioFeatureLabel);

    // Click the label because it's on top.
    if (await webAudioFeature.isSelected()) {
      console.log('Web Audio is selected');
    } else {
      await webAudioFeatureLabel.click();
    }
  }

  async chooseUseSimulcast() {
    let simulcastFeature = await this.driver.findElement(elements.simulcastFeature);
    let simulcastFeatureLabel = await this.driver.findElement(elements.simulcastFeatureLabel);

    // Click the label because it's on top.
    if (await simulcastFeature.isSelected()) {
      this.logger('simulcast is selected');
    } else {
      await simulcastFeatureLabel.click();
    }
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
    let meetingLeaveButton = await this.driver.findElement(elements.meetingLeaveButton);
    await meetingLeaveButton.click();
  }

  async clickContentShareButton() {
    const contentShareButton = await this.driver.findElement(elements.contentShareButton);
    await contentShareButton.click();
  }

  async clickContentShareDropButton() {
    const contentShareDropButton = await this.driver.findElement(elements.contentShareDropButton);
    await contentShareDropButton.click();
  }

  async clickContentShareVideoTestButton() {
    const contentShareVideoTestButton = await this.driver.findElement(elements.contentShareVideoTestButton);
    await contentShareVideoTestButton.click();
  }

  async clickContentSharePauseButton() {
    const contentSharePauseButton = await this.driver.findElement(elements.contentSharePauseButton);
    await contentSharePauseButton.click();
  }

  async clickCameraButton() {
    let localVideoButton = await this.driver.findElement(elements.localVideoButton);
    await localVideoButton.click();
  }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await microphoneButton.click();
  }

  async clickVideoFilterDropButton() {
    const videoFilterDropButton = await this.driver.findElement(elements.videoFilterDropButton);
    this.logger(`video filter button is ${videoFilterDropButton}`);
    await videoFilterDropButton.click();
  }

  async clickVideoFilterFromDropDownMenu() {
    const emojiFilter = await this.driver.findElement(elements.emojiFilterButton);
    await emojiFilter.click();
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
    this.logger(`Number of participants on roster: ${participantElements.length}`);
    return participantElements.length;
  }

  async getSessionStatus() {
    // TODO: find a way to check if the user was able to join the meeting or not
    await TestUtils.waitAround(5 * 1000); // wait for 5 secs
    return SessionStatus.STARTED;
  }

  async getSipUri() {
    return await this.driver.findElement(elements.sipUri).getAttribute("value");
  }

  async authenticateSipCall(meetingId, voiceConnectorId) {
    let sipMeetingIdInput = await this.driver.findElement(elements.sipMeetingIdInput);
    await sipMeetingIdInput.clear();
    await sipMeetingIdInput.sendKeys(meetingId);

    let voiceConnectorIdInput = await this.driver.findElement(elements.voiceConnectorIdInput);
    await voiceConnectorIdInput.clear();
    await voiceConnectorIdInput.sendKeys(voiceConnectorId);

    let sipAuthenticateButton = await this.driver.findElement(elements.sipAuthenticateButton);
    await sipAuthenticateButton.click();
  }

  async switchToSipCallFlow() {
    let switchToSipFlow = await this.driver.findElement(elements.switchToSipFlow);
    await switchToSipFlow.click();
  }

  async waitingToEndMeeting() {
    let timeout = 10;
    let i = 0;
    var meetingEnding = true;
    while (meetingEnding && i < timeout) {
      try {
        meetingEnding = await this.isMeetingEnding();
      } catch (e) {
        meetingEnding = true;
      }
      if (meetingEnding === false) {
        console.log("meeting ended");
        return 'done'
      }
      i++;
      await TestUtils.waitAround(1000);
    }
    return 'failed'
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

  async waitForSipAuthentication() {
    let timeout = 10;
    let i = 0;
    let authenticated = false;
    while (!authenticated && i < timeout) {
      authenticated = await this.isSipAuthenticated();
      if (authenticated === true) {
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

  async isVoiceFocusCheckboxVisible(visible) {
    const element = await this.driver.findElement(elements.addVoiceFocusInput);
    console.info(`Expecting element to be visible`, visible, element);
    if (visible) {
      await this.driver.wait(until.elementIsVisible(element), 30000);
      return true;
    }

    // Not using `elementIsNotVisible`, because we want to make sure it does
    // not *become* visible.
    try {
      await this.driver.wait(until.elementIsVisible(element), 5000);
    } catch (e) {
      return true;
    }
    throw new Error('Element should not have been visible.')
  }

  async isVoiceFocusPresentInDeviceMenu() {
    return await this.driver.findElement(elements.microphoneDropDownVoiceFocusButton).isDisplayed();
  }

  async isVoiceFocusEnabled() {
    const elem = await this.driver.findElement(elements.microphoneDropDownVoiceFocusButton);
    const classes = await elem.getAttribute('class');
    return classes.includes('vf-active');
  }

  async enableVoiceFocusInLobby() {
    const elem = await this.driver.findElement(elements.addVoiceFocusInput);
    return elem.click();
  }

  async isJoiningMeeting() {
    return await this.driver.findElement(elements.deviceFlow).isDisplayed();
  }

  async isAuthenticating() {
    return await this.driver.findElement(elements.authenticationFlow).isDisplayed();
  }

  async isMeetingEnding() {
    return await this.driver.findElement(elements.meetingFlow).isDisplayed();
  }

  async isSipAuthenticated() {
    return await this.driver.findElement(elements.sipUriFlow).isDisplayed();
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

  async rosterCheck(numberOfParticipants, checkCount = 10, waitTimeMs = 100) {
    let i = 0;
    let start = performance.now();
    while (i < checkCount) {
      try {
        const participantCountOnRoster = await this.getNumberOfParticipantsOnRoster();
        if (participantCountOnRoster === numberOfParticipants) {
          let end = performance.now();
          console.log("Roster check completed successfully in : %i secs", (end - start)/1000);
          return true;
        }
      } catch (err) {
      }
      await TestUtils.waitAround(waitTimeMs);
      i++;
    }
    let end = performance.now();
    console.log("Roster check failed in : %i secs", (end - start)/1000);
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

  async videoCheckByAttendeeName(stepInfo, attendeeName, expectedState = 'video') {
    let checked;
    let videos = await this.driver.findElements(By.css('video[id^="video-"]'));
    for (let i = 0; i < videos.length; i++) {
      const videoElementId = await videos[i].getAttribute('id');
      const seperatorIndex = videoElementId.lastIndexOf("-");
      if (seperatorIndex >= -1) {
        const tileIndex = parseInt(videoElementId.slice(seperatorIndex+1))
        if (tileIndex != NaN && tileIndex >= 0) {
          const nameplate = await this.driver.findElement(By.id(`nameplate-${tileIndex}`));
          const nameplateText = await nameplate.getText();
          if (nameplate && nameplateText === attendeeName) {
            let numRetries = 10;
            let retry = 0;
            let checked = await TestUtils.verifyVideoDisplayById(stepInfo.driver, `video-${tileIndex}`);
            while ((checked.result !== expectedState) && retry < numRetries) {
              checked = await TestUtils.verifyVideoDisplayById(stepInfo.driver, `video-${tileIndex}`);
              retry++;
              await TestUtils.waitAround(1000);
            }
            return checked.result;
          }
        }
      }
    }
    return 'blank';
  }

  async audioCheck(stepInfo, expectedState) {
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(async (expectedState) => {
        let logs = [];
        let callback = arguments[arguments.length - 1];

        const sleep = (milliseconds) => {
          return new Promise(resolve => setTimeout(resolve, milliseconds))
        };

        let successfulToneChecks = 0;
        let totalToneChecks = 0;
        let audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let minToneError = Infinity;
        let maxToneError = -Infinity;
        try {
          let stream = document.getElementById('meeting-audio').srcObject;
          let source = audioContext.createMediaStreamSource(stream);
          let analyser = audioContext.createAnalyser();
          source.connect(analyser);
          let byteFrequencyData = new Uint8Array(analyser.frequencyBinCount);
          let floatFrequencyData = new Float32Array(analyser.frequencyBinCount);

          await sleep(5000);

          const getAverageVolume = () => {
            analyser.getByteFrequencyData(byteFrequencyData);

            let values = 0;
            let average;
            let length = byteFrequencyData.length;
            // get all the frequency amplitudes
            for (let i = 0; i < length; i++) {
              values += byteFrequencyData[i];
            }
            average = values / length;
            return average;
          };

          const checkVolumeFor = async (runCount) => {
            let i = 0;
            for (i = 0; i < runCount; i++) {
              totalToneChecks++;
              const avgTestVolume = getAverageVolume();
              logs.push(`Resulting volume ${avgTestVolume}`);
              if (
                (expectedState === "AUDIO_ON" && avgTestVolume > 0) ||
                (expectedState === "AUDIO_OFF" && avgTestVolume === 0)
              ) {
                successfulToneChecks++;
              }
              i++;
              await sleep(100)
            }
          };

          const checkFrequency = (targetReceiveFrequency) => {
            analyser.getFloatFrequencyData(floatFrequencyData);
            // logs.push(`frequency data : ${floatFrequencyData}`);
            let maxBinDb = -Infinity;
            let hotBinFrequency = 0;
            const binSize = audioContext.sampleRate / analyser.fftSize; // default fftSize is 2048
            for (let i = 0; i < floatFrequencyData.length; i++) {
              const v = floatFrequencyData[i];
              if (v > maxBinDb) {
                maxBinDb = v;
                hotBinFrequency = i * binSize;
              }
            }
            const error = Math.abs(hotBinFrequency - targetReceiveFrequency);
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

          const checkFrequencyFor = async (runCount, freq) => {
            let i = 0;
            for (i = 0; i < runCount; i++) {
              const testFrequency = checkFrequency(freq);
              logs.push(`Resulting Frequency ${testFrequency}`);
              i++;
              await sleep(100)
            }
          };

          if (expectedState === "AUDIO_OFF") {
            await checkVolumeFor(50);
          }

          if (expectedState === "AUDIO_ON") {
            await checkFrequencyFor(50, 440);
          }
        } catch (e) {
          logs.push(`${e}`)
        } finally {
          logs.push(`test completed`);
          await audioContext.close();
          callback({
            percentage: successfulToneChecks / totalToneChecks,
            logs
          });
        }
      }, expectedState);
    } catch (e) {
      this.logger(`Audio Check Failed ${e}`)
    } finally {
      if (res) {
        res.logs.forEach(l => {
          this.logger(l)
        })
      }
    }
    this.logger(`Audio check success rate: ${res.percentage * 100}%`);
    if (res.percentage >= 0.75) {
      return true
    }
    return false
  }

  async triggerReconnection() {
    this.driver.executeAsyncScript(
      '(async () => { await app.audioVideo.audioVideoController.actionReconnect(); })().then(arguments[0]);'
    );
  }

  async sendDataMessage(message) {
    const dataMessageSendInput = await this.driver.findElement(elements.dataMessageSendInput);
    await dataMessageSendInput.clear();
    await dataMessageSendInput.sendKeys(message);
    await dataMessageSendInput.sendKeys(Key.ENTER);
  }

  async checkDataMessageExist(message) {
    const dataMessageSpan = await this.driver.findElement(By.xpath(`//div[@id='receive-message']//*[text() = '${message}']`));
    return dataMessageSpan? true: false;
  }
}

module.exports = AppPage;
