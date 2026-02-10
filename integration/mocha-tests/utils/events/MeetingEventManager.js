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
   * Sets up event capture by registering an observer in window.pendingEventObserver.
   * The demo will attach this observer to the eventController when it's created.
   * Call this BEFORE authentication to capture all events including those that
   * fire during the auth flow (e.g., videoInputSelected).
   */
  async setupEventCapture() {
    const handle = await this.driver.getWindowHandle();
    if (this.registeredWindowHandles.has(handle)) return;

    const result = await this.driver.executeScript(function () {
      try {
        // Initialize the captured events array
        if (!window.__capturedEvents) window.__capturedEvents = [];
        
        // Create the observer
        const observer = {
          eventDidReceive(name, attributes) {
            window.__capturedEvents.push({ name, attributes, timestamp: Date.now() });
            try { console.log('Event captured:', name, attributes); } catch (_) {}
          }
        };
        
        // Check if eventController already exists
        const s = window.app && window.app.meetingSession;
        const c = s && s.eventController;
        if (c) {
          c.addObserver(observer);
          window.__testEventObserver = observer;
          return { status: 'attached-immediately' };
        }
        
        // Register observer to be attached when meetingSession is created
        window.pendingEventObserver = observer;
        window.__testEventObserver = observer;
        return { status: 'registered-pending' };
      } catch (err) {
        try { console.error('setupEventCapture error:', err); } catch (_) {}
        return { status: 'error', message: String(err.message || err) };
      }
    });

    this.logger.pushLogs(`setupEventCapture -> ${JSON.stringify(result)}`, LogLevel.INFO);
    if (result.status === 'error') {
      throw new Error(`Failed to setup event capture: ${result.message}`);
    }
    this.registeredWindowHandles.add(handle);
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
