const { LogLevel } = require('../Logger');

/**
 * EventValidator validates a list of event objects against an expected set of event names,
 * checks structure and attributes, and enforces standard rules/defaults.
 */
class MeetingEventValidator {
  /**
   * @param {Object} logger - Logger instance to push validation logs.
   */
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Validate a list of events.
   *
   * @param {Array<Object>} eventList - List of event objects to validate.
   * @param {Array<string>} expectedNames - Names of events that must exist.
   * @param {Object} expectedAttributeValues - Additional attribute rules to apply to events.
   * @throws {Error} if unexpected or invalid events are found.
   */
  validateEvents(eventList, expectedNames = [], expectedAttributeValues = {}) {
    const actualNames = new Set(eventList.map(e => e.name));
    const expected = new Set(expectedNames);

    this.logger.pushLogs(
      `Validating events. Got: [${[...actualNames].join(', ')}], Expected: [${[...expected].join(
        ', '
      )}]`,
      LogLevel.INFO
    );

    const unexpected = [...actualNames].filter(x => !expected.has(x));
    if (unexpected.length) throw new Error(`Unexpected: ${unexpected.join(', ')}`);
    const missing = [...expected].filter(x => !actualNames.has(x));
    if (missing.length) throw new Error(`Missing: ${missing.join(', ')}`);

    for (const name of expected) {
      const event = eventList.find(e => e.name === name);
      this.logger.pushLogs(`Checking ${JSON.stringify(event)}`, LogLevel.INFO);
      this.#assertExpectedStructure(event);
      // Asserts global defaults + per-event defaults + caller-specified expectations
      this.#assertAttributes(name, event, expectedAttributeValues);
      this.logger.pushLogs(`${name} passed validation`, LogLevel.SUCCESS);
    }

    this.logger.pushLogs(`All expected events validated successfully`, LogLevel.SUCCESS);
  }

  /**
   * Validate core event structure: timestamp and attributes must exist.
   */
  #assertExpectedStructure(event) {
    if (!event || typeof event.timestamp !== 'number' || typeof event.attributes !== 'object')
      throw new Error(`Malformed event ${JSON.stringify(event)}`);
  }

  /**
   * Apply a set of key:value or key:range rules to the event attributes.
   * Supports:
   *  - exact value equality (e.g., { sdkName: 'amazon-chime-sdk-js' })
   *  - numeric ranges        (e.g., { durationMs: { between: [0, 1000] } })
   *  - RegExp pattern match  (e.g., { attendeeId: /.*\/ } to require presence)
   */

  #assertAttributeExpectations(event, rules = {}) {
    const attributes = event.attributes;
    for (const [k, v] of Object.entries(rules)) {
      if (!(k in attributes)) {
        throw new Error(`${event.name} missing ${k}`);
      }

      const actual = attributes[k];

      if (v && typeof v === 'object' && 'between' in v) {
        const [min, max] = v.between;
        if (typeof actual !== 'number' || actual < min || actual > max) {
          throw new Error(`${event.name}.${k} ${actual} not in [${min},${max}]`);
        }
      } else if (v instanceof RegExp) {
        if (!v.test(String(actual))) {
          throw new Error(`${event.name}.${k} value "${actual}" does not match ${v}`);
        }
      } else {
        if (actual !== v) {
          throw new Error(`${event.name}.${k} expected ${v}, got ${actual}`);
        }
      }
    }
  }

  /**
   * Apply global defaults, event-specific defaults, and caller expectations in one pass.
   */
  #assertAttributes(eventName, event, extraRules = {}) {
    const combined = {
      ...GLOBAL_DEFAULTS,
      ...(EVENT_DEFAULTS[eventName] || {}),
      ...(extraRules || {}),
    };
    this.#assertAttributeExpectations(event, combined);
  }
}

/**
 * Global expectations that apply to all events.
 */
const GLOBAL_DEFAULTS = {
  attendeeId: /.*/,
  meetingId: /.*/,
  browserName: /.*/,
  browserVersion: /.*/,
  sdkName: /^amazon-chime-sdk-js$/,
  sdkVersion: /.*/,
  timestampMs: { between: [1_500_000_000_000, 3_000_000_000_000] },
};

const EVENT_DEFAULTS = {
  videoInputUnselected: {},
  audioInputSelected: {},
  meetingStartRequested: {},

  attendeePresenceReceived: {
    attendeePresenceDurationMs: { between: [0, 60_000] },
  },

  meetingStartSucceeded: {
    meetingStartDurationMs: { between: [0, 30_000] },
    iceGatheringDurationMs: { between: [0, 5_000] },
    signalingOpenDurationMs: { between: [0, 10_000] },
    poorConnectionCount: { between: [0, 1_000] },
    maxVideoTileCount: { between: [0, 25] },
  },

  signalingDropped: {
    meetingDurationMs: { between: [0, 3_600_000] },
    signalingOpenDurationMs: { between: [0, 10_000] },
  },

  meetingReconnected: {
    iceGatheringDurationMs: { between: [0, 5_000] },
    meetingDurationMs: { between: [0, 3_600_000] },
  },

  meetingEnded: {
    meetingDurationMs: { between: [0, 600_000] },
  },
};

module.exports = { MeetingEventValidator };
