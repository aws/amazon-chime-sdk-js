
class RosterCheckConfig {
  constructor(checkCount = 10, waitTimeMs = 2000){
    this.checkCount = checkCount;
    this.waitTimeMs = waitTimeMs;
  }
}

module.exports = RosterCheckConfig;
