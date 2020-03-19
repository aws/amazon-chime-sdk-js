const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep} = require('../steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck} = require('../checks');

class SdkTestUtils {
  static async addUserToMeeting(test, attendee_id, sessionInfo) {
    await OpenAppStep.executeStep(test, sessionInfo);
    await AuthenticateUserStep.executeStep(test, sessionInfo, attendee_id);
    await UserAuthenticationCheck.executeStep(test, sessionInfo);
    await JoinMeetingStep.executeStep(test, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(test, sessionInfo, attendee_id);
  }
}

module.exports.SdkTestUtils = SdkTestUtils;