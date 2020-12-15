const {WebDriverFactory} = require('../node_modules/kite-common');
const {AppPage, TestAppPage} = require('../pages');
const {MeetingReadinessCheckerPage} = require('../pages/MeetingReadinessCheckerPage');
const { MessagingSessionPage } = require('../pages/MessagingSessionPage');

class LocalSession {
  static async createSession(capabilities, remoteUrl, appName) {
    const driver = await WebDriverFactory.getDriver(capabilities, remoteUrl);
    return new LocalSession(driver, appName);
  }

  constructor(driver, appName) {
    this.driver = driver;
    this.appName = appName;
  }

  async init() {
    this.name = "";
    this.logger = (message) => {
      const prefix = this.name === "" ? "" : `[${this.name} App] `;
      console.log(`${prefix}${message}`)
    };
    this.getAppPage();
  }

  getAppPage() {
    if (this.page === undefined) {
      switch (this.appName) {
        case 'meetingReadinessChecker':
          this.page = new MeetingReadinessCheckerPage(this.driver, this.logger);
          break;
        case 'messagingSession':
          this.page = new MessagingSessionPage(this.driver, this.logger);
          break;
        case 'testApp':
          this.page = new TestAppPage(this.driver, this.logger);
          break;
        default:
          this.page = new AppPage(this.driver, this.logger);
          break;
      }
    }
  }

  async updateTestResults(passed) {
    //Not needed
    return;
  };

  async printRunDetails() {
    //Not needed
    return;
  }

  async quit() {
    await this.driver.quit();
  }
}

module.exports.LocalSession = LocalSession;