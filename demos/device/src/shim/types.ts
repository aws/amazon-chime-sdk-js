declare global {
  interface Window {
    [key: string]: any;
    controllerEnvironment?: Promise<DeviceEnvironment>;
    deviceEnvironment?: Promise<DeviceEnvironment>;
  }
}

export type DeviceMessage = {
  [key: string]: any;
};

export interface MessageHandler {
  (message: DeviceMessage): void;
}

export interface DeviceEnvironment {
  init(listesner: MessageHandler): any;
  sendMessage(message: DeviceMessage): void;
}
