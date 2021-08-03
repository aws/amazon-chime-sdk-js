const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep, StartMeetingTranscriptionStep, StopMeetingTranscriptionStep, PlayPrerecordedSpeechStep, SelectNoneAudioInputStep} = require('./steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck, RosterCheck, TranscriptionStartedCheck, TranscriptionStoppedCheck, TranscriptsReceivedCheck} = require('./checks');
const {TestUtils} = require('kite-common');
const SdkBaseTest = require('./utils/SdkBaseTest');
const { v4: uuidv4 } = require('uuid');

class TranscriptionTest extends SdkBaseTest {
  constructor(name, kiteConfig) {
    super(name, kiteConfig, 'Transcription');
  }

  async runIntegrationTest() {
    this.numberOfParticipant = 2;

    const session1 = this.seleniumSessions[0];
    const session2 = this.seleniumSessions[1];

    const attendeeId1 = uuidv4();
    const attendeeId2 = uuidv4();

    await this.addUserToMeeting(attendeeId1, session1);
    await this.addUserToMeeting(attendeeId2, session2);
    await this.checkRoster(session1, session2, 2);

    await this.selectNoneAudioInput(session1, session2);

    const compareFn = (actualContent, expectedContent) => {
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
        console.log(`Need at least 80% of expected tokens in transcript content, got ${hitPct}%. (actual == "${actualContent}", expected == "${expectedContent}")`);
        return false;
      } else {
        console.log(`Success, ${hitPct}% of expected tokens present in transcripts`);
      }

      return true;
    }

    // Transcribe
    await this.runTranscriptionTest(session1, session2, false, session1, session2, session1, attendeeId1, compareFn);

    // Transcribe Medical
    await this.runTranscriptionTest(session1, session2, true, session2, session1, session2, attendeeId2, compareFn);

    await this.waitAllSteps();
  }

  async runTranscriptionTest(session1, session2, useMedical, startSession, stopSession, speakerSession, speakerAttendeeId, compareFn) {
    // Start
    await StartMeetingTranscriptionStep.executeStep(this, startSession, useMedical);
    await TestUtils.waitAround(5000);
    await this.checkTranscriptionStarted(session1, session2, useMedical);

    // Play out the audio file and wait for transcripts to return
    await PlayPrerecordedSpeechStep.executeStep(this, speakerSession);
    await TestUtils.waitAround(25000);

    // Validate transcripts
    // Audio and transcript taken from https://millercenter.org/the-presidency/presidential-speeches/november-20-2014-address-nation-immigration.
    const expectedTranscriptContentBySpeaker = {};
    expectedTranscriptContentBySpeaker[speakerAttendeeId] =
      'My fellow Americans, tonight, I’d like to talk with you about immigration. ' +
      'For more than 200 years, our tradition of welcoming immigrants ' +
      'from around the world has given us a tremendous advantage over other nations. ' +
      'It’s kept us youthful, dynamic, and entrepreneurial.';
    this.checkTranscriptsReceived(session1, session2, expectedTranscriptContentBySpeaker, compareFn);

    // Stop
    await StopMeetingTranscriptionStep.executeStep(this, stopSession);
    await TestUtils.waitAround(5000);
    await this.checkTranscriptionStopped(session1, session2, useMedical);
  }

  async addUserToMeeting(attendee_id, sessionInfo) {
    await OpenAppStep.executeStep(this, sessionInfo);
    await AuthenticateUserStep.executeStep(this, sessionInfo, attendee_id);
    await UserAuthenticationCheck.executeStep(this, sessionInfo);
    await JoinMeetingStep.executeStep(this, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(this, sessionInfo, attendee_id);
  }

  async checkRoster(session1, session2, numAttendees) {
    await Promise.all([
      RosterCheck.executeStep(this, session1, numAttendees),
      RosterCheck.executeStep(this, session2, numAttendees)
    ]);
  }

  async checkTranscriptionStarted(session1, session2, useMedical) {
    await Promise.all([
      TranscriptionStartedCheck.executeStep(this, session1, useMedical),
      TranscriptionStartedCheck.executeStep(this, session2, useMedical)
    ]);
  }

  async checkTranscriptionStopped(session1, session2, useMedical) {
    await Promise.all([
      TranscriptionStoppedCheck.executeStep(this, session1, useMedical),
      TranscriptionStoppedCheck.executeStep(this, session2, useMedical)
    ]);
  }

  async checkTranscriptsReceived(session1, session2, expectedTranscripts, compareFn) {
    await Promise.all([
      TranscriptsReceivedCheck.executeStep(this, session1, expectedTranscripts, compareFn),
      TranscriptsReceivedCheck.executeStep(this, session2, expectedTranscripts, compareFn)
    ]);
  }

  async selectNoneAudioInput(session1, session2) {
    await Promise.all([
      SelectNoneAudioInputStep.executeStep(this, session1),
      SelectNoneAudioInputStep.executeStep(this, session2)
    ]);
  }
}

module.exports = TranscriptionTest;

(async () => {
  const kiteConfig = await TestUtils.getKiteConfig(__dirname);
  let test = new TranscriptionTest('Meeting transcription test', kiteConfig);
  await test.run();
})();
