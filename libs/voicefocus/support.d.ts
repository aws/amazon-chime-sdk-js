import { Logger, VoiceFocusFetchConfig } from './types.js';
interface LimitedWindow {
    chrome?: any;
    navigator: {
        userAgent: string;
    };
}
export declare const isSafari: (global?: LimitedWindow) => boolean;
export declare const supportsWASMPostMessage: (global?: LimitedWindow) => boolean;
export declare const supportsVoiceFocusWorker: (scope: {
    Worker?: {
        new (stringUrl: string | URL, options?: WorkerOptions | undefined): Worker;
        prototype: Worker;
    } | undefined;
} | undefined, fetchConfig: VoiceFocusFetchConfig, logger?: Logger | undefined) => Promise<boolean>;
export declare const supportsWorker: (scope?: {
    Worker?: typeof Worker;
}, logger?: Logger | undefined) => boolean;
export declare const supportsAudioWorklet: (scope?: {
    AudioWorklet?: typeof AudioWorklet;
    AudioWorkletNode?: typeof AudioWorkletNode;
}, logger?: Logger | undefined) => boolean;
export declare const supportsWASM: (scope?: {
    WebAssembly?: typeof WebAssembly;
}, logger?: Logger | undefined) => boolean;
export declare const supportsSharedArrayBuffer: (scope?: {
    crossOriginIsolated?: boolean;
    SharedArrayBuffer?: typeof SharedArrayBuffer;
}, window?: LimitedWindow, logger?: Logger | undefined) => boolean;
export declare const supportsWASMStreaming: (scope?: {
    WebAssembly?: typeof WebAssembly;
}, logger?: Logger | undefined) => boolean;
export declare const isOldChrome: (global?: LimitedWindow, logger?: Logger | undefined) => boolean;
export {};
