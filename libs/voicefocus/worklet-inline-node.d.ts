import { ProcessorMessage, VoiceFocusAudioWorkletNode, VoiceFocusNodeOptions, WorkerMessage } from './types.js';
declare class VoiceFocusInlineNode extends VoiceFocusAudioWorkletNode {
    private worker;
    private logger;
    constructor(context: AudioContext, options: VoiceFocusNodeOptions);
    onModuleBufferLoaded(buffer: ArrayBuffer, key: string): void;
    onModuleLoaded(module: WebAssembly.Module, key: string): void;
    enable(): Promise<void>;
    disable(): Promise<void>;
    stop(): Promise<void>;
    onProcessorMessage(event: ProcessorMessage): void;
    onWorkerMessage(event: WorkerMessage): void;
}
export default VoiceFocusInlineNode;
