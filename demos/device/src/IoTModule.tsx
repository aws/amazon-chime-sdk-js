import { device as AwsIotClient } from 'aws-iot-device-sdk';

export namespace IoTModule {
  let iotClient: AwsIotClient;

  export function init(awsIotClient : AwsIotClient) {
    iotClient = awsIotClient;
    iotClient.on("connect", window.onConnectHandler);
    iotClient.subscribe('iot/meeting/#');

    iotClient.on("reconnect", window.onReconnectHandler);
    iotClient.on("message", window.onMessageHandler);
  }

  window.onConnectHandler = function() {
    console.log("IoT client - connect to IoT");
  }

  window.onReconnectHandler = function() {
    console.log("IoT client - re-connect to IoT");
  }

  window.onMessageHandler = function(topic, payload) {
    console.log('Receiving message from topic - ' + topic + ': ' + payload.toString());
  }

}