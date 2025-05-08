const { By, until } = require('selenium-webdriver');
const { LogLevel, Log } = require('../utils/Logger');
const { sleep } = require('../utils/HelperFunctions');

const DEFAULT_TIMEOUT_MS = 5000;

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
    
    videoButton: By.id('button-camera'),
    videoTile: By.tagName('video-tile'),
    videoTileNameplate: By.className('video-tile-nameplate'),
  };
}

const VideoState = Object.freeze({
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  BLANK: 'BLANK',
  OFF: 'OFF'
});

class MeetingPage {
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
      until.elementIsVisible(this.driver.findElement(elements.authenticationFlow), DEFAULT_TIMEOUT_MS)
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
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.joinButton)), DEFAULT_TIMEOUT_MS);
  }

  async joinMeeting() {
    let joinButton = await this.driver.findElement(elements.joinButton);
    await joinButton.click();
    await this.waitForUserJoin();
  }

  async waitForUserJoin() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.meetingFlow)), DEFAULT_TIMEOUT_MS);
  }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await this.driver.wait(until.elementIsVisible(microphoneButton), DEFAULT_TIMEOUT_MS);
    await microphoneButton.click();
  }

  async getMicrophoneStatus() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await this.driver.wait(until.elementIsVisible(microphoneButton), DEFAULT_TIMEOUT_MS);
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
    const roster = await this.driver.findElement(elements.roster);
    const participantElements = await roster.findElements(elements.participants);
    this.logger.pushLogs(`Number of participants on roster: ${participantElements.length}`);
    return participantElements.length;
  }

  async rosterCheck(numberOfParticipant = 1) {
    await this.driver.wait(async () => {
      return (await this.getNumberOfParticipants()) === numberOfParticipant;
    }, DEFAULT_TIMEOUT_MS);
  }

  async clickOnMicrophoneDropdownButton() {
    let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
    await this.driver.wait(until.elementIsVisible(microphoneDropDownButton), DEFAULT_TIMEOUT_MS);
    await microphoneDropDownButton.click();
    await this.driver.wait(
      until.elementIsVisible(this.driver.findElement(elements.microphoneDropDown)),
      DEFAULT_TIMEOUT_MS
    );
  }

  async playRandomTone() {
    await this.unmuteMicrophone();
    await this.clickOnMicrophoneDropdownButton();
    let microphoneDropDown440HzButton = await this.driver.findElement(
      elements.microphoneDropDown440HzButton
    );
    await this.driver.wait(until.elementIsVisible(microphoneDropDown440HzButton), DEFAULT_TIMEOUT_MS);
    await microphoneDropDown440HzButton.click();
  }

  async stopPlayingRandomTone() {
    await this.muteMicrophone();
  }

  async clickVideoButton() {
    let videoButton = await this.driver.findElement(elements.videoButton);
    await this.driver.wait(until.elementIsVisible(videoButton), DEFAULT_TIMEOUT_MS);
    await videoButton.click();
  }

  async getVideoStatus() {
    let videoButton = await this.driver.findElement(elements.videoButton);
    await this.driver.wait(until.elementIsVisible(videoButton), DEFAULT_TIMEOUT_MS);
    let classNamesString = await videoButton.getAttribute('class');
    let classNames = classNamesString.split(' ');
    return classNames;
  }

  async turnVideoOn() {
    let classNames = await this.getVideoStatus();

    if (classNames[1] === 'btn-success') {
      this.logger.pushLogs('Video is already turned on; no action taken');
    } else if (classNames[1] === 'btn-outline-secondary') {
      this.logger.pushLogs('Video is currently off; turning video on');
      await this.clickVideoButton();
    } else {
      this.logger.pushLogs('Unknown video button state encountered!!', LogLevel.ERROR);
    }
  }

  async turnVideoOff() {
    let classNames = await this.getVideoStatus();

    if (classNames[1] === 'btn-success') {
      this.logger.pushLogs('Video is currently on; turning video off');
      await this.clickVideoButton();
    } else if (classNames[1] === 'btn-outline-secondary') {
      this.logger.pushLogs('Video is already turned off; no action taken');
    } else {
      this.logger.pushLogs('Unknown video button state encountered!!', LogLevel.ERROR);
    }
  }

  getPixelSum(videoId) {
    function getSum(total, num) { return total + num; }

    let video = document.getElementById(videoId);
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    ctx.drawImage(video,0,0,video.videoHeight-1,video.videoWidth-1);

    let imageData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
    let sum = imageData.reduce(getSum);
    if (sum===255*(Math.pow(video.videoHeight-1,(video.videoWidth-1)*(video.videoWidth-1)))) {
      return 0;
    }
    return sum;
  }

  async checkVideoContent(videoTile) {
    if (!videoTile) {
      return VideoState.OFF
    }
    const videoElement = await videoTile.findElement(By.tagName('video'));
    const videoId = await videoElement.getAttribute('id');
    const getPixelSumScript = `
      function getSum(total, num) { return total + num; }
      
      let video = document.getElementById("${videoId}");
      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return 0;
      }
      
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      let imageData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight).data;
      let sum = imageData.reduce(getSum);
      if (sum === 255 * (video.videoWidth * video.videoHeight * 4)) {
        return 0;
      }
      return sum;
  `;
    // Take two snapshots of the video content with a 1-second interval
    const sumArray = [];

    const sum1 = await this.driver.executeScript(getPixelSumScript);
    sumArray.push(sum1);
    await sleep(1000);
    const sum2 = await this.driver.executeScript(getPixelSumScript);
    sumArray.push(sum2);

    if (sumArray.length === 0 || sumArray.includes(0)) {
      this.logger.pushLogs(`The video (id: ${videoId}) was blank at the moment of checking`, LogLevel.WARN);
      return VideoState.BLANK
    } else if (Math.abs(sumArray[0] - sumArray[1]) === 0) {
      this.logger.pushLogs(`The video (id: ${videoId}) was still at the moment of checking`, LogLevel.WARN);
      return VideoState.PAUSE;
    } else {
      this.logger.pushLogs(`Verified video content successfully for video (id: ${videoId}) with pixel sums ${sumArray[0]} and ${sumArray[1]}`, LogLevel.SUCCESS);
      return VideoState.PLAY;
    }
  }

  async checkVideoState(expectedState, attendeeId) {
    this.logger.pushLogs(`Checking if video is ${expectedState} for attendee: ${attendeeId}`);

    const retry = 5;
    let i = 0;
    let result = undefined;

    while (result !== expectedState && i < retry) {
      const videoTiles = await this.driver.findElements(elements.videoTile);
      let videoTile ;

      for (const tile of videoTiles) {
        const nameplate = await tile.findElement(elements.videoTileNameplate);
        const nameplateText = await nameplate.getText();

        if (nameplateText === attendeeId) {
          videoTile = tile;
          break;
        }
      }
      result = await this.checkVideoContent(videoTile);

      if (result !== expectedState) {
        this.logger.pushLogs(`Current video state: ${result}, expected: ${expectedState}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      } else {
        break;
      }
    }

    if (result === expectedState) {
      this.logger.pushLogs(`Video check passed: ${expectedState} for attendee ${attendeeId}`, LogLevel.SUCCESS);
    } else {
      const error = `Video check failed: expected ${expectedState} but got ${result} for attendee ${attendeeId}`;
      this.logger.pushLogs(error, LogLevel.ERROR);
      throw new Error(error);
    }
  }


  async runAudioCheck(expectedState, checkStereoTones = false) {
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(
        async (expectedState, checkStereoTones) => {
          let logs = [];
          let callback = arguments[arguments.length - 1];

          const channelCount = checkStereoTones ? 2 : 1;
          const successfulToneChecks = Array(channelCount).fill(0);
          const totalToneChecks = Array(channelCount).fill(0);
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const minToneError = Array(channelCount).fill(Infinity);
          const maxToneError = Array(channelCount).fill(-Infinity);
          const percentages = Array(channelCount).fill(0);
          const volumeTryCount = 5;
          const frequencyTryCount = 5;

          const sleep = milliseconds => {
            return new Promise(resolve => setTimeout(resolve, milliseconds));
          };

          try {
            const stream = document.getElementById('meeting-audio').srcObject;
            const source = audioContext.createMediaStreamSource(stream);
            let analyser = [];
            for (let i = 0; i < channelCount; i++) {
              analyser.push(audioContext.createAnalyser());
            }
            // Byte frequency data is used to calculate the volume
            let byteFrequencyData = [];
            for (let i = 0; i < channelCount; i++) {
              byteFrequencyData.push(new Uint8Array(analyser[i].frequencyBinCount));
            }
            // Float frequency data is used to calculate the frequency of the audio stream
            let floatFrequencyData = [];
            for (let i = 0; i < channelCount; i++) {
              floatFrequencyData.push(new Float32Array(analyser[i].frequencyBinCount));
            }

            if (checkStereoTones) {
              const splitterNode = audioContext.createChannelSplitter(2);
              source.connect(splitterNode);
              splitterNode.connect(analyser[0], 0);
              splitterNode.connect(analyser[1], 1);
            } else {
              source.connect(analyser[0]);
            }

            await sleep(5000);

            const getAverageVolume = channelIndex => {
              analyser[channelIndex].getByteFrequencyData(byteFrequencyData[channelIndex]);
              let values = 0;
              let average;
              const length = byteFrequencyData[channelIndex].length;
              // Get all the frequency amplitudes
              for (let i = 0; i < length; i++) {
                values += byteFrequencyData[channelIndex][i];
              }
              average = values / length;
              return average;
            };

            const checkVolumeFor = async (runCount, channelIndex) => {
              for (let i = 0; i < runCount; i++) {
                totalToneChecks[channelIndex]++;
                const avgTestVolume = getAverageVolume(channelIndex);
                logs.push(`[${i + 1}] Resulting volume of ${avgTestVolume}`);
                if (
                  (expectedState === 'AUDIO_ON' && avgTestVolume > 0) ||
                  (expectedState === 'AUDIO_OFF' && avgTestVolume === 0)
                ) {
                  successfulToneChecks[channelIndex]++;
                }
                await sleep(100);
              }
            };

            const checkFrequency = (targetReceiveFrequency, channelIndex) => {
              analyser[channelIndex].getFloatFrequencyData(floatFrequencyData[channelIndex]);
              let maxBinDb = -Infinity;
              let hotBinFrequency = 0;
              const binSize = audioContext.sampleRate / analyser[channelIndex].fftSize; // default fftSize is 2048
              for (let i = 0; i < floatFrequencyData[channelIndex].length; i++) {
                const v = floatFrequencyData[channelIndex][i];
                if (v > maxBinDb) {
                  maxBinDb = v;
                  hotBinFrequency = i * binSize;
                }
              }
              const error = Math.abs(hotBinFrequency - targetReceiveFrequency);
              if (maxBinDb > -Infinity) {
                if (error < minToneError[channelIndex]) {
                  minToneError[channelIndex] = error;
                }
                if (error > maxToneError[channelIndex]) {
                  maxToneError[channelIndex] = error;
                }
              }
              if (error <= 2 * binSize) {
                successfulToneChecks[channelIndex]++;
              }
              totalToneChecks[channelIndex]++;
              return hotBinFrequency;
            };

            const checkFrequencyFor = async (runCount, freq, channelIndex) => {
              for (let i = 0; i < runCount; i++) {
                const testFrequency = checkFrequency(freq, channelIndex);
                logs.push(
                  `[${i + 1}] Resulting Frequency of ${testFrequency} for channel ${channelIndex}`
                );
                await sleep(100);
              }
            };

            if (expectedState === 'AUDIO_OFF') {
              logs.push("Expected state is 'AUDIO_OFF'");
              logs.push('Checking whether the audio is off');
              logs.push('AUDIO_OFF checks are done by checking for volume');
              logs.push(
                `------------------Checking volume ${volumeTryCount} times on channel index 0------------------`
              );
              await checkVolumeFor(volumeTryCount, 0);
              if (checkStereoTones) {
                logs.push('Checking volume for stereo tones');
                logs.push(
                  `------------------Checking volume ${volumeTryCount} times on channel index 1------------------`
                );
                await checkVolumeFor(volumeTryCount, 1);
              }
            }

            if (expectedState === 'AUDIO_ON') {
              logs.push("Expected state is 'AUDIO_ON'");
              logs.push('Checking whether the audio is on');
              logs.push(
                'AUDIO_ON checks are done by checking the frequency of the output audio stream'
              );
              if (checkStereoTones) {
                // The test demo uses 500Hz on left stream and 1000Hz on right stream
                logs.push(
                  `------------------Checking frequency ${frequencyTryCount} times of 500Hz on 0 channel index-----------------------`
                );
                await checkFrequencyFor(frequencyTryCount, 500, 0);
                logs.push(
                  `------------------Checking frequency ${frequencyTryCount} times of 1000Hz on 1 channel index------------------`
                );
                await checkFrequencyFor(frequencyTryCount, 1000, 1);
              } else {
                // The test demo uses 440Hz frequency
                logs.push(
                  `------------------Checking frequency ${frequencyTryCount} times of 440Hz------------------`
                );
                await checkFrequencyFor(frequencyTryCount, 440, 0);
              }
              logs.push('Audio frequency check completed');
            }

            logs.push('Calculating success percentages');
            for (let i = 0; i < channelCount; i++) {
              percentages[i] = successfulToneChecks[i] / totalToneChecks[i];
            }
          } catch (error) {
            logs.push(`Audio check failed with the following error: \n ${error}`);
          } finally {
            logs.push(`Audio check completed`);
            await audioContext.close();
            callback({
              percentages,
              logs,
            });
          }
        },
        expectedState,
        checkStereoTones,
        this.logger,
        Log,
        LogLevel
      );
    } catch (e) {
      this.logger.pushLogs(`Audio Check failed!! Error: \n ${e}`, LogLevel.ERROR);
    } finally {
      if (res) {
        res.logs.forEach(l => {
          this.logger.pushLogs(l);
        });
      }
    }
    if (!res) {
      throw new Error(`Audio check failed!!`);
    }

    for (let i = 0; i < res.percentages.length; i++) {
      this.logger.pushLogs(
        `Audio check success rate for channel ${i}: ${res.percentages[i] * 100}%`
      );
      if (res.percentages[i] < 0.75) {
        throw new Error(
          `Audio Check failed!! Success rate for channel ${i} is ${res.percentages[i] * 100}%`
        );
      }
    }
    this.logger.pushLogs('Audio check passed!!', LogLevel.SUCCESS);
  }
}

module.exports = {
  MeetingPage,
  VideoState
};
