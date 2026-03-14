const { By } = require('selenium-webdriver');
const { LogLevel } = require('./Logger');
const { sleep } = require('./HelperFunctions');

/**
 * Utility class for video-related test operations.
 * Handles pixel analysis and video filter verification.
 */
class VideoTestUtils {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
  }

  /**
   * Generate JavaScript code to quantify video tile image by summing pixels
   * for one third of the image, starting from the top left corner.
   * @param {number} videoId - The video tile index
   * @returns {string} JavaScript code to execute for computing pixel sum
   */
  getVideoImageSumScript(videoId) {
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

  /**
   * Sum the pixel values of the video tile image.
   * @param {string} attendeeId - The attendee ID to find the video tile
   * @returns {Promise<number>} videoImgSum - The sum of pixel values
   */
  async computeVideoSum(attendeeId) {
    this.logger.pushLogs(`Computing video pixel sum for attendee: ${attendeeId}`);
    await sleep(4000);
    
    const videoElement = await this.driver.findElement(
      By.xpath(`//*[contains(@class,'video-tile-nameplate') and contains(text(),'${attendeeId}')]`)
    );
    const videoElementId = await videoElement.getAttribute('id');
    const separatorIndex = videoElementId.lastIndexOf("-");
    
    if (separatorIndex >= -1) {
      const tileIndex = parseInt(videoElementId.slice(separatorIndex + 1));
      if (!isNaN(tileIndex) && tileIndex >= 0) {
        const videoImgSum = await this.driver.executeScript(this.getVideoImageSumScript(tileIndex));
        this.logger.pushLogs(`Video pixel sum for attendee ${attendeeId}: ${videoImgSum}`);
        return videoImgSum;
      }
    }
    
    throw new Error(`Could not compute video sum for attendee: ${attendeeId}`);
  }

  /**
   * Check that the Video Fx background blur transformation has been applied.
   * 
   * @param {string} attendeeId - The attendee ID to check
   * @param {number} rawVideoSum - Pixel image sum of video before Video Fx transformation
   * @returns {Promise<boolean>} - True if blur is applied correctly
   */
  async videoFxBackgroundBlurCheck(attendeeId, rawVideoSum) {
    this.logger.pushLogs(`Checking Video Fx background blur for attendee: ${attendeeId}`);
    const minSignificantDiff = 1000;
    return await this.videoFxBackgroundFilterCheck(attendeeId, rawVideoSum, minSignificantDiff, 'blur');
  }

  /**
   * Check that the Video Fx background replacement transformation has been applied.
   * 
   * @param {string} attendeeId - The attendee ID to check
   * @param {number} rawVideoSum - Pixel image sum of video before Video Fx transformation
   * @returns {Promise<boolean>} - True if replacement is applied correctly
   */
  async videoFxBackgroundReplacementCheck(attendeeId, rawVideoSum) {
    this.logger.pushLogs(`Checking Video Fx background replacement for attendee: ${attendeeId}`);
    const minSignificantDiff = 10000;
    return await this.videoFxBackgroundFilterCheck(attendeeId, rawVideoSum, minSignificantDiff, 'replacement');
  }

  /**
   * Performs the check that Video Fx has been applied correctly by computing the new image sum
   * and comparing with the rawVideoSum before the Video Fx was applied.
   * 
   * @param {string} attendeeId - The attendee ID to check
   * @param {number} rawVideoSum - Pixel image sum of video before Video Fx transformation
   * @param {number} minSignificantDiff - Minimum expected absolute difference
   * @param {string} filterType - Type of filter being checked ('blur' or 'replacement')
   * @returns {Promise<boolean>} - True if filter is applied correctly
   */
  async videoFxBackgroundFilterCheck(attendeeId, rawVideoSum, minSignificantDiff, filterType) {
    const transformedImgSum = await this.computeVideoSum(attendeeId);
    const checkDiff = Math.abs(transformedImgSum - rawVideoSum);
    
    this.logger.pushLogs(`Video Fx ${filterType} check - Raw sum: ${rawVideoSum}, Transformed sum: ${transformedImgSum}, Absolute difference: ${checkDiff}`);
    
    const pixelDiffSignificant = checkDiff >= minSignificantDiff;
    
    let filterUIActive = false;
    try {
      const videoFilterButton = await this.driver.findElement(By.id('button-video-filter'));
      const classNamesString = await videoFilterButton.getAttribute('class');
      filterUIActive = classNamesString.includes('btn-success');
      this.logger.pushLogs(`Video filter UI state: ${filterUIActive ? 'active' : 'inactive'}`);
    } catch (e) {
      this.logger.pushLogs(`Could not check video filter UI state: ${e.message}`, LogLevel.WARN);
    }
    
    if (pixelDiffSignificant && filterUIActive) {
      this.logger.pushLogs(
        `Video Fx ${filterType} check passed: absolute difference ${checkDiff} >= ${minSignificantDiff} and UI shows filter active`,
        LogLevel.SUCCESS
      );
      return true;
    }
    
    const reasons = [];
    if (!pixelDiffSignificant) {
      reasons.push(`pixel difference ${checkDiff} < minimum ${minSignificantDiff}`);
    }
    if (!filterUIActive) {
      reasons.push('filter UI not showing as active');
    }
    
    this.logger.pushLogs(
      `Video Fx ${filterType} check failed: ${reasons.join(', ')}`,
      LogLevel.ERROR
    );
    return false;
  }
}

module.exports = { VideoTestUtils };
