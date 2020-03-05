import { DeviceEnvironment, DeviceMessage, MessageHandler } from './types';

class BrowserEnvironment implements DeviceEnvironment {
  channel = new BroadcastChannel('chime-broadcaster');

  init(listener: MessageHandler): any {
    console.info('Controller environment init called.');

    this.channel.onmessage = ({ data }) => {
      listener(data);
    };
  }

  sendMessage(message: DeviceMessage): void {
    this.channel.postMessage(message);
  }
}

export default BrowserEnvironment;
