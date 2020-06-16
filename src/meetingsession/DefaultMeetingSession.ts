// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import DefaultAudioVideoController from '../audiovideocontroller/DefaultAudioVideoController';
import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import DefaultAudioVideoFacade from '../audiovideofacade/DefaultAudioVideoFacade';
import FullJitterBackoff from '../backoff/FullJitterBackoff';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import ContentShareController from '../contentsharecontroller/ContentShareController';
import ContentShareMediaStreamBroker from '../contentsharecontroller/ContentShareMediaStreamBroker';
import DefaultContentShareController from '../contentsharecontroller/DefaultContentShareController';
import DeviceController from '../devicecontroller/DeviceController';
import Logger from '../logger/Logger';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import DefaultReconnectController from '../reconnectcontroller/DefaultReconnectController';
import DefaultScreenShareFacade from '../screensharefacade/DefaultScreenShareFacade';
import ScreenShareFacade from '../screensharefacade/ScreenShareFacade';
import DefaultScreenShareViewFacade from '../screenshareviewfacade/DefaultScreenShareViewFacade';
import ScreenShareViewFacade from '../screenshareviewfacade/ScreenShareViewFacade';
import DefaultWebSocketAdapter from '../websocketadapter/DefaultWebSocketAdapter';
import MeetingSession from './MeetingSession';
import MeetingSessionConfiguration from './MeetingSessionConfiguration';

export default class DefaultMeetingSession implements MeetingSession {
  private _configuration: MeetingSessionConfiguration;
  private _logger: Logger;
  private audioVideoController: AudioVideoController;
  private contentShareController: ContentShareController;
  private _deviceController: DeviceController;
  private screenShareFacade: ScreenShareFacade;
  private screenShareViewFacade: ScreenShareViewFacade;
  private audioVideoFacade: AudioVideoFacade;

  private static RECONNECT_TIMEOUT_MS = 120 * 1000;
  private static RECONNECT_FIXED_WAIT_MS = 0;
  private static RECONNECT_SHORT_BACKOFF_MS = 1 * 1000;
  private static RECONNECT_LONG_BACKOFF_MS = 5 * 1000;

  constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    deviceController: DeviceControllerBasedMediaStreamBroker
  ) {
    this._configuration = configuration;
    this._logger = logger;

    this.checkBrowserSupportAndFeatureConfiguration();

    this._deviceController = deviceController;
    this._deviceController.enableWebAudio(configuration.enableWebAudio);
    this.audioVideoController = new DefaultAudioVideoController(
      this._configuration,
      this._logger,
      new DefaultWebSocketAdapter(this._logger),
      deviceController,
      new DefaultReconnectController(
        DefaultMeetingSession.RECONNECT_TIMEOUT_MS,
        new FullJitterBackoff(
          DefaultMeetingSession.RECONNECT_FIXED_WAIT_MS,
          DefaultMeetingSession.RECONNECT_SHORT_BACKOFF_MS,
          DefaultMeetingSession.RECONNECT_LONG_BACKOFF_MS
        )
      )
    );
    deviceController.bindToAudioVideoController(this.audioVideoController);
    this.screenShareFacade = new DefaultScreenShareFacade(
      this._configuration,
      this._logger,
      deviceController
    );
    this.screenShareViewFacade = new DefaultScreenShareViewFacade(
      this._configuration,
      this._logger
    );
    const contentShareMediaStreamBroker = new ContentShareMediaStreamBroker(this._logger);
    this.contentShareController = new DefaultContentShareController(
      contentShareMediaStreamBroker,
      new DefaultAudioVideoController(
        DefaultContentShareController.createContentShareMeetingSessionConfigure(
          this._configuration
        ),
        this._logger,
        new DefaultWebSocketAdapter(this._logger),
        contentShareMediaStreamBroker,
        new DefaultReconnectController(
          DefaultMeetingSession.RECONNECT_TIMEOUT_MS,
          new FullJitterBackoff(
            DefaultMeetingSession.RECONNECT_FIXED_WAIT_MS,
            DefaultMeetingSession.RECONNECT_SHORT_BACKOFF_MS,
            DefaultMeetingSession.RECONNECT_LONG_BACKOFF_MS
          )
        )
      )
    );
    this.audioVideoFacade = new DefaultAudioVideoFacade(
      this.audioVideoController,
      this.audioVideoController.videoTileController,
      this.audioVideoController.realtimeController,
      this.audioVideoController.audioMixController,
      this._deviceController,
      this.contentShareController
    );
  }

  get configuration(): MeetingSessionConfiguration {
    return this._configuration;
  }

  get logger(): Logger {
    return this._logger;
  }

  get audioVideo(): AudioVideoFacade {
    return this.audioVideoFacade;
  }

  get contentShare(): ContentShareController {
    return this.contentShareController;
  }

  get screenShare(): ScreenShareFacade {
    return this.screenShareFacade;
  }

  get screenShareView(): ScreenShareViewFacade {
    return this.screenShareViewFacade;
  }

  get deviceController(): DeviceController {
    return this._deviceController;
  }

  private checkBrowserSupportAndFeatureConfiguration(): void {
    const browserBehavior = new DefaultBrowserBehavior();
    const browser = `${browserBehavior.name()} ${browserBehavior.majorVersion()} (${browserBehavior.version()})`;
    this.logger.info(`browser is ${browser}`);
    if (!browserBehavior.isSupported()) {
      this.logger.warn(
        'this browser is not currently supported. ' +
          'Stability may suffer. ' +
          `Supported browsers are: ${browserBehavior.supportString()}.`
      );
    }

    if (this._configuration.enableUnifiedPlanForChromiumBasedBrowsers) {
      if (browserBehavior.hasChromiumWebRTC()) {
        this.logger.info('WebRTC unified plan for Chromium-based browsers is enabled');
      } else {
        this.logger.info(`WebRTC unified plan is required for ${browserBehavior.name()}`);
      }
    }

    if (this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers) {
      if (!this._configuration.enableUnifiedPlanForChromiumBasedBrowsers) {
        this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        this.logger.info(
          'Simulcast requires enabling WebRTC Unified Plan for Chromium-based browsers'
        );
      } else if (browserBehavior.hasChromiumWebRTC()) {
        this.logger.info(`Simulcast is enabled for ${browserBehavior.name()}`);
      } else {
        this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        this.logger.info(
          'Simulcast requires WebRTC Unified Plan and is only supported on Chromium-based browsers'
        );
      }
    }
  }
}
