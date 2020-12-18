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
exports.decideModel = exports.measureAndDecideExecutionApproach = void 0;
const loader_js_1 = require("./loader.js");
const support_js_1 = require("./support.js");
const DEFAULT_EXECUTION_QUANTA = 3;
const SIMD_SCORE_FIXED_POINT = 2.50;
const WASM_SCORE_FIXED_POINT = 2.63;
const SINGLE_INLINE_SCORE_MULTIPLIER = 0.6;
const QUALITY_MULTIPLE_QUANTA_SCORE_MULTIPLIER = 0.65;
const INTERACTIVITY_MULTIPLE_QUANTA_SCORE_MULTIPLIER = 0.5;
const WORKER_SCORE_MULTIPLIER = 0.7;
const PERFORMANCE_THRESHOLDS = {
    wasm: {
        noSupport: 0.07,
        inline: {
            c100: 1,
            c50: 0.36,
            c20: 0.16,
            c10: 0.07,
        },
        worker: {
            c100: 0.5,
            c50: 0.18,
            c20: 0.08,
            c10: 0.06,
        },
    },
    simd: {
        noSupport: 0.10,
        inline: {
            c100: 1,
            c50: 0.43,
            c20: 0.3,
            c10: 0.2,
        },
        worker: {
            c100: 0.5,
            c50: 0.21,
            c20: 0.15,
            c10: 0.10,
        },
    },
};
class Estimator {
    constructor(fetchConfig, logger) {
        this.fetchConfig = fetchConfig;
        this.logger = logger;
        const workerURL = `${fetchConfig.paths.workers}estimator-v1.js`;
        this.fetchBehavior = { headers: fetchConfig.headers, escapedQueryString: fetchConfig.escapedQueryString };
        this.worker = loader_js_1.loadWorker(workerURL, 'VoiceFocusEstimator', this.fetchBehavior, logger);
    }
    roundtrip(toSend, receive, expectedKey) {
        return new Promise((resolve, reject) => {
            this.worker.then(worker => {
                let listener;
                listener = (event) => {
                    const { message, key } = event.data;
                    if (message === receive && key === expectedKey) {
                        worker.removeEventListener('message', listener);
                        resolve(event.data);
                    }
                };
                worker.addEventListener('message', listener);
                worker.postMessage(toSend);
            }).catch(e => {
                var _a;
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error('Failed to load worker.', e);
                reject(e);
            });
        });
    }
    supportsSIMD(url) {
        const key = 'simd';
        const path = url || `${this.fetchConfig.paths.wasm}simd-v1.wasm`;
        const toSend = {
            message: 'supports-simd',
            fetchBehavior: this.fetchBehavior,
            path,
            key,
        };
        return this.roundtrip(toSend, 'simd-support', key)
            .then(data => data.supports);
    }
    measure(simd, budget) {
        const benchWASM = `${this.fetchConfig.paths.wasm}bench-v1.wasm`;
        const benchSIMD = `${this.fetchConfig.paths.wasm}bench-v1_simd.wasm`;
        const path = simd ? benchSIMD : benchWASM;
        const key = `bench:${simd}`;
        const toSend = {
            message: 'measure',
            fetchBehavior: this.fetchBehavior,
            budget,
            path,
            key,
        };
        return this.roundtrip(toSend, 'measurement', key)
            .then(data => {
            if (data.measurement) {
                return data.measurement;
            }
            throw new Error('Failed to measure.');
        });
    }
    stop() {
        this.worker.then(worker => {
            var _a;
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('Stopping estimator worker.');
            worker.terminate();
        }).catch(e => {
        });
    }
}
const inlineScoreMultiplier = (executionQuanta, usagePreference) => {
    if (executionQuanta === 1) {
        return SINGLE_INLINE_SCORE_MULTIPLIER;
    }
    if (usagePreference === 'quality') {
        return QUALITY_MULTIPLE_QUANTA_SCORE_MULTIPLIER * executionQuanta;
    }
    return INTERACTIVITY_MULTIPLE_QUANTA_SCORE_MULTIPLIER * executionQuanta;
};
const decideExecutionApproach = ({ supportsSIMD, supportsSAB, duration, executionPreference = 'auto', simdPreference, variantPreference = 'auto', usagePreference, executionQuantaPreference = DEFAULT_EXECUTION_QUANTA, }, allThresholds = PERFORMANCE_THRESHOLDS, logger) => {
    const forceSIMD = (simdPreference === 'force');
    const useSIMD = forceSIMD || (simdPreference !== 'disable' && supportsSIMD);
    const checkScores = duration !== -1;
    const baseScore = checkScores ? (useSIMD ? SIMD_SCORE_FIXED_POINT : WASM_SCORE_FIXED_POINT) / duration : 0;
    const thresholds = useSIMD ? allThresholds.simd : allThresholds.wasm;
    const inlineScore = checkScores ? inlineScoreMultiplier(executionQuantaPreference, usagePreference) * baseScore : 0;
    const workerScore = checkScores ? WORKER_SCORE_MULTIPLIER * baseScore : 0;
    const unsupported = (reason) => {
        return {
            supported: false,
            reason,
        };
    };
    if (checkScores) {
        if (baseScore < thresholds.noSupport) {
            return unsupported(`Performance score ${baseScore} worse than threshold ${thresholds.noSupport}.`);
        }
    }
    else {
        if ((executionPreference === 'auto') ||
            (variantPreference === 'auto')) {
            return unsupported(`Missing explicit execution (${executionPreference}) or variant (${variantPreference}) preference, but no scoring performed.`);
        }
    }
    logger === null || logger === void 0 ? void 0 : logger.debug(`Bench duration ${duration} yields inline score ${inlineScore} and worker score ${workerScore}.`);
    const succeed = (processor, executionApproach, variant) => {
        return {
            supported: true,
            useSIMD,
            processor,
            executionApproach,
            variant,
            executionQuanta: (executionApproach === 'inline' ? executionQuantaPreference : undefined),
        };
    };
    const resolveVariant = (score, variant, lookup) => {
        if (variant !== 'auto') {
            if (!checkScores || score > lookup[variant]) {
                return variant;
            }
            return 'failed';
        }
        if (score > lookup.c100) {
            return 'c100';
        }
        if (score > lookup.c50) {
            return 'c50';
        }
        if (score > lookup.c20) {
            return 'c20';
        }
        if (score > lookup.c10) {
            return 'c10';
        }
        return 'failed';
    };
    const reducePreference = (preference) => {
        switch (preference || 'auto') {
            case 'auto': {
                let inlineOption = reducePreference('inline');
                let workerOption = reducePreference('worker');
                logger === null || logger === void 0 ? void 0 : logger.debug(`Reducing auto preference: ${JSON.stringify(inlineOption)} vs ${JSON.stringify(workerOption)}`);
                if (inlineOption.supported === false) {
                    return workerOption;
                }
                if (workerOption.supported === false) {
                    return workerOption;
                }
                if (inlineOption.variant === workerOption.variant || inlineOption.variant === 'c50') {
                    return inlineOption;
                }
                return workerOption;
            }
            case 'worker': {
                if (support_js_1.supportsSharedArrayBuffer(globalThis, window, logger)) {
                    return reducePreference('worker-sab');
                }
                return reducePreference('worker-postMessage');
            }
            case 'inline': {
                const variant = resolveVariant(inlineScore, variantPreference, thresholds.inline);
                if (variant === 'failed') {
                    return unsupported(`Performance score ${inlineScore} not sufficient for inline use with variant preference ${variantPreference}.`);
                }
                ;
                return succeed('voicefocus-inline-processor', 'inline', variant);
            }
            case 'worker-sab': {
                if (!supportsSAB) {
                    const reason = 'Requested worker-sab but no SharedArrayBuffer support.';
                    logger === null || logger === void 0 ? void 0 : logger.warn(reason);
                    return { supported: false, reason };
                }
                const variant = resolveVariant(workerScore, variantPreference, thresholds.worker);
                if (variant === 'failed') {
                    return unsupported(`Performance score ${workerScore} not sufficient for worker use with variant preference ${variantPreference}.`);
                }
                ;
                return succeed('voicefocus-worker-sab-processor', 'worker-sab', variant);
            }
            case 'worker-postMessage': {
                const variant = resolveVariant(workerScore, variantPreference, thresholds.worker);
                if (variant === 'failed') {
                    return unsupported(`Performance score ${workerScore} not sufficient for worker use.`);
                }
                ;
                return succeed('voicefocus-worker-postMessage-processor', 'worker-postMessage', variant);
            }
        }
    };
    return reducePreference(executionPreference);
};
const featureCheck = (forceSIMD, fetchConfig, logger, estimator) => __awaiter(void 0, void 0, void 0, function* () {
    const supports = {
        supportsSIMD: forceSIMD,
        supportsSAB: support_js_1.supportsSharedArrayBuffer(globalThis, window, logger),
        duration: -1,
    };
    if (forceSIMD) {
        logger === null || logger === void 0 ? void 0 : logger.info('Supports SIMD: true (force)');
        return supports;
    }
    const cleanup = !estimator;
    const e = estimator || new Estimator(fetchConfig, logger);
    try {
        const useSIMD = !support_js_1.isOldChrome(window, logger) && (yield e.supportsSIMD());
        logger === null || logger === void 0 ? void 0 : logger.info(`Supports SIMD: ${useSIMD} (force: ${forceSIMD})`);
        supports.supportsSIMD = useSIMD;
        return supports;
    }
    finally {
        if (cleanup) {
            e.stop();
        }
    }
});
const estimateAndFeatureCheck = (forceSIMD, fetchConfig, estimatorBudget, logger) => __awaiter(void 0, void 0, void 0, function* () {
    const estimator = new Estimator(fetchConfig, logger);
    try {
        const supports = yield featureCheck(forceSIMD, fetchConfig, logger, estimator);
        if (supports.supportsSIMD) {
            try {
                supports.duration = yield estimator.measure(true, estimatorBudget);
                logger === null || logger === void 0 ? void 0 : logger.info('SIMD timing:', supports.duration);
                return supports;
            }
            catch (e) {
                logger === null || logger === void 0 ? void 0 : logger.warn('Failed SIMD estimation; falling back to non-SIMD.');
                supports.supportsSIMD = false;
            }
        }
        supports.duration = yield estimator.measure(false, estimatorBudget);
        logger === null || logger === void 0 ? void 0 : logger.info('No-SIMD timing:', supports.duration);
        return supports;
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.error('Could not feature check.', e);
        throw e;
    }
    finally {
        estimator.stop();
    }
});
const measureAndDecideExecutionApproach = (spec, fetchConfig, logger, thresholds = PERFORMANCE_THRESHOLDS) => __awaiter(void 0, void 0, void 0, function* () {
    let executionPreference = spec.executionPreference;
    const { usagePreference, variantPreference, simdPreference, estimatorBudget, executionQuantaPreference, } = spec;
    if (usagePreference === 'interactivity' && executionPreference !== 'inline') {
        logger === null || logger === void 0 ? void 0 : logger.debug(`Overriding execution preference ${executionPreference} to reflect interactivity preference.`);
        executionPreference = 'inline';
    }
    const forceSIMD = simdPreference === 'force';
    const knownModel = variantPreference !== 'auto';
    const knownExecution = executionPreference !== 'auto';
    let supports;
    try {
        if (knownModel && knownExecution) {
            supports = yield featureCheck(forceSIMD, fetchConfig, logger);
        }
        else {
            supports = yield estimateAndFeatureCheck(forceSIMD, fetchConfig, estimatorBudget, logger);
        }
    }
    catch (e) {
        logger === null || logger === void 0 ? void 0 : logger.error('Could not load estimator.', e);
        throw new Error('Could not load Voice Focus estimator.');
    }
    return decideExecutionApproach(Object.assign(Object.assign({}, supports), { simdPreference,
        executionPreference,
        variantPreference,
        usagePreference,
        executionQuantaPreference }), thresholds, logger);
});
exports.measureAndDecideExecutionApproach = measureAndDecideExecutionApproach;
const decideModel = ({ category, name, variant, simd }) => {
    return `${category}-${name}-${variant}-v1${simd ? '_simd' : ''}`;
};
exports.decideModel = decideModel;
