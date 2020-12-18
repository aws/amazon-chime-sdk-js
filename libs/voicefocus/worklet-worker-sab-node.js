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
const INDICES = {
    ready: 0,
    enabled: 1,
};
const STATES = {
    disabled: 0,
    enabled: 1,
    stopped: 2,
};
class VoiceFocusWorkerBufferNode extends types_js_1.VoiceFocusAudioWorkletNode {
    constructor(context, options) {
        super(context, options.processor, options);
        const { modelURL, resamplerURL, worker, fetchBehavior, delegate, } = options;
        this.delegate = delegate;
        this.worker = worker;
        this.worker.onmessage = this.onWorkerMessage.bind(this);
        this.port.onmessage = this.onProcessorMessage.bind(this);
        this.worker.postMessage({
            message: 'init',
            approach: 'sab',
            frames: context.sampleRate === 16000 ? 160 : 480,
            enabled: options.processorOptions.enabled,
            model: modelURL,
        });
        const message = support_js_1.supportsWASMPostMessage(globalThis) ? 'get-module' : 'get-module-buffer';
        this.worker.postMessage({
            message,
            key: 'resampler',
            fetchBehavior,
            path: resamplerURL,
        });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state) {
                Atomics.store(this.state, INDICES.enabled, STATES.enabled);
                Atomics.notify(this.state, INDICES.ready, 1);
            }
            else {
                this.worker.postMessage({ message: 'enable' });
            }
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state) {
                Atomics.store(this.state, INDICES.enabled, STATES.disabled);
                Atomics.notify(this.state, INDICES.ready, 1);
            }
            else {
                this.worker.postMessage({ message: 'disable' });
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state) {
                Atomics.store(this.state, INDICES.enabled, STATES.stopped);
                Atomics.notify(this.state, INDICES.ready, 1);
            }
            else {
                try {
                    this.worker.postMessage({ message: 'stop' });
                }
                catch (e) {
                }
            }
            this.disconnect();
        });
    }
    onWorkerMessage(event) {
        var _a;
        const data = event.data;
        switch (data.message) {
            case 'ready':
                if (!data.shared) {
                    throw new Error('No shared state.');
                }
                this.state = new Int32Array(data.shared.state);
                this.port.postMessage(data);
                break;
            case 'stopped':
                this.worker.terminate();
                break;
            case 'module-buffer':
            case 'module':
                this.port.postMessage(data);
                break;
            case 'cpu':
                (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.onCPUWarning();
                break;
            case 'processing':
                this.port.postMessage(data);
                break;
            default:
                return;
        }
    }
    onProcessorMessage(event) {
        var _a;
        const data = event.data;
        switch (data.message) {
            case 'cpu':
                (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.onCPUWarning();
                break;
            case 'prepare-for-frames':
                this.worker.postMessage(data);
                break;
            default:
        }
    }
}
exports.default = VoiceFocusWorkerBufferNode;
