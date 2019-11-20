// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackoffFactory from '../backoff/BackoffFactory';
import FullJitterBackoffFactory from '../backoff/FullJitterBackoffFactory';
import DefaultDOMWebSocketFactory from '../domwebsocket/DefaultDOMWebSocketFactory';
import DOMWebSocketFactory from '../domwebsocket/DOMWebSocketFactory';
import Logger from '../logger/Logger';
import Maybe from '../maybe/Maybe';
import MediaRecordingFactory from '../mediarecording/MediaRecordingFactory';
import MediaRecordingOptions from '../mediarecording/MediaRecordingOptions';
import WebMMediaRecordingFactory from '../mediarecording/WebMMediaRecordingFactory';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import DefaultPromisedWebSocketFactory from '../promisedwebsocket/DefaultPromisedWebSocketFactory';
import PromisedWebSocketFactory from '../promisedwebsocket/PromisedWebSocketFactory';
import ReconnectingPromisedWebSocketFactory from '../promisedwebsocket/ReconnectingPromisedWebSocketFactory';
import ProtocolScreenMessageDetailSerialization from '../screenmessagedetailserialization/ProtocolScreenMessageDetailSerialization';
import ScreenMessageDetailSerialization from '../screenmessagedetailserialization/ScreenMessageDetailSerialization';
import ScreenShareStreamFactory from '../screensharestreaming/ScreenShareStreamFactory';
import ScreenShareStreamingFactory from '../screensharestreaming/ScreenShareStreamingFactory';
import ScreenSharingMessageFlagSerialization from '../screensharingmessageserialization/ScreenSharingMessageFlagSerialization';
import ScreenSharingMessageFlagSerializer from '../screensharingmessageserialization/ScreenSharingMessageFlagSerializer';
import ScreenSharingMessageSerialization from '../screensharingmessageserialization/ScreenSharingMessageSerialization';
import ScreenSharingMessageSerializer from '../screensharingmessageserialization/ScreenSharingMessageSerializer';
import ScreenSharingMessageTypeSerialization from '../screensharingmessageserialization/ScreenSharingMessageTypeSerialization';
import ScreenSharingMessageTypeSerializer from '../screensharingmessageserialization/ScreenSharingMessageTypeSerializer';
import DefaultScreenSharingSessionFactory from './DefaultScreenSharingSessionFactory';
import ScreenSharingSessionFactory from './ScreenSharingSessionFactory';
import ScreenSharingSessionOptions from './ScreenSharingSessionOptions';

export default class ScreenSharingSessionContainer {
  private screenSharingSessionFactoryMemo: ScreenSharingSessionFactory | null = null;
  private backoffFactoryMemo: BackoffFactory | null = null;

  constructor(
    private mediaStreamBroker: MediaStreamBroker,
    private logger: Logger,
    private options: ScreenSharingSessionOptions = {}
  ) {}

  screenSharingSessionFactory(): ScreenSharingSessionFactory {
    this.screenSharingSessionFactoryMemo =
      this.screenSharingSessionFactoryMemo ||
      new DefaultScreenSharingSessionFactory(
        this.displayMediaConstraints,
        this.reconnectingPromisedWebSocketFactory(),
        this.messageSerialization(),
        this.mediaStreamBroker,
        this.screenSharingStreamFactory(),
        this.mediaRecordingFactory(),
        this.logger
      );
    return this.screenSharingSessionFactoryMemo;
  }

  displayMediaConstraints(sourceId?: string): MediaStreamConstraints {
    return {
      audio: false,
      video: {
        ...(!sourceId && {
          frameRate: {
            max: 3,
          },
        }),
        ...(sourceId && {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxFrameRate: 3,
          },
        }),
      },
    };
  }

  private screenSharingStreamFactory(): ScreenShareStreamingFactory {
    return new ScreenShareStreamFactory();
  }

  private mediaRecordingFactory(): MediaRecordingFactory {
    const options: MediaRecordingOptions = {};
    Maybe.of(this.options.bitRate).map(f => (options.videoBitsPerSecond = f));
    return new WebMMediaRecordingFactory(options);
  }

  private reconnectingPromisedWebSocketFactory(): PromisedWebSocketFactory {
    return new ReconnectingPromisedWebSocketFactory(
      this.promisedWebSocketFactory(),
      this.backOffFactory(),
      Maybe.of(this.options.reconnectRetryLimit).getOrElse(5)
    );
  }

  private backOffFactory(): BackoffFactory {
    this.backoffFactoryMemo =
      this.backoffFactoryMemo || new FullJitterBackoffFactory(1000, 100, 300);
    return this.backoffFactoryMemo;
  }

  private promisedWebSocketFactory(): PromisedWebSocketFactory {
    return new DefaultPromisedWebSocketFactory(this.domWebSocketFactory());
  }

  private domWebSocketFactory(): DOMWebSocketFactory {
    return new DefaultDOMWebSocketFactory();
  }

  private messageSerialization(): ScreenSharingMessageSerialization {
    return new ScreenSharingMessageSerializer(
      this.typeSerialization(),
      this.flagSerialization(),
      this.screenSignalingSerialization()
    );
  }

  private typeSerialization(): ScreenSharingMessageTypeSerialization {
    return new ScreenSharingMessageTypeSerializer();
  }

  private flagSerialization(): ScreenSharingMessageFlagSerialization {
    return new ScreenSharingMessageFlagSerializer();
  }

  private screenSignalingSerialization(): ScreenMessageDetailSerialization {
    return new ProtocolScreenMessageDetailSerialization();
  }
}
