class SdkBaseTest {
  constructor() {
    const test = JSON.parse(process.env.TEST);
    const client = JSON.parse(process.env.CLIENT);
    const host = process.env.HOST;
    const testType = process.env.TEST_TYPE;

    this.testName = test.name;
    if (client.platform == 'IOS' || client.platform == 'ANDROID') {
      this.testName = this.testName.concat('Mobile');
    }
    this.host = host;
    this.testType = testType;

    if (host === 'local') {
      this.url = 'http://127.0.0.1:8080/';
    } else if (host === 'saucelabs' || host === 'devicefarm') {
      this.url = process.env.TEST_URL;
    }

    if (client.browserName === 'safari') {
      if (client.platform === 'MAC') {
        client.platform = 'macOS 12';
      } else {
        client.platform = 'macOS 10.13';
      }
      process.env.PLATFORM_NAME = client.platform;

      client.browserVersion = '15';
      process.env.BROWSER_VERSION = client.browserVersion;
    }

    let urlParams = [];
    if (client.browserName === 'safari') {
      urlParams.push('earlyConnect=1');
    }
    urlParams.push('attendee-presence-timeout-ms=5000');
    urlParams.push('fatal=1');
    for (let i = 0; i < urlParams.length; i++) {
      if (i == 0) {
        this.url = this.url.concat(`?${urlParams[i]}`);
      }
      this.url = this.url.concat(`&${urlParams[i]}`);
    }
  }
}

module.exports = SdkBaseTest;
