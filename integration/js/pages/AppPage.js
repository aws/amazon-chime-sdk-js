const {By, Key, until, logging} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');
const {performance} = require('perf_hooks');
const {clickElement} = require('../utils/PageUtil');

let elements;

function findAllElements() {
  // These will be stale after a reload.
  elements = {
    meetingIdInput: By.id('inputMeeting'),
    sipMeetingIdInput: By.id('sip-inputMeeting'),
    voiceConnectorIdInput: By.id('voiceConnectorId'),
    attendeeNameInput: By.id('inputName'),
    authenticateButton: By.id('authenticate'),
    additionalOptionsButton: By.id('additional-options-button'),
    additionalOptionsSaveButton: By.id('additional-options-save-button'),
    localVideoButton: By.id('button-camera'),
    mediaCaptureButton: By.id('button-record-cloud'),
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
    permisssionsFlow: By.id('flow-need-permission'),
    deviceFlow: By.id('flow-devices'),
    meetingFlow: By.id('flow-meeting'),
    sipAuthenticateFlow: By.id('flow-sip-authenticate'),
    sipUriFlow: By.id('flow-sip-uri'),

    failedMeetingFlow: By.id('flow-failed-meeting'),
    microphoneDropDownVoiceFocusButton: By.id('toggle-dropdown-menu-microphone-Amazon-Voice-Focus'),
    microphoneDropDown440HzButton: By.id('dropdown-menu-microphone-440-Hz'),
    microphoneDropDownPrecordedSpeechButton: By.id('dropdown-menu-microphone-Prerecorded-Speech'),
    microphoneDropDownNoneButton: By.id('dropdown-menu-microphone-None'),
    microphoneDropDownNoAudioButton: By.id('dropdown-menu-microphone-No-Audio'),
    microphoneDropDownL500HzR1000HzButton: By.id('dropdown-menu-microphone-L-500Hz-R-1000Hz'),
    microphoneDropDownButton: By.id('button-microphone-drop'),
    microphoneButton: By.id('button-microphone'),

    emojiFilterButton: By.id('dropdown-menu-filter-Emojify'),

    meetingAudio: By.id('meeting-audio'),
    sipUri: By.id('sip-uri'),
    simulcastFeature: By.id('simulcast'),
    webAudioFeature: By.id('webaudio'),
    simulcastFeatureLabel: By.css('label[for="simulcast"]'),
    webAudioFeatureLabel: By.css('label[for="webaudio"]'),

    microphoneDropDownLiveTranscriptionButton: By.id('toggle-dropdown-menu-microphone-Live-Transcription'),
    transcriptionModalTranscribeEngine: By.id('engine-transcribe'),                // Select option.
    transcriptionModalTranscribeMedicalEngine: By.id('engine-transcribe-medical'), // Select option.
    startTranscriptionButton: By.id('button-start-transcription'),
    transcriptContainer: By.id('transcript-container'),

    eventReportingCheckBox: By.id('event-reporting'),
    eventReportingCheckBoxLabel: By.css('label[for="event-reporting"]'),
    backgroundBlurFilterButton: By.id('dropdown-menu-filter-Background-Blur-40%-CPU'),
    backgroundReplacementFilterButton: By.id('dropdown-menu-filter-Background-Replacement'),
    microphoneDropEchoButton: By.id('dropdown-menu-microphone-Echo'),
    echoReductionFeature: By.id('echo-reduction-capability'),
    echoReductionFeatureLabel: By.css('label[for="echo-reduction-capability"]'),
    stereoMusicProfileCheckBox: By.id('fullband-music-stereo-quality'),
    stereoMusicProfileCheckBoxLabel: By.css('label[for="fullband-music-stereo-quality"]'),
    chimeMeetingId: By.id('chime-meeting-id')
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
    await this.waitForBrowserDemoToLoad();
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
    await clickElement(this.driver, authenticateButton);
  }

  async openAdditionalOptions() {
    let additionalOptionsButton = await this.driver.findElement(elements.additionalOptionsButton);
    await clickElement(this.driver, additionalOptionsButton);
    await TestUtils.waitAround(200);
  }

  async closeAdditionalOptions() {
    let additionalOptionsSaveButton = await this.driver.findElement(elements.additionalOptionsSaveButton);
    await clickElement(this.driver, additionalOptionsSaveButton);
    await TestUtils.waitAround(200);
  }

  async chooseUseWebAudio() {
    let webAudioFeature = await this.driver.findElement(elements.webAudioFeature);
    let webAudioFeatureLabel = await this.driver.findElement(elements.webAudioFeatureLabel);

    // Click the label because it's on top.
    if (await webAudioFeature.isSelected()) {
      console.log('Web Audio is selected');
    } else {
      await clickElement(this.driver, webAudioFeatureLabel);
    }
  }

  // selects echo reduction capability at the meeting level 
  async chooseEchoReduction() {
    const echoReductionFeature = await this.driver.findElement(elements.echoReductionFeature);
    const echoReductionFeatureLabel = await this.driver.findElement(elements.echoReductionFeatureLabel);

    // Click the label because it's on top.
    if (await echoReductionFeature.isSelected()) {
      console.log('Echo Reduction capability is selected');
    } else {
      await clickElement(this.driver, echoReductionFeatureLabel);
    }
  }

  async chooseUseSimulcast() {
    let simulcastFeature = await this.driver.findElement(elements.simulcastFeature);
    let simulcastFeatureLabel = await this.driver.findElement(elements.simulcastFeatureLabel);

    // Click the label because it's on top.
    if (await simulcastFeature.isSelected()) {
      this.logger('simulcast is selected');
    } else {
      await clickElement(this.driver, simulcastFeatureLabel);
    }
  }

  async chooseEnableEventReporting() {
    const eventReportingCheck = await this.driver.findElement(elements.eventReportingCheckBox);
    const eventReportingCheckLabel = await this.driver.findElement(elements.eventReportingCheckBoxLabel);
    
    // Click the label because it's on top.
    if (await eventReportingCheck.isSelected()) {
      this.logger('event reporting is enabled');
    } else {
      await clickElement(this.driver, eventReportingCheckLabel);
    }
  }

  async chooseStereoMusicAudioProfile() {
    const stereoMusicProfileCheck = await this.driver.findElement(elements.stereoMusicProfileCheckBox);
    const stereoMusicProfileCheckLabel = await this.driver.findElement(elements.stereoMusicProfileCheckBoxLabel);
    
    // Click the label because it's on top.
    if (await stereoMusicProfileCheck.isSelected()) {
      this.logger('stereo music audio profile is selected');
    } else {
      await stereoMusicProfileCheckLabel.click();
    }
  }

  async joinMeeting() {
    let joinButton = await this.driver.findElement(elements.joinButton);
    await clickElement(this.driver, joinButton);
  }

  async endTheMeeting() {
    let meetingEndButtom = await this.driver.findElement(elements.meetingEndButtom);
    await clickElement(this.driver, meetingEndButtom);
  }

  async leaveTheMeeting() {
    let meetingLeaveButton = await this.driver.findElement(elements.meetingLeaveButton);
    await clickElement(this.driver, meetingLeaveButton);
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
    await clickElement(this.driver, localVideoButton);
  }

  async clickMediaCaptureButton() {
    let mediaCaptureButton = await this.driver.findElement(elements.mediaCaptureButton);
    await clickElement(this.driver, mediaCaptureButton);
  }

  async clickMicrophoneButton() {
    let microphoneButton = await this.driver.findElement(elements.microphoneButton);
    await clickElement(this.driver, microphoneButton);
  }

  async clickVideoFilterDropButton() {
    const videoFilterDropButton = await this.driver.findElement(elements.videoFilterDropButton);
    this.logger(`video filter button is ${videoFilterDropButton}`);
    await clickElement(this.driver, videoFilterDropButton);
  }

  async clickVideoFilterFromDropDownMenu() {
    const emojiFilter = await this.driver.findElement(elements.emojiFilterButton);
    await clickElement(this.driver, emojiFilter);
  }

  async playRandomTone() {
    let tone = await this.driver.findElement(elements.microphoneDropDown440HzButton);
    await clickElement(this.driver, tone);
  }

  async playRandomStereoTone() {
    let tone = await this.driver.findElement(elements.microphoneDropDownL500HzR1000HzButton);
    await tone.click();
  }

  async playPrerecordedSpeech() {
    let precordedSpeech = await this.driver.findElement(elements.microphoneDropDownPrecordedSpeechButton);
    await clickElement(this.driver, precordedSpeech);
  }

  async playEcho() {
    const echoButton = await this.driver.findElement(elements.microphoneDropEchoButton);
    await echoButton.click();
  }

  async selectNoneAudioInput() {
    let noneButton = await this.driver.findElement(elements.microphoneDropDownNoneButton);
    await clickElement(this.driver, noneButton);
  }

  async selectNoAudioInput() {
    let noneButton = await this.driver.findElement(elements.microphoneDropDownNoAudioButton);
    await clickElement(this.driver, noneButton);
  }

  async clickOnMicrophoneDropDownButton() {
    let microphoneDropDown = await this.driver.findElement(elements.microphoneDropDownButton);
    await clickElement(this.driver, microphoneDropDown);
  }

  async clickStartAmazonVoiceFocus() {
    const startAmazonVoiceFocus = await this.driver.findElement(elements.microphoneDropDownVoiceFocusButton);
    await startAmazonVoiceFocus.click();    
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
    await clickElement(this.driver, sipAuthenticateButton);
  }

  async switchToSipCallFlow() {
    let switchToSipFlow = await this.driver.findElement(elements.switchToSipFlow);
    await clickElement(this.driver, switchToSipFlow);
  }

  async waitingToEndMeeting() {
    let timeout = 10;
    let i = 0;
    let meetingEnding = true;
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
  
  async waitForElement(element, timeout = 10000) {
    try {
      await this.driver.wait(until.elementLocated(element), timeout);
      await this.driver.wait(until.elementIsVisible(this.driver.findElement(element)), timeout);
      return 'done';
    }
    catch(e) {
      return 'failed';
    }
  }

  async waitForElementToNotBeVisible(element, timeout = 10000) {
    try {
      await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(element)), timeout);
      return 'done';
    }
    catch(e) {
      return 'failed';
    }
  }

  async waitForDeviceFlow() {
    if(await this.waitForElementToNotBeVisible(elements.authenticationFlow) === 'failed') {
      return 'failed';
    }
    return await this.waitForElementToNotBeVisible(elements.permisssionsFlow);
  }

  async waitForBrowserDemoToLoad() {
    return await this.waitForElement(elements.authenticationFlow, 30000)
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
    return await this.waitForElement(elements.meetingFlow, 20000)
  }

  async isLiveTranscriptionPresentInDeviceMenu() {
    return await this.driver.findElement(elements.microphoneDropDownLiveTranscriptionButton).isDisplayed();
  }

  async isLiveTranscriptionEnabledInDeviceMenu() {
    const classes = await this.driver.findElement(elements.microphoneDropDownLiveTranscriptionButton).getAttribute('class');
    return classes.split(' ').includes('live-transcription-active');
  }

  async clickLiveTranscriptionMenuButton() {
    await this.driver.findElement(elements.microphoneDropDownLiveTranscriptionButton).click();
  }

  async clickTranscribeEngineOption() {
    await this.driver.findElement(elements.transcriptionModalTranscribeEngine).click();
  }

  async clickTranscribeMedicalEngineOption() {
    await this.driver.findElement(elements.transcriptionModalTranscribeMedicalEngine).click();
  }

  async clickStartTranscriptionButton() {
    await this.driver.findElement(elements.startTranscriptionButton).click();
  }

  async checkIfTranscriptionVisible() {
    return await this.driver.findElement(elements.transcriptContainer).isDisplayed();
  }

  async checkIfTranscriptionStarted(useMedical) {
    const transcriptContainerText = await this.driver.findElement(elements.transcriptContainer).getText();
    const allTranscripts = transcriptContainerText.split('\n');
    if (allTranscripts.length < 1) {
      return false;
    }

    // Only validate the most recent started message.
    let lastStartedMessageText = '';
    let lastStartedIdx = allTranscripts.length - 1;
    while (lastStartedIdx >= 0) {
      const transcriptText = allTranscripts[lastStartedIdx];
      if (transcriptText.includes('Live Transcription started')) {
        lastStartedMessageText = transcriptText;
        break;
      }
      lastStartedIdx--;
    }
    if (lastStartedIdx < 0) {
      return false;
    }

    if (!useMedical) {
      return lastStartedMessageText.includes('EngineTranscribeSettings');
    } else {
      return lastStartedMessageText.includes('EngineTranscribeMedicalSettings');
    }
  }

  async checkIfTranscriptionStopped(useMedical) {
    const transcriptContainerText = await this.driver.findElement(elements.transcriptContainer).getText();
    const allTranscripts = transcriptContainerText.split('\n');
    if (allTranscripts.length < 1) {
      return false;
    }

    const lastTranscriptText = allTranscripts[allTranscripts.length - 1];
    if (!lastTranscriptText.includes('Live Transcription stopped')) {
      return false;
    }

    if (!useMedical) {
      return lastTranscriptText.includes('EngineTranscribeSettings');
    } else {
      return lastTranscriptText.includes('EngineTranscribeMedicalSettings');
    }
  }

  async checkTranscriptsFromLastStart(expectedTranscriptContentBySpeaker, isMedicalTranscribe, compareFn) {
    const transcriptContainerText = await this.driver.findElement(elements.transcriptContainer).getText();
    const allTranscripts = transcriptContainerText.split('\n');
    if (allTranscripts.length < 1) {
      console.error(`Unable to find any transcripts`);
      return false;
    }

    let lastStartedIdx = allTranscripts.length - 1;
    while (lastStartedIdx >= 0) {
      if (allTranscripts[lastStartedIdx].includes('Live Transcription started')) {
        break;
      }
      lastStartedIdx--;
    }
    if (lastStartedIdx < 0) {
      console.error(`Unexpected received lastStartedIdx < 0: ${lastStartedIdx}`);
      return false;
    }
    const transcriptsToValidate = allTranscripts.slice(lastStartedIdx + 1);

    // Verify that each speaker's content is as expected according to compareFn.
    // Sequential transcripts for the same speaker are appended together for comparison.
    const actualTranscriptContentBySpeaker = {};
    for (let i = 0; i < transcriptsToValidate.length; i++) {
      const transcriptText = transcriptsToValidate[i];
      const speaker = transcriptText.slice(0, transcriptText.indexOf(':'));
      const content = transcriptText.slice(transcriptText.indexOf(':') + 1).trim();
      if (actualTranscriptContentBySpeaker[speaker]) {
        actualTranscriptContentBySpeaker[speaker] += " " + content;
      } else {
        actualTranscriptContentBySpeaker[speaker] = content;
      }
    }

    let actualSpeakers = Object.getOwnPropertyNames(actualTranscriptContentBySpeaker);
    let expectedSpeaker = Object.getOwnPropertyNames(expectedTranscriptContentBySpeaker);

    // Temporarily filtering empty speakers for medical transcribe test. Empty speaker issue - P68074811
    if (isMedicalTranscribe) {
      console.log(`Filtering empty speaker in medical transcribe.`);
      actualSpeakers = actualSpeakers.filter(speaker => speaker !== "")
    }

    if (actualSpeakers.length !== expectedSpeaker.length) {
      console.error(`Expected speaker length ${expectedSpeaker.length} but got ${actualSpeakers.length}`);
      return false;
    }

    for (let i = 0; i < actualSpeakers.length; i++) {
      const speaker = actualSpeakers[i];
      if (!compareFn(actualTranscriptContentBySpeaker[speaker], expectedTranscriptContentBySpeaker[speaker], isMedicalTranscribe)) {
        console.log(`Transcript comparison failed, speaker: ${speaker} isMedicalTranscribe: ${isMedicalTranscribe} actual content: "${actualTranscriptContentBySpeaker[speaker]}" does not match with expected: "${expectedTranscriptContentBySpeaker[speaker]}"`);
      }
    }

    return true;
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
    return clickElement(this.driver, elem);
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

  async rosterCheck(numberOfParticipants, checkCount = 10, waitTimeMs = 1000) {
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
    const startTime = Date.now();
    let videos = await this.driver.findElements(By.css('video[id^="video-"]'));
    console.log(`Looping through ${videos && videos.length} videos`);
    for (let i = 0; i < videos.length-1; i++) {
      const tileIndex = i;
      const nameplate = await this.driver.findElement(By.id(`nameplate-${tileIndex}`));
      const nameplateText = await nameplate.getText();
      console.log(`nameplate: ${nameplateText}`);
      if (nameplate && nameplateText === attendeeName) {
        let numRetries = 10;
        let retry = 0;
        console.log(`Start verifying video display by attendeeName=${attendeeName}, tileIndex=${tileIndex}`);
        let checked = await TestUtils.verifyVideoDisplayById(stepInfo.driver, `video-${tileIndex}`);
        while ((checked.result !== expectedState) && retry < numRetries) {
          console.log(`video check not yet complete, retrying again, retry count: ${retry}`);
          checked = await TestUtils.verifyVideoDisplayById(stepInfo.driver, `video-${tileIndex}`);
          retry++;
          await TestUtils.waitAround(1000);
        }
        console.log(`videoCheckByAttendeeName completed in: ${Date.now()-startTime}ms`);
        return checked.result;
      }
    }

    console.log(`videoCheckByAttendeeName completed in: ${Date.now()-startTime}ms`);
    return 'blank';
  }

  async audioCheck(stepInfo, expectedState, checkStereoTones = false) {
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(async (expectedState, checkStereoTones) => {
        let logs = [];
        let callback = arguments[arguments.length - 1];

        const sleep = (milliseconds) => {
          return new Promise(resolve => setTimeout(resolve, milliseconds))
        };

        const channelCount = checkStereoTones ? 2 : 1;

        const successfulToneChecks = Array(channelCount).fill(0);
        const totalToneChecks = Array(channelCount).fill(0);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const minToneError = Array(channelCount).fill(Infinity);
        const maxToneError = Array(channelCount).fill(-Infinity);
        const percentages = Array(channelCount).fill(0);
        try {
          const stream = document.getElementById('meeting-audio').srcObject;
          const source = audioContext.createMediaStreamSource(stream);
          let analyser = [];
          for(let i=0; i<channelCount; i++) {
            analyser.push(audioContext.createAnalyser());
          }
          let byteFrequencyData = [];
          for(let i=0; i<channelCount; i++) {
            byteFrequencyData.push(new Uint8Array(analyser[i].frequencyBinCount));
          }
          let floatFrequencyData = [];
          for(let i=0; i<channelCount; i++) {
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

          const getAverageVolume = (channelIndex) => {
            analyser[channelIndex].getByteFrequencyData(byteFrequencyData[channelIndex]);
            let values = 0;
            let average;
            const length = byteFrequencyData[channelIndex].length;
            // get all the frequency amplitudes
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
              logs.push(`Resulting volume ${avgTestVolume}`);
              if (
                (expectedState === "AUDIO_ON" && avgTestVolume > 0) ||
                (expectedState === "AUDIO_OFF" && avgTestVolume === 0)
              ) {
                successfulToneChecks[channelIndex]++;
              }
              await sleep(100)
            }
          };

          const checkFrequency = (targetReceiveFrequency, channelIndex) => {
            analyser[channelIndex].getFloatFrequencyData(floatFrequencyData[channelIndex]);
            // logs.push(`frequency data : ${floatFrequencyData}`);
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
            return hotBinFrequency
          };

          const checkFrequencyFor = async (runCount, freq, channelIndex) => {
            for (let i = 0; i < runCount; i++) {
              const testFrequency = checkFrequency(freq, channelIndex);
              logs.push(`Resulting Frequency ${testFrequency} for channel ${channelIndex}`);
              await sleep(100)
            }
          };

          if (expectedState === "AUDIO_OFF") {
            await checkVolumeFor(50, 0);
            if (checkStereoTones) {
              await checkVolumeFor(50, 1);
            }
          }

          if (expectedState === "AUDIO_ON") {
            if (checkStereoTones) {
              await checkFrequencyFor(50, 500, 0);
              await checkFrequencyFor(50, 1000, 1);
            } else {
              await checkFrequencyFor(50, 440, 0);
            }
          }

          for (let i=0; i<channelCount; i++) {
            percentages[i] = successfulToneChecks[i] / totalToneChecks[i];
          }
        } catch (e) {
          logs.push(`${e}`)
        } finally {
          logs.push(`test completed`);
          await audioContext.close();
          callback({
            percentages,
            logs
          });
        }
      }, expectedState, checkStereoTones);
    } catch (e) {
      this.logger(`Audio Check Failed ${e}`)
    } finally {
      if (res) {
        res.logs.forEach(l => {
          this.logger(l)
        })
      }
    }
    if (!res) {
      return false;
    }
    for (let i=0; i<res.percentages.length; i++) {
      this.logger(`Audio check success rate channel ${i}: ${res.percentages[i] * 100}%`);
      if (res.percentages[i] < 0.75) {
        return false;
      }
    }
    return true;
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

  async clickBackgroundBlurFilterFromDropDownMenu() {
    await this.clickBackgroundFilterFromDropDownMenu(elements.backgroundBlurFilterButton);
  }

  async backgroundBlurCheck(attendeeId) {
    const expectedSumMin = 15805042;
    const expectedSumMax = 15940657;
    return await this.backgroundFilterCheck(attendeeId, expectedSumMin, expectedSumMax);
  }

  async clickBackgroundReplacementFilterFromDropDownMenu() {
    await this.clickBackgroundFilterFromDropDownMenu(elements.backgroundReplacementFilterButton);
  }

  async backgroundReplacementCheck(attendeeId) {
    const expectedSumMin = 11000000;
    const expectedSumMax = 11200000;
    return await this.backgroundFilterCheck(attendeeId, expectedSumMin, expectedSumMax);
  }

  async clickBackgroundFilterFromDropDownMenu(buttonID) {
    await TestUtils.waitAround(1000);
    const backgroundBlurButton = await this.driver.findElement(buttonID);
    await backgroundBlurButton.click();
  }

  async backgroundFilterCheck(attendeeId, expectedSumMin, expectedSumMax) {
    await TestUtils.waitAround(4000);
    const videoElement = this.driver.findElement(By.xpath(`//*[contains(@class,'video-tile-nameplate') and contains(text(),'${attendeeId}')]`));
    const videoElementId = await videoElement.getAttribute('id');
    const seperatorIndex = videoElementId.lastIndexOf("-");
    if (seperatorIndex >= -1) {
      const tileIndex = parseInt(videoElementId.slice(seperatorIndex+1))
      if (tileIndex != NaN && tileIndex >= 0) {
        const videoImgSum = await this.driver.executeScript(this.getVideoImageSum(tileIndex));
        console.log(`videoImgSum ${videoImgSum}`);
        if(videoImgSum < expectedSumMin || videoImgSum > expectedSumMax){
          console.log(`videoImgSum ${videoImgSum}`);
          return false;
        }
      }
    }
    return true;
  }


  getVideoImageSum(videoId) {
    return "function getSum(total, num) {return total + num;};"
        + "const canvas = document.createElement('canvas');"
        + "const ctx = canvas.getContext('2d');"
        + "const video = document.getElementById('video-"+videoId+"');"
        + "canvas.width = video.videoWidth/3;"
        + "canvas.height = video.videoHeight/3;"
        + "ctx.drawImage(video,0,0, canvas.width,canvas.height);"
        + "var imageData = ctx.getImageData(0,0,video.videoHeight-1,video.videoWidth-1).data;"
        + "var sum = imageData.reduce(getSum);"
        + "return sum;"
  }

  async sendingAudioCheck(stepInfo, expectedEvent, waitTimeMs) {
    await TestUtils.waitAround(waitTimeMs);
    let expectedStateFound = false;
    try {
      const logs = await this.driver.manage().logs().get(logging.Type.BROWSER);
      const eventLogCaptureRegex = new RegExp('Received an event: (.*)"');

      logs.forEach(entry => {
        const matchedItems = eventLogCaptureRegex.exec(entry.message); // matchedItems[1] has our the JSON payload
        if (matchedItems) {
          // When running on Saucelabs double quotes in logs are weirdly escaped with just a single \ instead of \\
          // so JSON.parse is throwing an error, so we escape all instances of \" with "
          const validJsonString = matchedItems[1].replaceAll(/\\"/g, '"');
          if (JSON.parse(validJsonString).name === expectedEvent) {
            this.logger(`SendingAudioCheck successful for expectedEvent: ${expectedEvent}`);
            expectedStateFound = true;
          }
        }
      });
    } catch (e) {
      this.logger(`SendingAudioCheck failed with error: ${e}`);
    }
    return expectedStateFound;
  }
  
  async echoAudioCheck(stepInfo, expectedState){
    let res = undefined;
    try {
      res = await this.driver.executeAsyncScript(async (expectedState) => {
        const logs = [];
        const callback = arguments[arguments.length - 1];

        const sleep = (milliseconds) => {
          return new Promise(resolve => setTimeout(resolve, milliseconds));
        };

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let successfulChecks = 0;
        let totalChecks = 0;
        try {
          const stream = document.getElementById('meeting-audio').srcObject;
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          let byteFrequencyData = new Uint8Array(analyser.frequencyBinCount);

          await sleep(5000);

          // get the average volume from the frequency data
          const getAverageVolume = () => {
            analyser.getByteFrequencyData(byteFrequencyData);

            let values = 0;
            let average = 0;
            const length = byteFrequencyData.length;
            for (const value of byteFrequencyData) {
              values += value;
            }
            average = values / length;
            return average;
          };

          // check the volume for runCount times
          const checkVolumeFor = async (runCount) => {
            for (let i = 0; i < runCount; ++i){
              totalChecks++;
              const avgTestVolume = getAverageVolume();
              logs.push(`Resulting volume ${avgTestVolume}`);
              if (
                (expectedState === 'AUDIO_ON' && avgTestVolume > 0) ||
                (expectedState === 'AUDIO_OFF' && avgTestVolume === 0)
              ) {
                successfulChecks++;
              }
              await sleep(100);
            }
          };

          await checkVolumeFor(25);
        } catch (e) {
          logs.push(`${e}`);
        } finally {
          logs.push(`Echo test completed`);
          await audioContext.close();
          callback({
            percentage: successfulChecks / totalChecks,
            logs
          });
        }
      }, expectedState);
    } catch (e) {
      this.logger(`Echo Audio Check Failed ${e}`);
    } finally {
      if (res) {
        res.logs.forEach(l => {
          this.logger(l);
        })
      }
    }
    this.logger(`Echo Audio check success rate: ${res.percentage * 100}%`);
    if (res.percentage >= 0.75) {
      return true;
    }
    return false;
  }

  async logMeetingId() {
    const meetingElement = this.driver.findElement(elements.chimeMeetingId);
    const meetingId = await meetingElement.getText();
    this.logger(`Meeting started for ${meetingId}`);
  }
}


module.exports = AppPage;
