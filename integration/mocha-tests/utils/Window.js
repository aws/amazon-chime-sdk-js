const { LogLevel } = require('./Logger');

class Window {
  constructor(webdriver, logger) {
    this.driver = webdriver;
    this.logger = logger;
  }

  static async existing(webdriver, logger, name) {
    const w = new Window(webdriver, logger);
    const handles = await w.driver.getAllWindowHandles();
    w.handle = handles[handles.length - 1];
    w.name = name;
    return w;
  }

  static async openNew(webdriver, logger, name) {
    const w = new Window(webdriver, logger);
    await w.driver.executeScript('window.open()');
    const handles = await w.driver.getAllWindowHandles();
    w.handle = handles[handles.length - 1];
    w.name = name;
    return w;
  }

  async runCommands(commands) {
    await this.driver.switchTo().window(this.handle);
    try {
      await commands();
    } catch (error) {
      this.logger.pushLogs(`${error}`, LogLevel.ERROR);
      throw new Error(error);
    }
  }

  async close() {
    await this.driver.switchTo().window(this.handle);
    await this.driver.close();
  }
}

module.exports.Window = Window;
