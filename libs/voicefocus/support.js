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
exports.isOldChrome = exports.supportsWASMStreaming = exports.supportsSharedArrayBuffer = exports.supportsWASM = exports.supportsAudioWorklet = exports.supportsWorker = exports.supportsVoiceFocusWorker = exports.supportsWASMPostMessage = exports.isSafari = void 0;
const loader_js_1 = require("./loader.js");
const isChrome = (global = globalThis) => {
    const ua = global.navigator.userAgent;
    return !!ua.match(/Chrom(?:e|ium)\/([0-9]+)/);
};
const isSafari = (global = globalThis) => {
    const ua = global.navigator.userAgent;
    const hasSafari = ua.match(/Safari\//);
    const hasChrome = ua.match(/Chrom(?:e|ium)\//);
    return !!(hasSafari && !hasChrome);
};
exports.isSafari = isSafari;
const supportsWASMPostMessage = (global = globalThis) => {
    if ((0, exports.isSafari)(global)) {
        return false;
    }
    if (isChrome(global)) {
        const version = chromeVersion(global) || 0;
        return version < 95;
    }
    return true;
};
exports.supportsWASMPostMessage = supportsWASMPostMessage;
const supportsVoiceFocusWorker = (scope = globalThis, fetchConfig, logger) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, exports.supportsWorker)(scope, logger)) {
        return false;
    }
    const workerURL = `${fetchConfig.paths.workers}worker-v1.js`;
    try {
        const worker = yield (0, loader_js_1.loadWorker)(workerURL, 'VoiceFocusTestWorker', fetchConfig, logger);
        try {
            worker.terminate();
        }
        catch (e) {
            logger === null || logger === void 0 ? void 0 : logger.debug('Failed to terminate worker.', e);
        }
        return true;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Failed to fetch and instantiate test worker', e);
        return false;
    }
});
exports.supportsVoiceFocusWorker = supportsVoiceFocusWorker;
const supportsWorker = (scope = globalThis, logger) => {
    try {
        return !!scope.Worker;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Does not support Worker', e);
        return false;
    }
};
exports.supportsWorker = supportsWorker;
const supportsAudioWorklet = (scope = globalThis, logger) => {
    try {
        return !!scope.AudioWorklet && !!scope.AudioWorkletNode;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Does not support Audio Worklet', e);
        return false;
    }
};
exports.supportsAudioWorklet = supportsAudioWorklet;
const supportsWASM = (scope = globalThis, logger) => {
    try {
        return !!scope.WebAssembly && (!!scope.WebAssembly.compile || !!scope.WebAssembly.compileStreaming);
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Does not support WASM', e);
        return false;
    }
};
exports.supportsWASM = supportsWASM;
const supportsSharedArrayBuffer = (scope = globalThis, window = globalThis, logger) => {
    try {
        return !!scope.SharedArrayBuffer && (!!window.chrome || !!scope.crossOriginIsolated);
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Does not support SharedArrayBuffer.');
        return false;
    }
};
exports.supportsSharedArrayBuffer = supportsSharedArrayBuffer;
const supportsWASMStreaming = (scope = globalThis, logger) => {
    var _a;
    try {
        return !!((_a = scope.WebAssembly) === null || _a === void 0 ? void 0 : _a.compileStreaming);
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.info('Does not support WASM streaming compilation', e);
        return false;
    }
};
exports.supportsWASMStreaming = supportsWASMStreaming;
const SUPPORTED_CHROME_VERSION = 90;
const chromeVersion = (global = globalThis) => {
    try {
        if (!global.chrome) {
            return undefined;
        }
    }
    catch (e) {
    }
    const versionCheck = global.navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9]+)/);
    if (!versionCheck) {
        return undefined;
    }
    return parseInt(versionCheck[1], 10);
};
const isOldChrome = (global = globalThis, logger) => {
    const version = chromeVersion(global);
    if (!version) {
        return false;
    }
    if (version < SUPPORTED_CHROME_VERSION) {
        logger === null || logger === void 0 ? void 0 : logger.debug(`Chrome ${version} has incomplete SIMD support.`);
        return true;
    }
    return false;
};
exports.isOldChrome = isOldChrome;
