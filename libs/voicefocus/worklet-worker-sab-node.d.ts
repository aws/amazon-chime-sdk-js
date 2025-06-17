import { ModelMetrics, ProcessorMessage, VoiceFocusAudioWorkletNode, VoiceFocusNodeOptions, WorkerMessage } from './types.js';
declare class VoiceFocusWorkerBufferNode extends VoiceFocusAudioWorkletNode {
    private worker;
    private delegate?;
    private state;
    constructor(context: AudioContext, options: VoiceFocusNodeOptions);
    enable(): Promise<void>;
    disable(): Promise<void>;
    setMode(mode: string): Promise<void>;
    stop(): Promise<void>;
    getModelMetrics(): ModelMetrics | undefined;
    onWorkerMessage(event: WorkerMessage): void;
    onProcessorMessage(event: ProcessorMessage): void;
}
export default VoiceFocusWorkerBufferNode;
