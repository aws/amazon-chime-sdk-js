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
class VoiceFocusInlineNode extends types_js_1.VoiceFocusAudioWorkletNode {
    constructor(context, options) {
        super(context, options.processor, options);
        const { modelURL, worker, fetchBehavior, logger, } = options;
        this.logger = logger;
        this.port.onmessage = this.onProcessorMessage.bind(this);
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
        return __awaiter(this, void 0, void 0, function* () {
            this.port.postMessage({ message: 'stop' });
            this.disconnect();
        });
    }
    onProcessorMessage(event) {
        var _a;
        const data = event.data;
        switch (data.message) {
            case 'cpu':
                break;
            default:
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('Ignoring processor message.');
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
