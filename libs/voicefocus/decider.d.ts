import { ExecutionApproach, ExecutionQuanta, Logger, ModelConfig, ModelVariant, PerformanceThresholds, VoiceFocusExecutionSpec, VoiceFocusFetchConfig, VoiceFocusProcessor } from './types.js';
interface SupportedExecutionDefinition {
    supported: true;
    useSIMD: boolean;
    processor: VoiceFocusProcessor;
    executionApproach: ExecutionApproach;
    executionQuanta?: ExecutionQuanta;
    variant: ModelVariant;
}
export interface Unsupported {
    supported: false;
    reason: string;
}
declare type ExecutionDefinition = SupportedExecutionDefinition | Unsupported;
export declare const measureAndDecideExecutionApproach: (spec: VoiceFocusExecutionSpec, fetchConfig: VoiceFocusFetchConfig, logger?: Logger | undefined, thresholds?: PerformanceThresholds) => Promise<ExecutionDefinition>;
export declare const decideModel: ({ category, name, variant, simd, url }: ModelConfig) => string;
export {};
