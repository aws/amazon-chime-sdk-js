const {WebDriverFactory} = require('../node_modules/kite-common');
const {AppPage} = require('../pages/AppPage');
const {MeetingReadinessCheckerPage} = require('../pages/MeetingReadinessCheckerPage');

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
      this.page = this.appName === 'meeting'
        ? new AppPage(this.driver, this.logger)
        : new MeetingReadinessCheckerPage(this.driver, this.logger);
    }
    return this.page;
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