export default interface LogWorker {
  init(data: any, postMessage: Function, close: Function): void;

  putLog(data: any): void;

  uploadLogs(): Promise<string>;
}
