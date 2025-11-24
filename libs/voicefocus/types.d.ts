export interface Logger {
    debug: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
}
export type ModelCategory = 'voicefocus';
export type ModelName = 'default' | 'ns_es';
export type ModelVariant = 'c100' | 'c50' | 'c20' | 'c10';
export type SIMDPreference = 'force' | 'disable' | 'detect';
export type ExecutionApproach = 'inline' | 'worker-sab' | 'worker-postMessage';
export type ExecutionPreference = ExecutionApproach | 'worker' | 'auto';
export type UsagePreference = 'quality' | 'interactivity';
export type VariantPreference = ModelVariant | 'auto';
export type ExecutionQuanta = 1 | 2 | 3;
export interface ModelConfig {
    category: ModelCategory;
    name: ModelName;
    variant: ModelVariant;
    simd: boolean;
    mode?: string;
    url?: string;
}
export interface VoiceFocusExecutionSpec {
    variantPreference: ModelVariant | 'auto';
    namePreference: ModelName;
    simdPreference: SIMDPreference;
    executionPreference: ExecutionPreference;
    usagePreference: UsagePreference;
    estimatorBudget: number;
    executionQuantaPreference?: ExecutionQuanta;
}
export interface ComplexityThresholds {
    c100: number;
    c50: number;
    c20: number;
    c10: number;
}
export interface PerformanceThresholds {
    wasm: {
        noSupport: number;
        inline: ComplexityThresholds;
        worker: ComplexityThresholds;
    };
    simd: {
        noSupport: number;
        inline: ComplexityThresholds;
        worker: ComplexityThresholds;
    };
}
export interface VoiceFocusConfigureOptions {
    fetchBehavior?: VoiceFocusFetchBehavior;
    preResolve?: boolean;
    logger?: Logger;
}
export interface VoiceFocusDelegate {
    onCPUWarning(): void;
}
export type VoiceFocusProcessor = 'voicefocus-worker-sab-processor' | 'voicefocus-worker-postMessage-processor' | 'voicefocus-inline-processor';
export interface VoiceFocusNodeOptions extends AudioWorkletNodeOptions {
    worker: Worker;
    processor: VoiceFocusProcessor;
    audioBufferURL: string;
    resamplerURL: string;
    modelURL: string;
    fetchBehavior?: VoiceFocusFetchBehavior;
    delegate?: VoiceFocusDelegate;
    logger?: Logger;
    mode?: string;
}
declare const VoiceFocusAudioWorkletNode_base: {
    new (context: BaseAudioContext, name: string, options?: AudioWorkletNodeOptions | undefined): AudioWorkletNode;
    prototype: AudioWorkletNode;
};
export declare abstract class VoiceFocusAudioWorkletNode extends VoiceFocusAudioWorkletNode_base {
    abstract enable(): Promise<void>;
    abstract disable(): Promise<void>;
    abstract setMode(mode: string): Promise<void>;
    abstract stop(): Promise<void>;
    abstract getModelMetrics(): ModelMetrics | undefined;
    abstract reset(): void;
    abstract isEnabled(): boolean;
}
export interface EnabledAGCOptions {
    useVoiceFocusAGC: true;
    useBuiltInAGC?: boolean;
    level: number;
}
export interface DisabledAGCOptions {
    useVoiceFocusAGC: false;
    useBuiltInAGC?: boolean;
}
export type AGCOptions = EnabledAGCOptions | DisabledAGCOptions;
export interface ProcessorOptions {
    voiceFocusSampleRate: number;
    enabled: boolean;
    sendBufferCount: number;
    prefill: number;
    agc: AGCOptions;
    executionQuanta?: ExecutionQuanta;
    supportFarendStream?: boolean;
    mode?: string;
}
export interface ProcessorMessageData {
    message: 'data' | 'cpu' | 'prepare-for-frames' | 'metrics';
    buffer?: ArrayBuffer;
    metrics?: ModelMetrics;
    reason?: 'lateInvoke' | 'longInvoke';
    count?: number;
}
export interface ModelMetrics {
    latencyMillisAverage: number;
    snr: {
        average: number;
        variance: number;
        averageActive: number;
        varianceActive: number;
    };
    drr: {
        average: number;
        variance: number;
        averageActive: number;
        varianceActive: number;
    };
    vad: {
        average: number;
    };
    cpu: {
        lateInvoke: number;
        longInvoke: number;
    };
}
export interface ProcessorMessage {
    data: ProcessorMessageData;
}
export interface WorkerMessageData {
    message: 'module' | 'module-buffer' | 'stopped' | 'ready' | 'data' | 'cpu' | 'processing';
    key?: string;
    preload?: boolean;
    module?: WebAssembly.Module;
    buffer?: ArrayBuffer;
    shared?: SharedStructure;
}
export interface SharedStructure {
    state: SharedArrayBuffer;
    input: SharedArrayBuffer;
    output: SharedArrayBuffer;
}
export interface WorkerMessage {
    data: WorkerMessageData;
}
export interface VoiceFocusPaths {
    processors: string;
    workers: string;
    wasm: string;
    models: string;
}
export interface VoiceFocusFetchBehavior {
    headers?: Record<string, string>;
    escapedQueryString?: string;
}
export interface VoiceFocusFetchConfig extends VoiceFocusFetchBehavior {
    paths: VoiceFocusPaths;
}
export {};
