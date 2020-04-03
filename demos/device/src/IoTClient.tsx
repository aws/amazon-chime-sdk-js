import AWS from 'aws-sdk';
import { device as AwsIotClient } from 'aws-iot-device-sdk';

const AWS_CONFIGS = {
  identityPoolId: 'COGNITO_IDENTITY_POOL_ID',
  host: 'AWS_IOT_HTTP_ENDPOINT',
  region: 'us-east-1',
};
  
export class IoTClient {
  public iotClient: AwsIotClient;
  private static instance: IoTClient;
  
  public static getInstance(): IoTClient {
    if (!IoTClient.instance) {
      IoTClient.instance = new IoTClient();
    }
    return IoTClient.instance;
  }

  private constructor() {
    this.setupAwsIotClient();
    this.setupCognitoCredentials();
  }

  private setupAwsIotClient() {
    this.iotClient = new AwsIotClient({
      region: AWS_CONFIGS.region,
      host: AWS_CONFIGS.host,
      protocol: 'wss',
      accessKeyId: "",
      secretKey: "",
      sessionToken: ""
    });
  }

  private setupCognitoCredentials() {
    AWS.config.region = AWS_CONFIGS.region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: AWS_CONFIGS.identityPoolId,
    });

    const cognitoIdentity = new AWS.CognitoIdentity();
    const credentials = AWS.config.credentials as AWS.CognitoIdentityCredentials;
    const client = this.iotClient;
    credentials.get(function(err) {
        if (!err) {
          const params = {
            IdentityId: credentials.identityId,
          };
          cognitoIdentity.getCredentialsForIdentity(params, function(error, data) {
            if (!error) {
              // Update AWS Credentials, iotClient will use these during next reconnect
              client.updateWebSocketCredentials(
                data.Credentials.AccessKeyId,
                data.Credentials.SecretKey,
                data.Credentials.SessionToken,
                data.Credentials.Expiration
              );
              console.log('No error retrieving credentials');
            } else {
              console.log('Error retrieving credentials: ' + error);
            }
          });
        } else {
          console.error('Error retrieving Cognito Identity: ' + err);
        }
    });
  }

  public publish(topic: string, message: Buffer | string) {
    this.iotClient.publish(topic, message, undefined, this.handlePublishError);
  }

  private handlePublishError(err) {
    if (err) {
      console.error("Error publishing message to AWS IoT: " + err);
    }
  }
}