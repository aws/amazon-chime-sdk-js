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
class VoiceFocusWorkerPostMessageNode extends types_js_1.VoiceFocusAudioWorkletNode {
    constructor(context, options) {
        super(context, options.processor, options);
        const { modelURL, audioBufferURL, worker, fetchBehavior, delegate, } = options;
        this.delegate = delegate;
        this.worker = worker;
        this.worker.onmessage = this.onWorkerMessage.bind(this);
        this.port.onmessage = this.onProcessorMessage.bind(this);
        this.worker.postMessage({
            message: 'init',
            approach: 'postMessage',
            frames: context.sampleRate === 16000 ? 160 : 480,
            enabled: options.processorOptions.enabled,
            agc: options.processorOptions.agc,
            fetchBehavior,
            model: modelURL,
        });
        const message = support_js_1.supportsWASMPostMessage(globalThis) ? 'get-module' : 'get-module-buffer';
        this.worker.postMessage({
            message,
            key: 'buffer',
            fetchBehavior,
            path: audioBufferURL,
        });
    }
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.worker.postMessage({ message: 'enable' });
        });
    }
    disable() {
        return __awaiter(this, void 0, void 0, function* () {
            this.worker.postMessage({ message: 'disable' });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.worker.postMessage({ message: 'stop' });
            }
            catch (e) {
            }
            this.disconnect();
        });
    }
    onWorkerMessage(event) {
        var _a;
        const data = event.data;
        switch (data.message) {
            case 'ready':
                this.port.postMessage({ message: 'ready', shared: data.shared }, data.shared ? Object.values(data.shared) : []);
                break;
            case 'data':
                if (!data.buffer) {
                    return;
                }
                this.port.postMessage({ message: 'data', buffer: data.buffer }, [data.buffer]);
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
            case 'data':
                if (!data.buffer) {
                    return;
                }
                this.worker.postMessage({ message: 'data', buffer: data.buffer }, [data.buffer]);
                break;
            case 'cpu':
                (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.onCPUWarning();
                break;
            case 'prepare-for-frames':
                this.worker.postMessage(data);
                break;
            default:
                return;
        }
    }
}
exports.default = VoiceFocusWorkerPostMessageNode;
