class Window {
  constructor(webdriver) {
    this.driver = webdriver;
  }

  static async existing(webdriver, name) {
    const w = new Window(webdriver);
    const handles = await w.driver.getAllWindowHandles();
    w.handle = handles[handles.length - 1];
    w.name = name;
    return w;
  }

  static async openNew(webdriver, name) {
    const w = new Window(webdriver);
    await w.driver.executeScript('window.open()');
    const handles = await w.driver.getAllWindowHandles();
    w.handle = handles[handles.length - 1];
    w.name = name;
    return w;
  }

  async runCommands(commands) {
    await this.driver.switchTo().window(this.handle);
    console.log(`----- Running commands on ${this.name} window -----`);
    await commands()
  }

  async close() {
    console.log(`Closing the ${this.name} app`);
    await this.driver.switchTo().window(this.handle);
    await this.driver.close();
  }
}

module.exports.Window = Window;