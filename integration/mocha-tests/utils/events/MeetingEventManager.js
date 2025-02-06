// Copyright Amazon.com, Inc. or its affiliates.
// SPDX-License-Identifier: Apache-2.0

const { LogLevel } = require('../Logger');
const { MeetingEventValidator } = require('./MeetingEventValidator');

/**
 * MeetingEventManager sets up one event observer per tab,
 * fetches events from the browser page, and validates them.
 * After each validation, it clears events so the next check starts clean.
 */
class MeetingEventManager {
  constructor(driver, logger) {
    this.driver = driver;
    this.logger = logger;
    this.registeredWindowHandles = new Set();
    this.localEvents = []; // simple in-memory buffer
  }

  /**
   * Injects an observer into the page for this tab if not already present.
   */
  async setupEventCapture() {
    const handle = await this.driver.getWindowHandle();
    if (this.registeredWindowHandles.has(handle)) return;

    for (let i = 0; i < 10; i++) {
      if (await this.#isMeetingSessionReady()) break;
      if (i === 9) throw new Error('meetingSession not ready');
      await new Promise(r => setTimeout(r, 1000));
    }

    const result = await this.driver.executeScript(function () {
      try {
        const s = window.app && window.app.meetingSession;
        const c = s && s.eventController;
        if (!c) return { status: 'not-ready' };
        if (!window.__capturedEvents) window.__capturedEvents = [];
        if (!window.__testEventObserver) {
          window.__testEventObserver = {
            eventDidReceive(name, attributes) {
              window.__capturedEvents.push({ name, attributes, timestamp: Date.now() });
              try { console.log('Event captured:', name, attributes); } catch (_) {}
            }
          };
          c.addObserver(window.__testEventObserver);
          return { status: 'ok' };
        }
        return { status: 'already' };
      } catch (err) {
        try { console.error('setupEventCapture error:', err); } catch (_) {}
        return { status: 'error', message: String(err.message || err) };
      }
    });

    this.logger.pushLogs(`setupEventCapture -> ${JSON.stringify(result)}`, LogLevel.INFO);
    if (result.status === 'ok' || result.status === 'already') {
      this.registeredWindowHandles.add(handle);
    } else {
      throw new Error(`Failed to register event observer: ${JSON.stringify(result)}`);
    }
  }

  /**
   * Validate that the events seen since the last call match exactly the expected set.
   * Optionally wait up to timeoutMs for missing expected events before validating.
   * `ignoredEvents` can contain events that may appear but won’t cause failure.
   */
  async validateEvents(
    expectedEventNames = [],
    ignoredEvents = [],
    expectedAttributes= {},
    timeoutMs = 10000,
  ) {
    const start = performance.now();
    const deadline = start + timeoutMs;

    await this.#syncCapturedEvents();
    let have = new Set(this.localEvents.map(e => e.name));
    this.logger.pushLogs(
      `Validating events. Have: ${JSON.stringify([...have])} | Expected: ${JSON.stringify(expectedEventNames)}`,
      LogLevel.INFO
    );
    this.logger.pushLogs(`timeoutMs ${timeoutMs}`, LogLevel.INFO);

    let loggedWait = false;
    while (
      timeoutMs &&
      performance.now() < deadline &&
      !expectedEventNames.every(x => have.has(x))
    ) {
      const remaining = Math.max(0, deadline - performance.now());
      if (!loggedWait) {
        this.logger.pushLogs(
          `Waiting up to ${timeoutMs}ms for events. Have: ${JSON.stringify([...have])} | Expected: ${JSON.stringify(expectedEventNames)}`,
          LogLevel.INFO
        );
        loggedWait = true;
      }

      await new Promise(r => setTimeout(r, Math.min(250, remaining)));
      await this.#syncCapturedEvents();
      have = new Set(this.localEvents.map(e => e.name));
    }

    // Filter out ignored events from localEvents before validation
    const filteredEvents = this.localEvents.filter(e => !ignoredEvents.includes(e.name));
    const results = new MeetingEventValidator(this.logger).validateEvents(
      filteredEvents,
      expectedEventNames,
      expectedAttributes,
    );

    // Reset buffers for next call
    this.localEvents = [];
    await this.#clearBrowserEvents();

    if (loggedWait) {
      this.logger.pushLogs(`Validation complete after waiting.`, LogLevel.INFO);
    }

    return results;
  }

  async #isMeetingSessionReady() {
    try {
      return await this.driver.executeScript(function () {
        return !!(window.app &&
                  window.app.meetingSession &&
                  window.app.meetingSession.eventController);
      });
    } catch (err) {
      this.logger.pushLogs(`Error checking meeting session: ${err.message}`, LogLevel.ERROR);
      return false;
    }
  }

  async #syncCapturedEvents() {
    const handle = await this.driver.getWindowHandle();
    if (!this.registeredWindowHandles.has(handle)) return;

    let captured = [];
    try {
      captured = await this.driver.executeScript(function () {
        try {
          const list = Array.isArray(window.__capturedEvents) ? window.__capturedEvents.slice() : [];
          window.__capturedEvents = [];
          return list;
        } catch (e) {
          try { console.error('syncCapturedEvents page error:', e); } catch (_) {}
          return [];
        }
      });
    } catch (err) {
      throw new Error(`syncCapturedEvents executeScript failed: ${err.message || err}`);
    }

    if (!Array.isArray(captured)) {
      this.logger.pushLogs(`Expected array from page, got: ${JSON.stringify(captured)}`, LogLevel.WARN);
      captured = [];
    }

    this.localEvents.push(...captured);
    if (captured.length) this.logger.pushLogs(`Synced ${captured.length} events`, LogLevel.INFO);
  }

  async #clearBrowserEvents() {
    await this.driver.executeScript(function () { window.__capturedEvents = []; });
  }
}

module.exports = { MeetingEventManager };
