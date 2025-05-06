const { Logger, LogLevel } = require('./Logger');

/**
 * Determines the appropriate number of sessions based on environment variables
 * or client configuration
 * @param {Object} client - Client configuration object
 * @param {Logger} logger - Logger instance
 * @returns {number} - Number of sessions to use (1 or 2)
 */
function determineSessionCount(client, logger) {
  const log = logger || new Logger('ClientHelper');
  
  // Check if explicitly set via command line
  if (process.env.NUMBER_OF_SESSIONS) {
    const numberOfSessions = parseInt(process.env.NUMBER_OF_SESSIONS, 10);
    log.log(`Using ${numberOfSessions} sessions as specified by command line`, LogLevel.INFO);
    return numberOfSessions;
  }

  // Auto-determine based on platform/browser
  if (client) {
    // Safari and mobile platforms typically need 2 sessions
    if (client.browserName === 'safari' || 
        client.platform === 'android' || 
        client.platform === 'ios' ||
        client.platform === 'IOS' ||
        client.platform === 'ANDROID') {
      log.log(`Using 2 sessions for ${client.browserName} on ${client.platform}`, LogLevel.INFO);
      return 2;
    }
  }

  // Default to 1 session
  log.log('Using default of 1 session', LogLevel.INFO);
  return 1;
}

module.exports = {
  determineSessionCount
};
