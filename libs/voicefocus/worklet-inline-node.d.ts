import { ModelMetrics, ProcessorMessage, VoiceFocusAudioWorkletNode, VoiceFocusNodeOptions, WorkerMessage } from './types.js';
declare class VoiceFocusInlineNode extends VoiceFocusAudioWorkletNode {
    private delegate?;
    private worker;
    private logger;
    private cpuWarningLastTriggered;
    private cpuWarningCount;
    private metricsLastRecorded;
    private metrics;
    private enabled;
    constructor(context: AudioContext, options: VoiceFocusNodeOptions);
    onModuleBufferLoaded(buffer: ArrayBuffer, key: string): void;
    onModuleLoaded(module: WebAssembly.Module, key: string): void;
    enable(): Promise<void>;
    disable(): Promise<void>;
    setMode(mode: string): Promise<void>;
    stop(): Promise<void>;
    reset(): void;
    isEnabled(): boolean;
    onProcessorMessage(event: ProcessorMessage): void;
    getModelMetrics(): ModelMetrics | undefined;
    onWorkerMessage(event: WorkerMessage): void;
}
export default VoiceFocusInlineNode;
