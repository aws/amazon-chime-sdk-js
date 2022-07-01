// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const support_js_1 = require("./support.js");
const types_js_1 = require("./types.js");
const CPU_WARNING_MAX_INTERVAL_MS = 5 * 1000;
class VoiceFocusInlineNode extends types_js_1.VoiceFocusAudioWorkletNode {
    constructor(context, options) {
        super(context, options.processor, options);
        this.cpuWarningCount = 0;
        this.channelCountMode = 'explicit';
        this.channelCount = 1;
        const { modelURL, worker, fetchBehavior, logger, delegate, } = options;
        this.logger = logger;
        this.port.onmessage = this.onProcessorMessage.bind(this);
        this.delegate = delegate;
        if (logger)
            logger.debug('VoiceFocusInlineNode:', modelURL);
        this.worker = worker;
        this.worker.onmessage = this.onWorkerMessage.bind(this);
        const message = support_js_1.supportsWASMPostMessage(globalThis) ? 'get-module' : 'get-module-buffer';
        this.worker.postMessage({
            message,
            key: 'model',
            fetchBehavior,
            path: modelURL,
        });
    }
    onModuleBufferLoaded(buffer, key) {
        this.port.postMessage({ message: 'module-buffer', buffer, key });
    }
    onModuleLoaded(module, key) {
        this.port.postMessage({ message: 'module', module, key });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.port.postMessage({ message: 'enable' });
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.port.postMessage({ message: 'disable' });
        });
    }
    stop() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.port.postMessage({ message: 'stop' });
            try {
                (_a = this.worker) === null || _a === void 0 ? void 0 : _a.terminate();
            }
            catch (e) {
                console.error("failed to terminate worker:", e);
            }
            this.disconnect();
        });
    }
    onProcessorMessage(event) {
        var _a, _b, _c;
        const data = event.data;
        switch (data.message) {
            case 'cpu':
                this.cpuWarningCount++;
                const now = Date.now();
                const before = this.cpuWarningLastTriggered || now;
                const diff = Math.abs(now - before);
                if (!this.cpuWarningLastTriggered || diff > CPU_WARNING_MAX_INTERVAL_MS) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`CPU warning (count: ${this.cpuWarningCount}):`, data.message);
                    this.cpuWarningCount = 0;
                    this.cpuWarningLastTriggered = now;
                }
                (_b = this.delegate) === null || _b === void 0 ? void 0 : _b.onCPUWarning();
                break;
            default:
                (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug('Ignoring processor message.');
        }
    }
    onWorkerMessage(event) {
        const data = event.data;
        switch (data.message) {
            case 'module-buffer':
                if (!data.buffer || !data.key) {
                    return;
                }
                this.onModuleBufferLoaded(data.buffer, data.key);
                break;
            case 'module':
                if (!data.module || !data.key) {
                    return;
                }
                this.onModuleLoaded(data.module, data.key);
                break;
            case 'stopped':
                if (this.worker) {
                    this.worker.terminate();
                }
                break;
            default:
                return;
        }
    }
}
exports.default = VoiceFocusInlineNode;
