import { AGCOptions, ExecutionPreference, ExecutionQuanta, Logger, ModelCategory, ModelConfig, ModelName, ModelVariant, PerformanceThresholds, SIMDPreference, UsagePreference, VoiceFocusAudioWorkletNode, VoiceFocusConfigureOptions, VoiceFocusDelegate, VoiceFocusFetchBehavior, VoiceFocusFetchConfig, VoiceFocusPaths } from './types.js';
import { Unsupported } from './decider.js';
export interface AssetSpec {
    assetGroup?: string;
    revisionID?: string;
}
export declare type AssetConfig = {
    assetGroup: string;
} | {
    revisionID: string;
};
export interface VoiceFocusSpec extends AssetSpec {
    category?: ModelCategory;
    name?: ModelName;
    variant?: ModelVariant | 'auto';
    simd?: SIMDPreference;
    executionPreference?: ExecutionPreference;
    executionQuantaPreference?: ExecutionQuanta;
    usagePreference?: UsagePreference;
    estimatorBudget?: number;
    paths?: VoiceFocusPaths;
    thresholds?: PerformanceThresholds;
}
interface SupportedVoiceFocusConfig {
    supported: true;
    model: ModelConfig;
    processor: string;
    executionQuanta?: ExecutionQuanta;
    fetchConfig: VoiceFocusFetchConfig;
}
export declare type VoiceFocusConfig = SupportedVoiceFocusConfig | Unsupported;
export interface NodeArguments {
    voiceFocusSampleRate?: number;
    enabled?: boolean;
    agc?: AGCOptions;
}
export interface AudioInputOptions {
    spec?: VoiceFocusSpec;
    constraints?: MediaStreamConstraints;
    delegate?: any;
    preload?: boolean;
    options?: NodeArguments;
}
export declare class VoiceFocus {
    private processorURL;
    private nodeConstructor;
    private nodeOptions;
    private executionQuanta;
    private internal;
    private constructor();
    static isSupported(spec?: AssetSpec & {
        paths?: VoiceFocusPaths;
    }, options?: VoiceFocusConfigureOptions): Promise<boolean>;
    private static mungeExecutionPreference;
    static configure(spec?: VoiceFocusSpec, options?: VoiceFocusConfigureOptions): Promise<VoiceFocusConfig>;
    static init(configuration: VoiceFocusConfig, { delegate, preload, logger, }: {
        delegate: VoiceFocusDelegate;
        preload: boolean;
        logger?: Logger;
    }): Promise<VoiceFocus>;
    createNode(context: AudioContext, options?: NodeArguments): Promise<VoiceFocusAudioWorkletNode>;
    applyToStream(stream: MediaStream, context: AudioContext, options?: NodeArguments): Promise<{
        node: VoiceFocusAudioWorkletNode;
        source: MediaStreamAudioSourceNode;
        destination: MediaStreamAudioDestinationNode;
        stream: MediaStream;
    }>;
    applyToSourceNode(source: MediaStreamAudioSourceNode, context: AudioContext, options?: NodeArguments): Promise<VoiceFocusAudioWorkletNode>;
}
export declare const createAudioContext: (contextHint?: {
    latencyHint: number;
}) => AudioContext;
export declare const getAudioInput: (context: AudioContext, inputOptions: AudioInputOptions, voiceFocusOptions: {
    logger?: Logger;
    fetchBehavior?: VoiceFocusFetchBehavior;
    assetConfig?: AssetConfig;
}) => Promise<MediaStream>;
export {};
