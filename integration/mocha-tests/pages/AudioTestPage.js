const BaseAppPage = require('./BaseAppPage');
const { LogLevel, Log } = require('../utils/Logger');

class AudioTestPage extends BaseAppPage {
  constructor(webdriver, logger) {
    super(webdriver, logger);
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

module.exports = AudioTestPage;
