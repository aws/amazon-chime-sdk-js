const { describe } = require('mocha');
const { step } = require('mocha-steps');
const { v4: uuidv4 } = require('uuid');
const { Window } = require('../utils/Window');
const { MeetingPage, VideoState } = require('../pages/MeetingPage');
const setupTestEnvironment = require('./TestSetup');

/*
 * VideoProcessingTest - Standalone Background Blur Test
 * 
 * Verifies background blur video processing works with a single participant.
 * Tests the video processing pipeline in isolation (no peer connection needed).
 */
describe('VideoProcessingTest', async function () {
  const testSetup = setupTestEnvironment('VideoProcessingTest', MeetingPage);

  let test_window;
  let test_attendee_id;

  testSetup.setupBaseTest();

  step('should open the meeting demo', async function () {
    test_window = await Window.existing(this.driverFactoryOne.driver, this.logger, 'TEST');
    await test_window.runCommands(async () => await this.pageOne.open(this.driverFactoryOne.url));
  });

  step('should authenticate user', async function () {
    test_attendee_id = 'Video Processing Test - ' + uuidv4();
    await test_window.runCommands(async () => await this.pageOne.enterMeetingId(uuidv4()));
    await test_window.runCommands(async () => await this.pageOne.enterAttendeeName(test_attendee_id));
    await test_window.runCommands(async () => await this.pageOne.authenticate());
  });

  step('should join meeting', async function () {
    await test_window.runCommands(async () => await this.pageOne.joinMeeting());
  });

  step('should turn on video', async function () {
    await test_window.runCommands(async () => await this.pageOne.turnVideoOn());
  });

  step('should verify local video is on', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
  });

  step('should enable background blur filter', async function () {
    await test_window.runCommands(async () => await this.pageOne.enableBackgroundBlur());
  });

  step('background blur should be active', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoFilterApplied('backgroundBlur'));
  });

  step('should verify video processing pipeline is active', async function () {
    await test_window.runCommands(async () => await this.pageOne.checkVideoState(VideoState.PLAY, test_attendee_id));
  });

  step('should verify processed video output', async function () {
    await test_window.runCommands(async () => await this.pageOne.verifyBackgroundBlurApplied());
  });
});
