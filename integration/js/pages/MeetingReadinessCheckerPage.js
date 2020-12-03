const {By} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');

const elements = {
  authenticateButton: By.id('authenticate'),
  speakerTestButton: By.id('speakertest-button'),
  speakerTest: By.id('speaker-test'),
  speakerFeedbackYes: By.id('speaker-yes'),
  speakerFeedbackNo: By.id('speaker-no'),
  speakerAudioElement: By.id('speaker-test-audio-element'),
  micTest: By.id('mic-test'),
  videoTest: By.id('video-test'),
  cameraResolutionTest1: By.id('camera-test1'),
  cameraResolutionTest2: By.id('camera-test2'),
  cameraResolutionTest3: By.id('camera-test3'),
  networkTCPTest: By.id('networktcp-test'),
  networkUDPTest: By.id('networkudp-test'),
  audioConnectivityTest: By.id('audioconnectivity-test'),
  videoConnectivityTest: By.id('videoconnectivity-test'),
  contentShareConnectivityTest: By.id('contentshare-test'),
  contentShareConnectivityTestButton: By.id('contentshare-button'),
  readinessCheckerFlow: By.id('flow-readinesstest'),
};

const badgeSuccessLabel = 'badge-success';

class MeetingReadinessCheckerPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
  }

  async open(stepInfo) {
    await TestUtils.open(stepInfo);
  }

  async close(stepInfo) {
    await stepInfo.driver.close();
  }

  async startCheck() {
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    await authenticateButton.click();
  }

  async startContentShareConnectivityCheck() {
    let contentShareConnectivityCheckButton = await this.driver.findElement(elements.contentShareConnectivityTestButton);
    await contentShareConnectivityCheckButton.click();
  }

  async startSpeakerTest() {
    let spekerTestButtonExists = await this.driver.findElements(elements.speakerTestButton);
    if (spekerTestButtonExists.length > 0) {
      let speakerTestButton = await this.driver.findElement(elements.speakerTestButton);
      await speakerTestButton.click();
    }
  }

  async speakerCheckFeedbackYes() {
    let speakerCheckFeedbackYesButton = await this.driver.findElement(elements.speakerFeedbackYes);
    await speakerCheckFeedbackYesButton.click();
  }

  async speakerCheckFeedbackNo() {
    let speakerCheckFeedbackNoButton = await this.driver.findElement(elements.speakerFeedbackNo);
    await speakerCheckFeedbackNoButton.click();
  }

  async checkSpeakerTestSucceed() {
    let audioFrequencyCheckResult = await this.audioFrequencyCheck();
    if(audioFrequencyCheckResult) {
      await this.speakerCheckFeedbackYes();
    } else {
      await this.speakerCheckFeedbackNo();
    }
    await TestUtils.waitAround(3000);
    let checkSpeakerFeedback = await this.driver.findElement(elements.speakerTest).getAttribute('class');
    return checkSpeakerFeedback.includes(badgeSuccessLabel);
  }

  async checkAudioConnectivitySucceed() {
    let checkAudioConnectivityFeedback = await this.driver.findElement(elements.audioConnectivityTest).getAttribute('class');
    return checkAudioConnectivityFeedback.includes(badgeSuccessLabel);
  }

  async checkVideoConnectivitySucceed() {
    let checkVideoConnectivityFeedback = await this.driver.findElement(elements.videoConnectivityTest).getAttribute('class');
    return checkVideoConnectivityFeedback.includes(badgeSuccessLabel);
  }

  async checkContentShareConnectivitySucceed() {
    let checkContentShareConnectivityFeedback = await this.driver.findElement(elements.contentShareConnectivityTest).getAttribute('class');
    return checkContentShareConnectivityFeedback.includes(badgeSuccessLabel);
  }

  async checkNetworkUDPConnectivitySucceed() {
    let checkNetworkUDPConnectivityFeedback = await this.driver.findElement(elements.networkUDPTest).getAttribute('class');
    return checkNetworkUDPConnectivityFeedback.includes(badgeSuccessLabel);
  }

  async checkNetworkTCPConnectivitySucceed() {
    let checkNetworkTCPConnectivityFeedback = await this.driver.findElement(elements.networkTCPTest).getAttribute('class');
    return checkNetworkTCPConnectivityFeedback.includes(badgeSuccessLabel);
  }

  async audioFrequencyCheck() {
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(async () => {
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
          let stream = document.getElementById("speaker-test-audio-element").srcObject;
          let source = audioContext.createMediaStreamSource(stream);
          let analyser = audioContext.createAnalyser();
          source.connect(analyser);
          let byteFrequencyData = new Uint8Array(analyser.frequencyBinCount);
          let floatFrequencyData = new Float32Array(analyser.frequencyBinCount);

          await sleep(5000);

          const checkFrequency = (targetReceiveFrequency) => {
            analyser.getFloatFrequencyData(floatFrequencyData);
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

          await checkFrequencyFor(50, 440);
        } catch (e) {
          logs.push(`${e}`)
        } finally {
          logs.push(`Frequency check completed`);
          await audioContext.close();
          callback({
            percentage: successfulToneChecks / totalToneChecks,
            logs
          });
        }
      });
    } catch (e) {
      this.logger(`Audio output check failed ${e}`)
    } finally {
      if (res) {
        res.logs.forEach(l => {
          this.logger(l)
        })
      }
    }
    this.logger(`Audio output check success rate: ${res.percentage * 100}%`);
    if (res.percentage >= 0.75) {
      return true
    }
    return false
  }

  async isTestContentShareConnectivityButtonEnabled() {
    let button = await this.driver.findElement(elements.contentShareConnectivityTestButton);
    return await button.isEnabled();
  }

  async isStartMeetingReadinessCheckerButtonEnabled() {
    let authenticateButton = await this.driver.findElement(elements.authenticateButton);
    return await authenticateButton.isEnabled();
  }

  async checkIfMeetingAuthenticatedAndMeetingReadinessCheckerInitialized() {
    return await this.driver.findElement(elements.readinessCheckerFlow).isDisplayed();
  }
}

module.exports = MeetingReadinessCheckerPage;
