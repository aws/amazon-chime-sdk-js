import { ModelMetrics, ProcessorMessage, VoiceFocusAudioWorkletNode, VoiceFocusNodeOptions, WorkerMessage } from './types.js';
declare class VoiceFocusWorkerPostMessageNode extends VoiceFocusAudioWorkletNode {
    private worker;
    private delegate?;
    constructor(context: AudioContext, options: VoiceFocusNodeOptions);
    enable(): Promise<void>;
    disable(): Promise<void>;
    setMode(mode: string): Promise<void>;
    stop(): Promise<void>;
    getModelMetrics(): ModelMetrics | undefined;
    onWorkerMessage(event: WorkerMessage): void;
    onProcessorMessage(event: ProcessorMessage): void;
}
export default VoiceFocusWorkerPostMessageNode;
