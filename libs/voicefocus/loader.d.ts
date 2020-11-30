import { Logger, VoiceFocusFetchBehavior } from './types.js';
export declare const loadWorker: (workerURL: string, name: string, fetchBehavior: VoiceFocusFetchBehavior, logger?: Logger | undefined) => Promise<Worker>;
