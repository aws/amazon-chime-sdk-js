const { Command } = require('selenium-webdriver/lib/command');

/**
 * Provides Chrome/Edge (Chromium) network emulation via the WebDriver CDP bridge.
 */
class NetworkEmulationController {
  /**
   * @param {import('selenium-webdriver').ThenableWebDriver} driver - Selenium WebDriver instance.
   * @param {{pushLogs: (msg: string) => void}} logger
   */
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
    this._cdpCommandDefined = false;
    this._networkDomainEnabled = false;
  }

  /**
   * One-time setup helper: creates, initializes, and returns a ready controller.
   * @param {import('selenium-webdriver').ThenableWebDriver} driver
   * @param {{pushLogs: (msg: string) => void}} logger
   * @returns {Promise<NetworkEmulationController>}
   */
  static async setup(driver, logger) {
    const controller = new NetworkEmulationController(driver, logger);
    await controller._initialize();
    return controller;
  }

  /**
   * Emulate full offline (new requests fail).
   * @returns {Promise<any>}
   */
  async offline() {
    await this._ensureReady();
    return this._sendCdpCommand('Network.emulateNetworkConditions', {
      offline: true,
      latency: 10000,
      downloadThroughput: 1,
      uploadThroughput: 1,
      packetLoss: 0,
    });
  }

  /**
   * Restore online with generous throughput.
   * @returns {Promise<any>}
   */
  async online() {
    await this._ensureReady();
    return this._sendCdpCommand('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      // Using -1 removes the network emulation and will not allow us to add
      // restrictions later.
      downloadThroughput: 10_000,
      uploadThroughput: 10_000,
      packetLoss: 0,
      packetQueueLength: 0,
      packetReordering: false,
    });
  }

  /**
   * Internal: define the CDP bridge and enable Network domain.
   * @private
   */
  async _initialize() {
    const capabilities = await this.driver.getCapabilities();
    const browserName = (capabilities.get('browserName') || '').toLowerCase();
    if (!/chrome|edge/.test(browserName)) {
      throw new Error(`Network emulation requires Chromium; got "${browserName}"`);
    }

    this.driver.getExecutor().defineCommand(
      'cdp',
      'POST',
      '/session/:sessionId/chromium/send_command_and_get_result'
    );
    this._cdpCommandDefined = true;

    await this._sendCdpCommand('Network.enable');
    this._networkDomainEnabled = true;

    // We must explicitly enable the network emulation before any connections are made otherwise we will
    // not be able to throttle later.
    await this.online();
  }

  /**
   * Internal: ensure CDP bridge and Network domain are ready.
   * @private
   */
  async _ensureReady() {
    if (!this._cdpCommandDefined || !this._networkDomainEnabled) {
      await this._initialize();
    }
  }

  /**
   * Internal: send a raw CDP command via Selenium's Chromium bridge.
   * @param {string} commandName - e.g., 'Network.emulateNetworkConditions'
   * @param {Object} parameters - CDP parameters object
   * @returns {Promise<any>} - The CDP result payload.
   * @private
   */
  async _sendCdpCommand(commandName, parameters = {}) {
    const command = new Command('cdp')
      .setParameter('cmd', commandName)
      .setParameter('params', parameters);

    const result = await this.driver.execute(command);
    this.logger.pushLogs(
      `[NetworkEmulationController] ${commandName} ${JSON.stringify(parameters)} returned ${JSON.stringify(result)}`
    );
    return result;
  }
}

module.exports = NetworkEmulationController;
