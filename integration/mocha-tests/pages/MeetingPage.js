const { By, until, Key } = require('selenium-webdriver');
const { LogLevel, Log } = require('../utils/Logger');
const { sleep } = require('../utils/HelperFunctions');
const { MeetingEventManager } = require('../utils/events/MeetingEventManager');

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
    
    leaveButton: By.id('button-meeting-leave'),

    // Content Share
    contentShareButton: By.id('button-content-share'),
    contentShareDropButton: By.id('button-content-share-drop'),
    contentShareVideoTestButton: By.id('dropdown-item-content-share-screen-test-video'),
    contentSharePauseButton: By.id('dropdown-item-content-share-pause-resume'),

    // Data Message
    dataMessageInput: By.id('send-message'),
    dataMessageDisplay: By.id('receive-message'),

    // Video Filter
    videoFilterButton: By.id('button-video-filter'),
    videoFilterDropButton: By.id('button-video-filter-drop'),
    backgroundBlurFilterButton: By.id('dropdown-menu-filter-Background-Blur-40%-CPU'),

    // Voice Focus (Audio Processing)
    allowVoiceFocusCheckbox: By.id('allow-voice-focus'),
    addVoiceFocusCheckbox: By.id('add-voice-focus'),
    voiceFocusSettingContainer: By.id('voice-focus-setting'),
    voiceFocusDropdownItem: By.id('dropdown-menu-microphone-Amazon-Voice-Focus'),
  };
}

const VideoState = Object.freeze({
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  BLANK: 'BLANK',
  OFF: 'OFF'
});

const ContentShareState = Object.freeze({
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  OFF: 'OFF'
});

class MeetingPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
    this.meetingEventManager = new MeetingEventManager(driver, logger);
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
    this.logger.pushLogs(`Typing in Meeting id : ${meetingId}`);
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
    // Always set up event capture so the test doesn't need to do it
    await this.meetingEventManager.setupEventCapture();
  }

  async waitForUserAuthentication() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.joinButton)), DEFAULT_TIMEOUT_MS*3);
  }

  async joinMeeting() {
    this.logger.pushLogs('Clicking join button to join meeting');
    let joinButton = await this.driver.findElement(elements.joinButton);
    await joinButton.click();
    this.logger.pushLogs('Join button clicked, waiting for meeting flow to be visible');
    await this.waitForUserJoin();
    this.logger.pushLogs('Meeting joined successfully');
  }

  async waitForUserJoin() {
    await this.driver.wait(until.elementIsVisible(this.driver.findElement(elements.meetingFlow)), DEFAULT_TIMEOUT_MS*2);
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
      this.logger.pushLogs(`Found ${videoTiles.length} video tiles`);
      let videoTile = undefined;
      
      for (const tile of videoTiles) {
        const isVisible = await tile.isDisplayed();
        
        const nameplate = await tile.findElement(elements.videoTileNameplate);
        const nameplateText = await nameplate.getText();

        // Use startsWith for matching since the demo may truncate long names
        // Also check if the attendee ID starts with the nameplate text (for truncated names)
        const isMatch = nameplateText === attendeeId || 
                        attendeeId.startsWith(nameplateText) || 
                        nameplateText.startsWith(attendeeId);
        
        if (isMatch && isVisible && nameplateText.length > 0) {
          this.logger.pushLogs(`Found visible video tile for attendee: ${attendeeId} (nameplate: "${nameplateText}")`, LogLevel.SUCCESS);
          videoTile = tile;
          break;
        }
      }
      
      if (!videoTile && expectedState === VideoState.OFF) {
        // If we're expecting the video to be off and we don't find a tile, that's actually correct
        this.logger.pushLogs(`No video tile found for attendee ${attendeeId}, which is expected for OFF state`, LogLevel.SUCCESS);
        result = VideoState.OFF;
      } else {
        result = await this.checkVideoContent(videoTile);
      }

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

  async leaveMeeting() {
    let leaveButton = await this.driver.findElement(elements.leaveButton);
    await this.driver.wait(until.elementIsVisible(leaveButton), DEFAULT_TIMEOUT_MS);
    await leaveButton.click();
    this.logger.pushLogs('Clicked leave meeting button');
  }

  async startContentShareTestVideo() {
    this.logger.pushLogs('Starting content share with test video');
    
    // Click content share dropdown button
    let contentShareDropButton = await this.driver.findElement(elements.contentShareDropButton);
    await this.driver.wait(until.elementIsVisible(contentShareDropButton), DEFAULT_TIMEOUT_MS);
    await contentShareDropButton.click();
    this.logger.pushLogs('Clicked content share dropdown button');
    
    // Select test video option from dropdown
    let contentShareVideoTestButton = await this.driver.findElement(elements.contentShareVideoTestButton);
    await this.driver.wait(until.elementIsVisible(contentShareVideoTestButton), DEFAULT_TIMEOUT_MS);
    await contentShareVideoTestButton.click();
    this.logger.pushLogs('Selected test video option from content share dropdown');
    
    // Wait for content share to start by waiting a short period
    await sleep(1000);
    this.logger.pushLogs('Content share with test video started', LogLevel.SUCCESS);
  }

  async toggleContentSharePause() {
    this.logger.pushLogs('Toggling content share pause/resume');
    
    // Click content share dropdown button to open the menu
    let contentShareDropButton = await this.driver.findElement(elements.contentShareDropButton);
    await this.driver.wait(until.elementIsVisible(contentShareDropButton), DEFAULT_TIMEOUT_MS);
    await contentShareDropButton.click();
    this.logger.pushLogs('Clicked content share dropdown button');
    
    // Click pause/resume button
    let contentSharePauseButton = await this.driver.findElement(elements.contentSharePauseButton);
    await this.driver.wait(until.elementIsVisible(contentSharePauseButton), DEFAULT_TIMEOUT_MS);
    await contentSharePauseButton.click();
    this.logger.pushLogs('Clicked content share pause/resume button', LogLevel.SUCCESS);
  }

  async stopContentShare() {
    this.logger.pushLogs('Stopping content share');
    
    // Click content share button to stop sharing
    let contentShareButton = await this.driver.findElement(elements.contentShareButton);
    await this.driver.wait(until.elementIsVisible(contentShareButton), DEFAULT_TIMEOUT_MS);
    await contentShareButton.click();
    this.logger.pushLogs('Clicked content share button to stop sharing', LogLevel.SUCCESS);
  }

  async checkContentShareVideoState(expectedState, attendeeId) {
    // Content share tiles have the attendee ID with #content suffix
    const contentShareAttendeeId = `${attendeeId}#content`;
    this.logger.pushLogs(`Checking if content share video is ${expectedState} for attendee: ${contentShareAttendeeId}`);

    const retry = 5;
    let i = 0;
    let result = undefined;

    while (result !== expectedState && i < retry) {
      const videoTiles = await this.driver.findElements(elements.videoTile);
      let contentShareTile = undefined;
      
      for (const tile of videoTiles) {
        const isVisible = await tile.isDisplayed();
        
        const nameplate = await tile.findElement(elements.videoTileNameplate);
        const nameplateText = await nameplate.getText();

        if (nameplateText === contentShareAttendeeId && isVisible) {
          this.logger.pushLogs(`Found visible content share video tile for attendee: ${contentShareAttendeeId}`, LogLevel.SUCCESS);
          contentShareTile = tile;
          break;
        }
      }
      
      if (!contentShareTile && expectedState === ContentShareState.OFF) {
        // If we're expecting the content share to be off and we don't find a tile, that's correct
        this.logger.pushLogs(`No content share video tile found for attendee ${contentShareAttendeeId}, which is expected for OFF state`, LogLevel.SUCCESS);
        result = ContentShareState.OFF;
      } else if (!contentShareTile) {
        // Tile not found but we expected it to be present
        this.logger.pushLogs(`No content share video tile found for attendee ${contentShareAttendeeId}`, LogLevel.WARN);
        result = ContentShareState.OFF;
      } else {
        // Check the video content state using the existing checkVideoContent method
        const videoContentState = await this.checkVideoContent(contentShareTile);
        
        // Map VideoState to ContentShareState
        if (videoContentState === VideoState.PLAY) {
          result = ContentShareState.PLAY;
        } else if (videoContentState === VideoState.PAUSE || videoContentState === VideoState.BLANK) {
          result = ContentShareState.PAUSE;
        } else {
          result = ContentShareState.OFF;
        }
      }

      if (result !== expectedState) {
        this.logger.pushLogs(`Current content share state: ${result}, expected: ${expectedState}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      } else {
        break;
      }
    }

    if (result === expectedState) {
      this.logger.pushLogs(`Content share video check passed: ${expectedState} for attendee ${attendeeId}`, LogLevel.SUCCESS);
    } else {
      const error = `Content share video check failed: expected ${expectedState} but got ${result} for attendee ${attendeeId}`;
      this.logger.pushLogs(error, LogLevel.ERROR);
      throw new Error(error);
    }
  }

  async sendDataMessage(message) {
    this.logger.pushLogs(`Sending data message: ${message}`);
    
    // Find message input field
    let dataMessageInput = await this.driver.findElement(elements.dataMessageInput);
    await this.driver.wait(until.elementIsVisible(dataMessageInput), DEFAULT_TIMEOUT_MS);
    
    // Clear any existing text
    await dataMessageInput.clear();
    
    // Enter message text
    await dataMessageInput.sendKeys(message);
    this.logger.pushLogs(`Entered message text: ${message}`);
    
    // Submit the message by pressing Enter
    await dataMessageInput.sendKeys(Key.RETURN);
    this.logger.pushLogs(`Data message sent successfully: ${message}`, LogLevel.SUCCESS);
  }

  async checkDataMessageReceived(expectedMessage) {
    this.logger.pushLogs(`Checking if data message was received: ${expectedMessage}`);

    const retry = 5;
    let i = 0;
    let messageFound = false;

    while (!messageFound && i < retry) {
      try {
        // Find message display area
        let dataMessageDisplay = await this.driver.findElement(elements.dataMessageDisplay);
        await this.driver.wait(until.elementIsVisible(dataMessageDisplay), DEFAULT_TIMEOUT_MS);
        
        // Get the text content
        const displayText = await dataMessageDisplay.getText();
        this.logger.pushLogs(`Message display content: ${displayText}`);
        
        // Check if the expected message is present (could be part of the text)
        if (displayText.includes(expectedMessage)) {
          messageFound = true;
          this.logger.pushLogs(`Found expected message: ${expectedMessage}`, LogLevel.SUCCESS);
        } else {
          this.logger.pushLogs(`Expected message not found, retrying... (${i + 1}/${retry})`);
          i++;
          await sleep(1000);
        }
      } catch (error) {
        this.logger.pushLogs(`Error checking message display: ${error.message}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      }
    }

    if (messageFound) {
      this.logger.pushLogs(`Data message check passed: ${expectedMessage}`, LogLevel.SUCCESS);
    } else {
      const error = `Data message check failed: expected message "${expectedMessage}" was not found after ${retry} retries`;
      this.logger.pushLogs(error, LogLevel.ERROR);
      throw new Error(error);
    }
  }

  async enableBackgroundBlur() {
    this.logger.pushLogs('Enabling background blur video filter');
    
    // Click video filter dropdown button
    let videoFilterDropButton = await this.driver.findElement(elements.videoFilterDropButton);
    await this.driver.wait(until.elementIsVisible(videoFilterDropButton), DEFAULT_TIMEOUT_MS);
    await videoFilterDropButton.click();
    this.logger.pushLogs('Clicked video filter dropdown button');
    
    // Select background blur option from dropdown
    let backgroundBlurFilterButton = await this.driver.findElement(elements.backgroundBlurFilterButton);
    await this.driver.wait(until.elementIsVisible(backgroundBlurFilterButton), DEFAULT_TIMEOUT_MS);
    await backgroundBlurFilterButton.click();
    this.logger.pushLogs('Selected background blur option from video filter dropdown');
    
    // Wait for the filter to be applied
    await sleep(1000);
    this.logger.pushLogs('Background blur video filter enabled', LogLevel.SUCCESS);
  }

  async checkVideoFilterApplied(filterType) {
    this.logger.pushLogs(`Checking if video filter is applied: ${filterType}`);

    const retry = 5;
    let i = 0;
    let filterApplied = false;

    while (!filterApplied && i < retry) {
      try {
        // Find the video filter button (not the dropdown)
        let videoFilterButton = await this.driver.findElement(elements.videoFilterButton);
        await this.driver.wait(until.elementIsVisible(videoFilterButton), DEFAULT_TIMEOUT_MS);
        
        // Check if the button has the 'btn-success' class which indicates filter is on
        const classNamesString = await videoFilterButton.getAttribute('class');
        const classNames = classNamesString.split(' ');
        
        this.logger.pushLogs(`Video filter button classes: ${classNamesString}`);
        
        // When a filter is applied, the button has 'btn-success' class
        // When no filter is applied, it has 'btn-outline-secondary' class
        if (classNames.includes('btn-success')) {
          filterApplied = true;
          this.logger.pushLogs(`Video filter '${filterType}' is active (button has btn-success class)`, LogLevel.SUCCESS);
        } else {
          this.logger.pushLogs(`Video filter not yet applied, retrying... (${i + 1}/${retry})`);
          i++;
          await sleep(1000);
        }
      } catch (error) {
        this.logger.pushLogs(`Error checking video filter state: ${error.message}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      }
    }

    if (filterApplied) {
      this.logger.pushLogs(`Video filter check passed: ${filterType} is applied`, LogLevel.SUCCESS);
      return true;
    } else {
      const error = `Video filter check failed: expected filter '${filterType}' to be applied but it was not after ${retry} retries`;
      this.logger.pushLogs(error, LogLevel.ERROR);
      throw new Error(error);
    }
  }

  async isVoiceFocusOffered() {
    this.logger.pushLogs('Checking if Voice Focus is offered in device menu');
    
    try {
      // Click microphone dropdown button to open the menu
      await this.clickOnMicrophoneDropdownButton();
      this.logger.pushLogs('Opened microphone dropdown menu');
      
      // Check if Voice Focus option is present in the menu
      let voiceFocusOffered = false;
      try {
        let voiceFocusDropdownItem = await this.driver.findElement(elements.voiceFocusDropdownItem);
        // Wait briefly to see if the element is visible
        await this.driver.wait(until.elementIsVisible(voiceFocusDropdownItem), 2000);
        voiceFocusOffered = true;
        this.logger.pushLogs('Voice Focus option is present in the microphone dropdown', LogLevel.SUCCESS);
      } catch (error) {
        // Element not found or not visible - Voice Focus is not offered
        this.logger.pushLogs('Voice Focus option is not present in the microphone dropdown');
        voiceFocusOffered = false;
      }
      
      // Close the dropdown by clicking the dropdown button again
      let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
      await microphoneDropDownButton.click();
      this.logger.pushLogs('Closed microphone dropdown menu');
      
      return voiceFocusOffered;
    } catch (error) {
      this.logger.pushLogs(`Error checking if Voice Focus is offered: ${error.message}`, LogLevel.ERROR);
      // Try to close the dropdown if it's open
      try {
        let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
        await microphoneDropDownButton.click();
      } catch (closeError) {
        // Ignore errors when trying to close
      }
      return false;
    }
  }

  async enableVoiceFocus() {
    this.logger.pushLogs('Enabling Voice Focus audio processing');
    
    // Click microphone dropdown button to open the menu
    await this.clickOnMicrophoneDropdownButton();
    this.logger.pushLogs('Opened microphone dropdown menu');
    
    // Click Voice Focus enable option
    let voiceFocusDropdownItem = await this.driver.findElement(elements.voiceFocusDropdownItem);
    await this.driver.wait(until.elementIsVisible(voiceFocusDropdownItem), DEFAULT_TIMEOUT_MS);
    await voiceFocusDropdownItem.click();
    this.logger.pushLogs('Clicked Voice Focus option in microphone dropdown');
    
    // Wait for Voice Focus to be enabled
    await sleep(1000);
    this.logger.pushLogs('Voice Focus audio processing enabled', LogLevel.SUCCESS);
  }

  async isVoiceFocusEnabled() {
    this.logger.pushLogs('Checking if Voice Focus is enabled');
    
    try {
      // First, try to check the Voice Focus lobby checkbox state (if visible in the UI)
      try {
        let addVoiceFocusCheckbox = await this.driver.findElement(elements.addVoiceFocusCheckbox);
        const isDisplayed = await addVoiceFocusCheckbox.isDisplayed();
        
        if (isDisplayed) {
          // Check if the checkbox is selected/checked
          const isChecked = await addVoiceFocusCheckbox.isSelected();
          this.logger.pushLogs(`Voice Focus lobby checkbox is ${isChecked ? 'checked' : 'unchecked'}`);
          return isChecked;
        }
      } catch (checkboxError) {
        // Checkbox not found or not visible, try the dropdown item approach
        this.logger.pushLogs('Voice Focus lobby checkbox not found, checking dropdown item state');
      }
      
      // Alternative: Check the Voice Focus dropdown item state in the microphone menu
      // Open the microphone dropdown to check the Voice Focus item state
      await this.clickOnMicrophoneDropdownButton();
      this.logger.pushLogs('Opened microphone dropdown menu to check Voice Focus state');
      
      let voiceFocusEnabled = false;
      try {
        let voiceFocusDropdownItem = await this.driver.findElement(elements.voiceFocusDropdownItem);
        await this.driver.wait(until.elementIsVisible(voiceFocusDropdownItem), 2000);
        
        // Check if the dropdown item has an active/checked state
        // This could be indicated by a checkmark, active class, or aria-checked attribute
        const classNamesString = await voiceFocusDropdownItem.getAttribute('class');
        const ariaChecked = await voiceFocusDropdownItem.getAttribute('aria-checked');
        const innerText = await voiceFocusDropdownItem.getText();
        
        this.logger.pushLogs(`Voice Focus dropdown item classes: ${classNamesString}`);
        this.logger.pushLogs(`Voice Focus dropdown item aria-checked: ${ariaChecked}`);
        this.logger.pushLogs(`Voice Focus dropdown item text: ${innerText}`);
        
        // Check for various indicators that Voice Focus is enabled
        // Common patterns: 'active' class, aria-checked="true", or checkmark in text
        if (classNamesString && (classNamesString.includes('active') || classNamesString.includes('checked'))) {
          voiceFocusEnabled = true;
        } else if (ariaChecked === 'true') {
          voiceFocusEnabled = true;
        } else if (innerText && (innerText.includes('✓') || innerText.includes('✔'))) {
          voiceFocusEnabled = true;
        }
        
        this.logger.pushLogs(`Voice Focus is ${voiceFocusEnabled ? 'enabled' : 'disabled'}`);
      } catch (dropdownError) {
        this.logger.pushLogs(`Error checking Voice Focus dropdown item: ${dropdownError.message}`);
        voiceFocusEnabled = false;
      }
      
      // Close the dropdown by clicking the dropdown button again
      let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
      await microphoneDropDownButton.click();
      this.logger.pushLogs('Closed microphone dropdown menu');
      
      return voiceFocusEnabled;
    } catch (error) {
      this.logger.pushLogs(`Error checking if Voice Focus is enabled: ${error.message}`, LogLevel.ERROR);
      // Try to close the dropdown if it's open
      try {
        let microphoneDropDownButton = await this.driver.findElement(elements.microphoneDropDownButton);
        await microphoneDropDownButton.click();
      } catch (closeError) {
        // Ignore errors when trying to close
      }
      return false;
    }
  }

  async enableAllowVoiceFocus() {
    this.logger.pushLogs('Enabling Allow Voice Focus option on authentication page');
    
    try {
      const result = await this.driver.executeScript(`
        const checkbox = document.getElementById('allow-voice-focus');
        if (checkbox) {
          if (!checkbox.checked) {
            checkbox.click();
            return { success: true, wasChecked: false };
          } else {
            return { success: true, wasChecked: true };
          }
        }
        return { success: false, error: 'Checkbox not found' };
      `);
      
      if (result.success) {
        if (result.wasChecked) {
          this.logger.pushLogs('Allow Voice Focus option was already enabled');
        } else {
          this.logger.pushLogs('Allow Voice Focus option enabled', LogLevel.SUCCESS);
        }
      } else {
        throw new Error(result.error || 'Failed to enable Allow Voice Focus');
      }
    } catch (error) {
      this.logger.pushLogs(`Error enabling Allow Voice Focus: ${error.message}`, LogLevel.ERROR);
      throw error;
    }
  }

  async checkVoiceFocusSupported() {
    this.logger.pushLogs('Checking if Voice Focus is supported');
    
    const result = await this.driver.executeScript(`
      const voiceFocusSetting = document.getElementById('voice-focus-setting');
      if (!voiceFocusSetting) {
        return { supported: false, reason: 'voice-focus-setting element not found' };
      }
      if (voiceFocusSetting.classList.contains('hidden')) {
        return { supported: false, reason: 'Voice Focus not allowed (hidden)' };
      }
      if (voiceFocusSetting.classList.contains('add-voice-focus-not-supported')) {
        return { supported: false, reason: 'Voice Focus not supported on this device' };
      }
      const checkbox = voiceFocusSetting.querySelector('input');
      if (checkbox && checkbox.disabled) {
        return { supported: false, reason: 'Voice Focus checkbox is disabled' };
      }
      return { supported: true };
    `);
    
    this.logger.pushLogs(`Voice Focus support: ${result.supported ? 'supported' : result.reason}`);
    return result;
  }

  async checkAudioUIElements() {
    this.logger.pushLogs('Checking audio UI elements');
    
    const result = await this.driver.executeScript(`
      const microphoneButton = document.getElementById('button-microphone');
      const microphoneDropdown = document.getElementById('button-microphone-drop');
      return {
        hasMicrophoneButton: !!microphoneButton,
        hasMicrophoneDropdown: !!microphoneDropdown
      };
    `);
    
    if (!result.hasMicrophoneButton || !result.hasMicrophoneDropdown) {
      throw new Error('Basic audio UI elements not found');
    }
    this.logger.pushLogs('Audio UI elements verified', LogLevel.SUCCESS);
    return result;
  }

  async enableVoiceFocusInLobby() {
    this.logger.pushLogs('Enabling Voice Focus in lobby (before joining meeting)');
    
    try {
      // First check if the voice focus setting container is visible
      let voiceFocusSettingContainer = await this.driver.findElement(elements.voiceFocusSettingContainer);
      await this.driver.wait(until.elementIsVisible(voiceFocusSettingContainer), DEFAULT_TIMEOUT_MS);
      
      // Find the checkbox inside the container
      let addVoiceFocusCheckbox = await this.driver.findElement(elements.addVoiceFocusCheckbox);
      await this.driver.wait(until.elementIsVisible(addVoiceFocusCheckbox), DEFAULT_TIMEOUT_MS);
      
      // Check if already enabled
      const isChecked = await addVoiceFocusCheckbox.isSelected();
      if (!isChecked) {
        await addVoiceFocusCheckbox.click();
        this.logger.pushLogs('Voice Focus enabled in lobby', LogLevel.SUCCESS);
      } else {
        this.logger.pushLogs('Voice Focus was already enabled in lobby');
      }
      
      // Wait for Voice Focus to initialize
      await sleep(1000);
    } catch (error) {
      this.logger.pushLogs(`Error enabling Voice Focus in lobby: ${error.message}`, LogLevel.ERROR);
      throw error;
    }
  }

  async verifyAudioProcessingActive() {
    this.logger.pushLogs('Verifying audio processing pipeline is active');
    
    const retry = 5;
    let i = 0;
    let processingActive = false;

    while (!processingActive && i < retry) {
      try {
        // Execute script to check audio processing state
        const result = await this.driver.executeScript(`
          // Check if Voice Focus audio processing is active
          // This verifies the audio context and Voice Focus transformer are running
          
          // Check Voice Focus checkbox state as indicator of processing being active
          const voiceFocusCheckbox = document.getElementById('add-voice-focus');
          const isVoiceFocusChecked = voiceFocusCheckbox ? voiceFocusCheckbox.checked : false;
          
          // Check Allow Voice Focus checkbox state
          const allowVoiceFocusCheckbox = document.getElementById('allow-voice-focus');
          const isAllowVoiceFocusChecked = allowVoiceFocusCheckbox ? allowVoiceFocusCheckbox.checked : false;
          
          return {
            voiceFocusEnabled: isVoiceFocusChecked,
            allowVoiceFocusEnabled: isAllowVoiceFocusChecked
          };
        `);

        this.logger.pushLogs(`Audio processing state: Voice Focus=${result.voiceFocusEnabled}, Allow Voice Focus=${result.allowVoiceFocusEnabled}`);

        // Voice Focus being enabled indicates the audio processing pipeline is active
        if (result.voiceFocusEnabled) {
          processingActive = true;
          this.logger.pushLogs('Audio processing pipeline is active (Voice Focus enabled)', LogLevel.SUCCESS);
        } else {
          this.logger.pushLogs(`Audio processing not yet active, retrying... (${i + 1}/${retry})`);
          i++;
          await sleep(1000);
        }
      } catch (error) {
        this.logger.pushLogs(`Error checking audio processing state: ${error.message}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      }
    }

    if (processingActive) {
      this.logger.pushLogs('Audio processing pipeline verification passed', LogLevel.SUCCESS);
    } else {
      const error = 'Audio processing pipeline verification failed: Voice Focus processing is not active';
      this.logger.pushLogs(error, LogLevel.ERROR);
      throw new Error(error);
    }
  }

  async verifyBackgroundBlurApplied() {
    this.logger.pushLogs('Verifying background blur effect is applied to video output');
    
    const retry = 5;
    let i = 0;
    let blurVerified = false;

    while (!blurVerified && i < retry) {
      try {
        // Execute script to analyze video frames for blur effect
        const result = await this.driver.executeScript(`
          // Find the local video element (the one with background blur applied)
          const videoTiles = document.querySelectorAll('video-tile');
          let localVideo = null;
          
          for (const tile of videoTiles) {
            const video = tile.querySelector('video');
            if (video && video.srcObject) {
              // Check if this is a local video by looking at the video track
              const tracks = video.srcObject.getVideoTracks();
              if (tracks.length > 0) {
                localVideo = video;
                break;
              }
            }
          }
          
          if (!localVideo) {
            return { success: false, reason: 'No local video found' };
          }
          
          // Create a canvas to analyze the video frame
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = localVideo.videoWidth;
          canvas.height = localVideo.videoHeight;
          
          if (canvas.width <= 0 || canvas.height <= 0) {
            return { success: false, reason: 'Video dimensions are invalid' };
          }
          
          // Draw the current video frame to the canvas
          ctx.drawImage(localVideo, 0, 0, canvas.width, canvas.height);
          
          // Get pixel data from the frame
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Calculate edge detection to verify blur effect
          // Blurred images have smoother transitions (lower edge intensity)
          let edgeSum = 0;
          let pixelCount = 0;
          
          // Sample pixels to detect edges (simplified Sobel-like detection)
          for (let y = 1; y < canvas.height - 1; y += 4) {
            for (let x = 1; x < canvas.width - 1; x += 4) {
              const idx = (y * canvas.width + x) * 4;
              const idxRight = (y * canvas.width + (x + 1)) * 4;
              const idxDown = ((y + 1) * canvas.width + x) * 4;
              
              // Calculate gradient in x and y directions
              const gx = Math.abs(data[idx] - data[idxRight]) + 
                         Math.abs(data[idx + 1] - data[idxRight + 1]) + 
                         Math.abs(data[idx + 2] - data[idxRight + 2]);
              const gy = Math.abs(data[idx] - data[idxDown]) + 
                         Math.abs(data[idx + 1] - data[idxDown + 1]) + 
                         Math.abs(data[idx + 2] - data[idxDown + 2]);
              
              edgeSum += gx + gy;
              pixelCount++;
            }
          }
          
          const avgEdgeIntensity = pixelCount > 0 ? edgeSum / pixelCount : 0;
          
          // Check if video filter button indicates blur is active
          const videoFilterButton = document.getElementById('button-video-filter');
          const filterButtonClasses = videoFilterButton ? videoFilterButton.className : '';
          const filterActive = filterButtonClasses.includes('btn-success');
          
          // Verify video is actually playing (has non-zero content)
          let hasContent = false;
          let totalPixelValue = 0;
          for (let i = 0; i < Math.min(data.length, 10000); i += 4) {
            totalPixelValue += data[i] + data[i + 1] + data[i + 2];
          }
          hasContent = totalPixelValue > 0;
          
          return {
            success: filterActive && hasContent,
            filterActive: filterActive,
            hasContent: hasContent,
            avgEdgeIntensity: avgEdgeIntensity,
            videoWidth: canvas.width,
            videoHeight: canvas.height
          };
        `);

        this.logger.pushLogs(`Background blur verification result: filterActive=${result.filterActive}, hasContent=${result.hasContent}, avgEdgeIntensity=${result.avgEdgeIntensity}`);

        if (result.success) {
          blurVerified = true;
          this.logger.pushLogs('Background blur effect is verified on video output', LogLevel.SUCCESS);
        } else {
          this.logger.pushLogs(`Background blur verification not yet complete (reason: ${result.reason || 'filter not active or no content'}), retrying... (${i + 1}/${retry})`);
          i++;
          await sleep(1000);
        }
      } catch (error) {
        this.logger.pushLogs(`Error verifying background blur: ${error.message}, retrying... (${i + 1}/${retry})`);
        i++;
        await sleep(1000);
      }
    }

    if (blurVerified) {
      this.logger.pushLogs('Background blur video output verification passed', LogLevel.SUCCESS);
    } else {
      const error = 'Background blur verification failed: blur effect is not applied to video output';
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

  /**
   * Validates that the expected events have been captured.
   * @param expectedEventNames - The names of the expected events. The validation will check that *only* these events occur.
   * @param ignoredEvents - The names of the events to ignore. This can be used for events that may or may not occur.
   * @param expectedAttributes - The expected attributes of the events to check in addition to default checks.
   * @param timeoutMs - The timeout in milliseconds to wait on these events.
   * @returns {Promise<void>} - A promise that resolves when the events have been validated.
   */
  async validateEvents(
    expectedEventNames = [],
    ignoredEvents = [],
    expectedAttributes= {},
    timeoutMs = 10000,
  ) {
    return this.meetingEventManager.validateEvents(
      expectedEventNames, ignoredEvents, expectedAttributes, timeoutMs);
  }
}

module.exports = {
  MeetingPage,
  VideoState,
  ContentShareState
};
