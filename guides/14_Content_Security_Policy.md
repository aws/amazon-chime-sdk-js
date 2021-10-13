# Content Security Policy for applications using the Amazon Chime SDK

Modern web applications use [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) to protect users from certain classes of attacks. You can add a security policy by configuring your web server to return the Content-Security-Policy HTTP header or using a `<meta>` element to configure a policy. You can add security headers using [Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html) and Amazon [CloudFront](https://aws.amazon.com/cloudfront/). For more information, see [Adding HTTP Security Headers Using Lambda@Edge and Amazon CloudFront](https://aws.amazon.com/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/).

Include the following in your policy to allow the Amazon Chime SDK access to the meeting, messaging, and Amazon Voice Focus resources.

You can do so via an HTTP header:

```
Content-Security-Policy: content="connect-src 'self' https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com https://*.sdkassets.chime.aws; script-src 'self' https://*.sdkassets.chime.aws; script-src-elem 'self' https://*.sdkassets.chime.aws 'wasm-unsafe-eval'; worker-src 'blob:'; child-src 'blob:'
```

a `<meta>` tag:

```html
<meta http-equiv="Content-Security-Policy" content="connect-src 'self' https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com https://*.sdkassets.chime.aws; script-src 'self' https://*.sdkassets.chime.aws 'wasm-eval' 'wasm-unsafe-eval' 'unsafe-eval'; script-src-elem 'self' https://*.sdkassets.chime.aws; worker-src blob:; child-src blob:">
```

or by using a bundling tool like `csp-html-webpack-plugin` with input like:

```javascript
new CspHtmlWebpackPlugin({
  'connect-src': "'self' https://*.chime.aws wss://*.chime.aws https://*.amazonaws.com https://*.sdkassets.chime.aws",

  // 'wasm-unsafe-eval' is to allow Amazon Voice Focus to work in Chrome 95+.
  // Strictly speaking, this should be enough, but the worker cannot compile WebAssembly unless
  // 'unsafe-eval' is also present.
  'script-src': "'self' https://*.sdkassets.chime.aws 'wasm-eval' 'wasm-unsafe-eval' 'unsafe-eval'",

  // Script hashes/nonces are not emitted for script-src-elem, so just add unsafe-inline.
  'script-src-elem': "'self' https://*.sdkassets.chime.aws 'unsafe-inline'",
  'worker-src': "blob:",
  'child-src': "blob:",
}),
```

`csp-html-webpack-plugin` will automatically generate hashes and nonces for your inline script and style tags.

Note that `script-src-elem` is not supported in Safari and Firefox. `worker-src` is not supported in Safari.

You will need to add your own entries to this policy to allow for making connections and downloading scripts and assets required by your own application.

## Meeting

If you use audio, video, or screen sharing in your application by creating a [meeting session](https://github.com/aws/amazon-chime-sdk-js#meeting-session), ensure that your policy includes the following:

```
connect-src: *.chime.aws wss://*.chime.aws
```

## Messaging

If you use the [Amazon Chime SDK messaging](https://docs.aws.amazon.com/chime/latest/dg/using-the-messaging-sdk.html) with [Amazon Cognito](https://aws.amazon.com/cognito/), ensure that you add the following:

```
connect-src: *.amazonaws.com
```

## Logging

The Amazon Chime SDK for JavaScript listens to the browser's [security policy violation event](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent) and logs URIs that were blocked by the browser when joining meetings, creating audio and video devices, or establishing messaging sessions. The Amazon Chime SDK for JavaScript outputs "Security Policy Violation" error messages to the web console if you enable the console logger. The security policy violation event is an experimental technology and it is only supported in several major browsers. See [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent#browser_compatibility) for more information before using this in production.

If you want to disable the error for security policy violation events, you can do the following in your application:

```typescript
import { CSPMonitor } from 'amazon-chime-sdk-js';

CSPMonitor.disable();

const meetingSession = new DefaultMeetingSession(...);
meetingSession.audioVideo.start()
```


## Amazon Voice Focus

To use [Amazon Voice Focus](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html), ensure that your policy includes the following:

* `script-src` and `script-src-elem`: `https://*.sdkassets.chime.aws` to load audio processing code to run in the browser’s audio renderer thread.
* `connect-src`: `https://*.sdkassets.chime.aws` to load model files via `fetch`.
* `worker-src`: `blob:` to load worker JavaScript across origins.
* `child-src`: `blob:` to load worker JavaScript across origins (only in Safari).

See the [Amazon Voice Focus guide](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html#content-security-policy) for more information.