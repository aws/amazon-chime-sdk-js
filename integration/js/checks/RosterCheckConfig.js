
class RosterCheckConfig {
  constructor(checkCount = 10, waitTimeMs = 100){
    this.checkCount = checkCount;
    this.waitTimeMs = waitTimeMs;
  }
}

module.exports = RosterCheckConfig;
