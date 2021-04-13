
class RosterCheckConfig {
  constructor(checkCount = 10, waitTimeMs = 1000){
    this.checkCount = checkCount;
    this.waitTimeMs = waitTimeMs;
  }
}

module.exports = RosterCheckConfig;
