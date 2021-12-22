const {StartMeetingTranscriptionStep, StopMeetingTranscriptionStep, PlayPrerecordedSpeechStep, SelectNoneAudioInputStep} = require('./steps');
const {RosterCheck, TranscriptionStartedCheck, TranscriptionStoppedCheck, TranscriptsReceivedCheck} = require('./checks');
const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const {SdkTestUtils} = require('./utils/SdkTestUtils');
const {Window} = require('./utils/Window');
const { v4: uuidv4 } = require('uuid');

class TranscriptionTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, 'Transcription');
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;

    const session = this.seleniumSessions[0];

    const attendeeId1 = uuidv4();
    const attendeeId2 = uuidv4();

    const testWindow1 = await Window.existing(session.driver, "TEST1");
    const testWindow2 = await Window.openNew(session.driver, "TEST2");

    await testWindow1.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, attendeeId1, session, this.region));
    await testWindow1.runCommands(async () => await RosterCheck.executeStep(this, session, 1));

    await testWindow2.runCommands(async () => await SdkTestUtils.addUserToMeeting(this, attendeeId2, session, this.region));
    await testWindow2.runCommands(async () => await RosterCheck.executeStep(this, session, 2));

    await testWindow1.runCommands(async () => SelectNoneAudioInputStep.executeStep(this, session));
    await testWindow2.runCommands(async () => SelectNoneAudioInputStep.executeStep(this, session));

    const compareFn = (actualContent, expectedContent, isMedicalTranscribe) => {
      const nonAlphaNumericAndWhitespace = /[^0-9^a-z^A-Z^\s+]/g
      const actualTokens = actualContent.trim().replace(nonAlphaNumericAndWhitespace, '').toLowerCase().split(/\s+/g);
      const expectedTokens = expectedContent.trim().replace(nonAlphaNumericAndWhitespace, '').toLowerCase().split(/\s+/g);

      // If either is empty, then the other one must be empty to be correct.
      if (actualTokens.length === 0 || expectedTokens.length === 0) {
        return actualTokens.length === expectedTokens.length;
      }

      // Otherwise, compute a naive recall: are expected tokens present in transcripts?
      const total = expectedTokens.length; // > 0
      let hits = 0;
      for (var i = 0; i < expectedTokens.length; i++) {
        if (actualTokens.includes(expectedTokens[i])) {
          hits++;
        }
      }

      const hitPct = 100 * hits / total;
      if (hitPct < 80) {
        console.log(`Need at least 80% of expected tokens in transcript content, got ${hitPct}%. (isMedicalTranscribe == ${isMedicalTranscribe}, actual == "${actualContent}", expected == "${expectedContent}")`);
        return false;
      } else {
        console.log(`Success, ${hitPct}% of expected tokens present in transcripts`);
      }

      return true;
    }

    // Transcribe
    await this.runTranscriptionTest(session, testWindow1, testWindow2, false, testWindow1, testWindow2, testWindow1, attendeeId1, compareFn);

    // Transcribe Medical
    await this.runTranscriptionTest(session, testWindow1, testWindow2, true, testWindow2, testWindow1, testWindow2, attendeeId2, compareFn);

    await this.waitAllSteps();
  }

  async runTranscriptionTest(session, window1, window2, useMedical, startWindow, stopWindow, speakerWindow, speakerAttendeeId, compareFn) {
    // Start
    await startWindow.runCommands(async () => StartMeetingTranscriptionStep.executeStep(this, session, useMedical));
    await TestUtils.waitAround(5000);
    await window1.runCommands(async () => TranscriptionStartedCheck.executeStep(this, session, useMedical));
    await window2.runCommands(async () => TranscriptionStartedCheck.executeStep(this, session, useMedical));

    // Play out the audio file and wait for transcripts to return
    await speakerWindow.runCommands(async () => PlayPrerecordedSpeechStep.executeStep(this, session));
    await TestUtils.waitAround(30000);

    // Validate transcripts
    // Audio and transcript taken from https://millercenter.org/the-presidency/presidential-speeches/november-20-2014-address-nation-immigration.
    const expectedTranscriptContentBySpeaker = {};
    expectedTranscriptContentBySpeaker[speakerAttendeeId] =
      'My fellow Americans, tonight, I\'d like to talk with you about immigration. ' +
      'For more than 200 years, our tradition of welcoming immigrants ' +
      'from around the world has given us a tremendous advantage over other nations. ' +
      'It\'s kept us youthful, dynamic, and entrepreneurial.';

    await window1.runCommands(async () => TranscriptsReceivedCheck.executeStep(this, session, expectedTranscriptContentBySpeaker, useMedical, compareFn));
    await window2.runCommands(async () => TranscriptsReceivedCheck.executeStep(this, session, expectedTranscriptContentBySpeaker, useMedical, compareFn));

    // Stop
    await stopWindow.runCommands(async () => StopMeetingTranscriptionStep.executeStep(this, session));
    await TestUtils.waitAround(5000);
    await window1.runCommands(async () => TranscriptionStoppedCheck.executeStep(this, session, useMedical));
    await window2.runCommands(async () => TranscriptionStoppedCheck.executeStep(this, session, useMedical));
  }
}

module.exports = TranscriptionTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new TranscriptionTest('Meeting transcription test', kiteConfig);
  await test.run();
})();
