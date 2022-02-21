# Migration from SDK v2 to SDK v3

## Installation

Installation involves adjusting your `package.json` to depend on version `3.0.0`.

```shell
npm install --save amazon-chime-sdk-js@3
```

## Interface changes

Version 3 of the Amazon Chime SDK for JavaScript makes a small number of interface
changes, as well as removing some deprecated interfaces.

In many cases you should not need to adjust your application code at all. This will be the case if:

### Messaging
#### Remove AWS global object from `MessagingSessionConfiguration.ts`
`MessagingSessionConfiguration` used to require to pass in the AWS global object for sigV4 signing which does not 
work for aws-sdk v3. Starting with Amazon Chime SDK for JavaScript V3, you no longer have to pass in the global AWS object.

If your code looked like this:

```typescript
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, endpoint.Endpoint.Url, chime, AWS);
```

change it to

```typescript
this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, endpoint.Endpoint.Url, chime);
```

#### Update `messagingSession.start` to return `Promise<void>` instead of `void`
In aws-sdk v3, region and credentials can be async function. In order to support aws-sdk v3, we update the start API 
to async.

If your code looked like this:

```typescript
messagingSession.start();
```

change it to

```typescript
await messagingSession.start();
```