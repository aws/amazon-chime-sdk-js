const {OpenAppStep, JoinMeetingStep, AuthenticateUserStep} = require('../steps');
const {UserJoinedMeetingCheck, UserAuthenticationCheck} = require('../checks');

class SdkTestUtils {
  static async addUserToMeeting(test, attendee_id, sessionInfo, region='') {
    await OpenAppStep.executeStep(test, sessionInfo);
    await AuthenticateUserStep.executeStep(test, sessionInfo, attendee_id, region);
    await UserAuthenticationCheck.executeStep(test, sessionInfo);
    await JoinMeetingStep.executeStep(test, sessionInfo);
    await UserJoinedMeetingCheck.executeStep(test, sessionInfo, attendee_id);
  }
}

module.exports.SdkTestUtils = SdkTestUtils;