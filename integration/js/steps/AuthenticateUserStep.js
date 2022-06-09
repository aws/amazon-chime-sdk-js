const {KiteTestError, Status} = require('kite-common');
const AppTestStep = require('../utils/AppTestStep');

class AuthenticateUserStep extends AppTestStep {
  constructor(
    kiteBaseTest,
    sessionInfo,
    attendee_id,
    useSimulcastFlag = false,
    useWebAudioFlag = false,
    enableEventReporting = false,
    region = '',
    useStereoMusicAudioProfile = false,
  ) {
    super(kiteBaseTest, sessionInfo);
    this.attendee_id = attendee_id;
    this.useSimulcastFlag = useSimulcastFlag;
    this.useWebAudioFlag = useWebAudioFlag;
    this.enableEventReporting = enableEventReporting;
    this.region = region;
    this.useStereoMusicAudioProfile = useStereoMusicAudioProfile;
  }

  static async executeStep(
    KiteBaseTest,
    sessionInfo,
    attendee_id,
    useSimulcastFlag = false,
    useWebAudioFlag = false,
    enableEventReporting = false,
    region = '',
    useStereoMusicAudioProfile = false,
  ) {
    const step = new AuthenticateUserStep(
      KiteBaseTest,
      sessionInfo,
      attendee_id,
      useSimulcastFlag,
      useWebAudioFlag,
      enableEventReporting,
      region,
      useStereoMusicAudioProfile
    );
    await step.execute(KiteBaseTest);
  }

  stepDescription() {
    return 'Authenticating user';
  }

  metricName() {
    return 'UserAuthenticationStep'
  }

  async run() {
    this.logger("attendee id: " + this.attendee_id);
    await this.page.enterAttendeeName(this.attendee_id);
    await this.page.openAdditionalOptions();
    if (this.useSimulcastFlag) {
      this.logger("choose to use simulcast");
      await this.page.chooseUseSimulcast();
    }
    if (this.useWebAudioFlag) {
      this.logger("choose to use Web Audio");
      await this.page.chooseUseWebAudio();
    }
    if (this.enableEventReporting) {
      this.logger("Event reporting enabled");
      await this.page.chooseEnableEventReporting();
    }
    if (this.region !== '') {
      this.logger(`selecting region ${this.region}`);
      await this.page.selectRegion(this.region);
    }
    if (this.useStereoMusicAudioProfile) {
      this.logger("Using stereo music audio profile");
      await this.page.chooseStereoMusicAudioProfile();
    }
    await this.page.closeAdditionalOptions();

    await this.page.authenticate();
    this.logger("waiting to authenticate");
    let authenticationState = await this.page.waitForDeviceFlow();
    if (authenticationState === 'failed') {
      throw new KiteTestError(Status.FAILED, 'Authentication timeout');
    }
  }
}

module.exports = AuthenticateUserStep;
