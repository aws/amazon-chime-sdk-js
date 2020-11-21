const {By} = require('selenium-webdriver');
const {TestUtils} = require('kite-common');

const elements = {
  userArnInput: By.id('userArn'),
  connectButton: By.id('connect'),
  connectFlow: By.id('flow-connect'),
  disconnectButton: By.id('disconnect'),
  disconnectFlow: By.id('flow-message')
};

class MessagingSessionPage {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
  }

  async open(stepInfo) {
    await TestUtils.open(stepInfo);
  }

  async close(stepInfo) {
    await stepInfo.driver.close();
  }

  async enterUserArn(userArn) {
    let userArnInputBox = await this.driver.findElement(elements.userArnInput);
    await userArnInputBox.clear();
    await userArnInputBox.sendKeys(userArn);
  }

  async connect() {
    let connectButton = await this.driver.findElement(elements.connectButton);
    await connectButton.click();
  }

  async waitForConnection() {
    let timeout = 10;
    let i = 0;
    let connecting = true;
    while (connecting && i < timeout) {
      connecting = await this.isConnecting();
      if (connecting === false) {
        return 'done'
      }
      i++;
      await TestUtils.waitAround(1000);
    }
    return 'failed'
  }

  async isConnecting() {
    return await this.driver.findElement(elements.connectFlow).isDisplayed();
  }

  async disconnect() {
    let disconnectButton = await this.driver.findElement(elements.disconnectButton);
    await disconnectButton.click();
  }

  async waitForDisconnection() {
    let timeout = 10;
    let i = 0;
    let isDisconnecting = true;
    while (isDisconnecting && i < timeout) {
      isDisconnecting = await this.isDisconnecting();
      if (isDisconnecting === false) {
        return 'done'
      }
      i++;
      await TestUtils.waitAround(1000);
    }
    return 'failed'
  }

  async isDisconnecting() {
    return await this.driver.findElement(elements.disconnectFlow).isDisplayed();
  }

  async checkMessageTypeExist(messageType) {
    const messageTypeDiv = await this.driver.findElement(By.xpath(`//div[@id='messages']//*[text() = '${messageType}']`));
    return messageTypeDiv? true: false;
  }
}

module.exports = MessagingSessionPage;