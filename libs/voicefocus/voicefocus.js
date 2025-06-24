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
exports.getAudioInput = exports.createAudioContext = exports.VoiceFocus = void 0;
const decider_js_1 = require("./decider.js");
const fetch_js_1 = require("./fetch.js");
const loader_js_1 = require("./loader.js");
const support_js_1 = require("./support.js");
const worklet_inline_node_js_1 = require("./worklet-inline-node.js");
const worklet_worker_sab_node_js_1 = require("./worklet-worker-sab-node.js");
const worklet_worker_postMessage_node_js_1 = require("./worklet-worker-postMessage-node.js");
const DEFAULT_AGC_DISABLED_SETTING = {
    useVoiceFocusAGC: false,
    useBuiltInAGC: true,
};
const DEFAULT_AGC_SETTING = DEFAULT_AGC_DISABLED_SETTING;
const DEFAULT_ASSET_GROUP = 'stable-v1';
const DEFAULT_CDN = 'https://static.sdkassets.chime.aws';
const DEFAULT_PATHS = {
    processors: `${DEFAULT_CDN}/processors/`,
    workers: `${DEFAULT_CDN}/workers/`,
    wasm: `${DEFAULT_CDN}/wasm/`,
    models: `${DEFAULT_CDN}/wasm/`,
};
const DEFAULT_CONTEXT_HINT = {
    latencyHint: 0,
};
const BASE_AUDIO_CONSTRAINTS = {
    channelCount: 1,
    echoCancellation: true,
    googEchoCancellation: true,
    noiseSuppression: false,
    googNoiseSuppression: false,
    googHighpassFilter: false,
    googTypingNoiseDetection: false,
};
const DEFAULT_AUDIO_CONSTRAINTS_WITH_BUILTIN_AGC = Object.assign(Object.assign({}, BASE_AUDIO_CONSTRAINTS), { autoGainControl: true, googAutoGainControl: true, googAutoGainControl2: true });
const DEFAULT_AUDIO_CONSTRAINTS_WITHOUT_BUILTIN_AGC = Object.assign(Object.assign({}, BASE_AUDIO_CONSTRAINTS), { autoGainControl: false, googAutoGainControl: false, googAutoGainControl2: false });
const PROCESSORS = {
    'voicefocus-worker-sab-processor': {
        file: 'worklet-worker-sab-processor-v1.js',
        node: worklet_worker_sab_node_js_1.default,
    },
    'voicefocus-worker-postMessage-processor': {
        file: 'worklet-worker-postMessage-processor-v1.js',
        node: worklet_worker_postMessage_node_js_1.default,
    },
    'voicefocus-inline-processor': {
        file: 'worklet-inline-processor-v1.js',
        node: worklet_inline_node_js_1.default,
    },
};
const validateAssetSpec = (assetGroup, revisionID) => {
    if (assetGroup !== undefined && !(0, fetch_js_1.isValidAssetGroup)(assetGroup)) {
        throw new Error(`Invalid asset group ${assetGroup}`);
    }
    if (revisionID !== undefined && !(0, fetch_js_1.isValidRevisionID)(revisionID)) {
        throw new Error(`Invalid revision ID ${revisionID}`);
    }
};
const mungeConstraints = (constraints, agc) => {
    let defaultConstraints;
    if (agc.useBuiltInAGC) {
        defaultConstraints = DEFAULT_AUDIO_CONSTRAINTS_WITH_BUILTIN_AGC;
    }
    else {
        defaultConstraints = DEFAULT_AUDIO_CONSTRAINTS_WITHOUT_BUILTIN_AGC;
    }
    if (!constraints) {
        return { audio: defaultConstraints };
    }
    if (!constraints.audio) {
        return constraints;
    }
    if (constraints.video) {
        throw new Error('Not adding Voice Focus to multi-device getUserMedia call.');
    }
    return Object.assign(Object.assign({}, constraints), { audio: constraints.audio === true ? defaultConstraints : Object.assign(Object.assign({}, constraints.audio), defaultConstraints) });
};
const urlForModel = (model, paths) => {
    return `${paths.models}${(0, decider_js_1.decideModel)(model)}.wasm`;
};
class VoiceFocus {
    constructor(worker, processorURL, nodeConstructor, nodeOptions, executionQuanta, logger) {
        this.processorURL = processorURL;
        this.nodeConstructor = nodeConstructor;
        this.nodeOptions = nodeOptions;
        this.executionQuanta = executionQuanta;
        this.logger = logger;
        this.internal = {
            worker,
            isDestroyed: false,
        };
    }
    getModelMetrics() {
        var _a;
        return (_a = this.internal.voiceFocusNode) === null || _a === void 0 ? void 0 : _a.getModelMetrics();
    }
    enable() {
        var _a;
        (_a = this.internal.voiceFocusNode) === null || _a === void 0 ? void 0 : _a.enable();
    }
    disable() {
        var _a;
        (_a = this.internal.voiceFocusNode) === null || _a === void 0 ? void 0 : _a.disable();
    }
    setMode(mode) {
        var _a;
        (_a = this.internal.voiceFocusNode) === null || _a === void 0 ? void 0 : _a.setMode(mode);
    }
    destroy() {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            const { worker, isDestroyed, voiceFocusNode, destinationNode, sourceNode, audioContext } = this.internal;
            if (isDestroyed) {
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug("Voice Focus is already destroyed");
                return;
            }
            try {
                worker === null || worker === void 0 ? void 0 : worker.terminate();
                sourceNode === null || sourceNode === void 0 ? void 0 : sourceNode.disconnect();
                destinationNode === null || destinationNode === void 0 ? void 0 : destinationNode.disconnect();
                yield Promise.all([
                    (_b = audioContext === null || audioContext === void 0 ? void 0 : audioContext.close().catch((error) => error)) !== null && _b !== void 0 ? _b : yield Promise.resolve(),
                    (_c = voiceFocusNode === null || voiceFocusNode === void 0 ? void 0 : voiceFocusNode.stop().catch((error) => error)) !== null && _c !== void 0 ? _c : yield Promise.resolve(),
                ]);
                this.internal.audioContext = undefined;
                this.internal.voiceFocusNode = undefined;
                this.internal.sourceNode = undefined;
                this.internal.destinationNode = undefined;
                (_d = this.logger) === null || _d === void 0 ? void 0 : _d.debug("Voice Focus destroyed successfully");
            }
            catch (e) {
                (_e = this.logger) === null || _e === void 0 ? void 0 : _e.error("Error while destroying the Voice Focus instance: ", e);
                throw e;
            }
            finally {
                this.internal.isDestroyed = true;
            }
        });
    }
    static isSupported(spec, options) {
        const { fetchBehavior, logger } = options || {};
        if (typeof globalThis === 'undefined') {
            logger === null || logger === void 0 ? void 0 : logger.debug('Browser does not have globalThis.');
            return Promise.resolve(false);
        }
        if (!(0, support_js_1.supportsAudioWorklet)(globalThis, logger)) {
            logger === null || logger === void 0 ? void 0 : logger.debug('Browser does not support Audio Worklet.');
            return Promise.resolve(false);
        }
        if (!(0, support_js_1.supportsWASM)(globalThis, logger)) {
            logger === null || logger === void 0 ? void 0 : logger.debug('Browser does not support WASM.');
            return Promise.resolve(false);
        }
        if (!(0, support_js_1.supportsWASMStreaming)(globalThis, logger)) {
            logger === null || logger === void 0 ? void 0 : logger.debug('Browser does not support streaming WASM compilation.');
        }
        const { assetGroup = DEFAULT_ASSET_GROUP, revisionID, paths = DEFAULT_PATHS, } = spec || {};
        validateAssetSpec(assetGroup, revisionID);
        const assetConfig = revisionID ? { revisionID } : { assetGroup };
        const updatedFetchBehavior = (0, fetch_js_1.addQueryParams)(fetchBehavior, assetConfig);
        const fetchConfig = Object.assign(Object.assign({}, updatedFetchBehavior), { paths });
        return (0, support_js_1.supportsVoiceFocusWorker)(globalThis, fetchConfig, logger);
    }
    static mungeExecutionPreference(preference, logger) {
        const isAuto = (preference === undefined || preference === 'auto');
        if ((0, support_js_1.isSafari)(globalThis)) {
            if (isAuto || preference === 'inline') {
                return 'inline';
            }
            if (!isAuto) {
                throw new Error(`Unsupported execution preference ${preference}`);
            }
        }
        if (preference === 'worker-sab' && !(0, support_js_1.supportsSharedArrayBuffer)(globalThis, globalThis, logger)) {
            throw new Error(`Unsupported execution preference ${preference}`);
        }
        return preference || 'auto';
    }
    static configure(spec, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fetchBehavior, preResolve, logger, } = options || {};
            const { category = 'voicefocus', name = 'default', variant: variantPreference = 'auto', assetGroup = DEFAULT_ASSET_GROUP, revisionID, simd = 'detect', mode = 'ns', executionPreference = 'auto', executionQuantaPreference, usagePreference = 'interactivity', estimatorBudget = 100, paths = DEFAULT_PATHS, thresholds, } = spec || {};
            logger === null || logger === void 0 ? void 0 : logger.debug('Configuring Voice Focus with spec', spec);
            if (category !== undefined && category !== 'voicefocus') {
                throw new Error(`Unrecognized category ${category}`);
            }
            if (name !== undefined && name !== 'default' && name !== 'ns_es') {
                throw new Error(`Unrecognized feature name ${name}`);
            }
            if (variantPreference !== undefined && !['auto', 'c100', 'c50', 'c20', 'c10'].includes(variantPreference)) {
                throw new Error(`Unrecognized feature variant ${variantPreference}`);
            }
            if (executionQuantaPreference !== undefined && ![1, 2, 3].includes(executionQuantaPreference)) {
                throw new Error(`Unrecognized execution quanta preference ${executionQuantaPreference}`);
            }
            validateAssetSpec(assetGroup, revisionID);
            if (simd !== undefined && !['detect', 'force', 'disable'].includes(simd)) {
                throw new Error(`Unrecognized SIMD option ${simd}`);
            }
            if (executionPreference !== undefined && !['auto', 'inline', 'worker', 'worker-sab', 'worker-postMessage'].includes(executionPreference)) {
                throw new Error(`Unrecognized execution preference ${executionPreference}`);
            }
            if (usagePreference !== undefined && !['quality', 'interactivity'].includes(usagePreference)) {
                throw new Error(`Unrecognized usage preference ${usagePreference}`);
            }
            const executionSpec = {
                executionPreference: this.mungeExecutionPreference(executionPreference, logger),
                usagePreference,
                executionQuantaPreference,
                variantPreference,
                namePreference: name,
                simdPreference: simd,
                estimatorBudget,
            };
            const assetConfig = revisionID ? { revisionID } : { assetGroup };
            const updatedFetchBehavior = (0, fetch_js_1.addQueryParams)(fetchBehavior, assetConfig);
            const fetchConfig = Object.assign({ paths }, updatedFetchBehavior);
            const executionDefinition = yield (0, decider_js_1.measureAndDecideExecutionApproach)(executionSpec, fetchConfig, logger, thresholds);
            if (executionDefinition.supported === false) {
                return { supported: false, reason: executionDefinition.reason };
            }
            logger === null || logger === void 0 ? void 0 : logger.info('Decided execution approach', executionDefinition);
            const { useSIMD, processor, variant, executionQuanta } = executionDefinition;
            const model = {
                category: category || 'voicefocus',
                name: name || 'default',
                mode,
                variant,
                simd: useSIMD,
            };
            if (preResolve) {
                const startingURL = urlForModel(model, paths);
                model.url = yield (0, fetch_js_1.resolveURL)(startingURL, updatedFetchBehavior);
            }
            return {
                fetchConfig,
                model,
                processor,
                executionQuanta,
                supported: true,
            };
        });
    }
    static init(configuration, { delegate, preload = true, logger, }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (configuration.supported === false) {
                throw new Error('Voice Focus not supported. Reason: ' + configuration.reason);
            }
            const { model, processor, fetchConfig, executionQuanta, } = configuration;
            const { simd, name, mode } = model;
            const { paths } = fetchConfig;
            if (processor !== 'voicefocus-inline-processor' &&
                processor !== 'voicefocus-worker-postMessage-processor' &&
                processor !== 'voicefocus-worker-sab-processor') {
                throw new Error(`Unknown processor ${processor}`);
            }
            const modelURL = model.url || urlForModel(model, paths);
            logger === null || logger === void 0 ? void 0 : logger.debug(`Using model URL ${modelURL}.`);
            const audioBufferURL = `${paths.wasm}audio_buffer-v1${simd ? '_simd' : ''}.wasm`;
            const resamplerURL = `${paths.wasm}resampler-v1${simd ? '_simd' : ''}.wasm`;
            const workerURL = `${paths.workers}worker-v1.js`;
            const { file, node } = PROCESSORS[processor];
            const processorURL = `${paths.processors}${file}`;
            const worker = yield (0, loader_js_1.loadWorker)(workerURL, 'VoiceFocusWorker', fetchConfig, logger);
            if (preload) {
                logger === null || logger === void 0 ? void 0 : logger.debug('Preloading', modelURL);
                let message = (0, support_js_1.supportsWASMPostMessage)(globalThis) ? 'get-module' : 'get-module-buffer';
                worker.postMessage({
                    message,
                    preload: true,
                    key: 'model',
                    fetchBehavior: fetchConfig,
                    path: modelURL,
                });
            }
            const numberOfInputs = (name === 'ns_es') ? 2 : 1;
            const nodeOptions = {
                processor,
                worker,
                audioBufferURL,
                resamplerURL,
                fetchBehavior: fetchConfig,
                modelURL,
                delegate,
                logger,
                numberOfInputs,
                mode,
            };
            const factory = new VoiceFocus(worker, processorURL, node, nodeOptions, executionQuanta, logger);
            return Promise.resolve(factory);
        });
    }
    createNode(context, options) {
        var _a;
        if (this.internal.isDestroyed) {
            throw new Error("Unable to create node because VoiceFocus worker has been destroyed.");
        }
        const { voiceFocusSampleRate = (context.sampleRate === 16000 ? 16000 : 48000), enabled = true, agc = DEFAULT_AGC_SETTING, } = options || {};
        const supportFarendStream = options === null || options === void 0 ? void 0 : options.es;
        const processorOptions = {
            voiceFocusSampleRate,
            enabled,
            sendBufferCount: 10,
            prefill: 6,
            agc,
            executionQuanta: this.executionQuanta,
            supportFarendStream,
            mode: this.nodeOptions.mode,
        };
        const url = (0, fetch_js_1.withQueryString)(this.processorURL, (_a = this.nodeOptions) === null || _a === void 0 ? void 0 : _a.fetchBehavior);
        return context.audioWorklet
            .addModule(url)
            .then(() => new (this.nodeConstructor)(context, Object.assign(Object.assign({}, this.nodeOptions), { processorOptions })));
    }
    applyToStream(stream, context, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.internal.isDestroyed) {
                throw new Error("Unable to apply stream because VoiceFocus worker has been destroyed");
            }
            const source = context.createMediaStreamSource(stream);
            const node = yield this.applyToSourceNode(source, context, options);
            const destination = context.createMediaStreamDestination();
            node.connect(destination);
            this.internal = Object.assign(Object.assign({}, this.internal), { voiceFocusNode: node, sourceNode: source, destinationNode: destination, audioContext: context });
            return {
                node,
                source,
                destination,
                stream: destination.stream,
            };
        });
    }
    applyToSourceNode(source, context, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = yield this.createNode(context, options);
            source.connect(node);
            return node;
        });
    }
}
exports.VoiceFocus = VoiceFocus;
const createAudioContext = (contextHint = DEFAULT_CONTEXT_HINT) => {
    return new (window.AudioContext || window.webkitAudioContext)(contextHint);
};
exports.createAudioContext = createAudioContext;
const getAudioInput = (context, inputOptions, voiceFocusOptions) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { constraints, spec, delegate, preload = true, options } = inputOptions;
    const { logger } = voiceFocusOptions;
    const config = yield VoiceFocus.configure(spec, voiceFocusOptions);
    if (!config.supported) {
        (_a = voiceFocusOptions.logger) === null || _a === void 0 ? void 0 : _a.warn('Voice Focus not supported; returning standard stream.');
        return window.navigator.mediaDevices.getUserMedia(constraints);
    }
    const factory = yield VoiceFocus.init(config, { delegate, preload, logger });
    const agc = ((_b = inputOptions.options) === null || _b === void 0 ? void 0 : _b.agc) || DEFAULT_AGC_SETTING;
    const input = yield window.navigator.mediaDevices.getUserMedia(mungeConstraints(constraints, agc));
    return factory.applyToStream(input, context, options).then(result => result.stream);
});
exports.getAudioInput = getAudioInput;
