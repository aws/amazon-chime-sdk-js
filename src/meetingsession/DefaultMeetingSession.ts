// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
import Destroyable, { isDestroyable } from '../destroyable/Destroyable';
import DeviceController from '../devicecontroller/DeviceController';
import EventIngestionConfiguration from '../eventingestionconfiguration/EventIngestionConfiguration';
import DefaultMeetingEventReporter from '../eventreporter/DefaultMeetingEventReporter';
import EventReporter from '../eventreporter/EventReporter';
import EventsClientConfiguration from '../eventsclientconfiguration/EventsClientConfiguration';
import MeetingEventsClientConfiguration from '../eventsclientconfiguration/MeetingEventsClientConfiguration';
import Logger from '../logger/Logger';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import DefaultReconnectController from '../reconnectcontroller/DefaultReconnectController';
import DefaultWebSocketAdapter from '../websocketadapter/DefaultWebSocketAdapter';
import MeetingSession from './MeetingSession';
import MeetingSessionConfiguration from './MeetingSessionConfiguration';

export default class DefaultMeetingSession implements MeetingSession, Destroyable {
  private _configuration: MeetingSessionConfiguration;
  private _logger: Logger;
  private audioVideoController: AudioVideoController;
  private contentShareController: ContentShareController;
  private _deviceController: DeviceController;
  private audioVideoFacade: AudioVideoFacade;
  private _eventReporter: EventReporter;

  constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    deviceController: DeviceControllerBasedMediaStreamBroker,
    eventReporter?: EventReporter
  ) {
    this._configuration = configuration;
    this._logger = logger;

    this.checkBrowserSupportAndFeatureConfiguration();

    this.setupEventReporter(configuration, logger, eventReporter);
    this._deviceController = deviceController;
    this.audioVideoController = new DefaultAudioVideoController(
      this._configuration,
      this._logger,
      new DefaultWebSocketAdapter(this._logger),
      deviceController,
      new DefaultReconnectController(
        this._configuration.reconnectTimeoutMs,
        new FullJitterBackoff(
          this._configuration.reconnectFixedWaitMs,
          this._configuration.reconnectShortBackOffMs,
          this._configuration.reconnectLongBackOffMs
        )
      ),
      this._eventReporter
    );
    deviceController.bindToAudioVideoController(this.audioVideoController);
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
          this._configuration.reconnectTimeoutMs,
          new FullJitterBackoff(
            this._configuration.reconnectFixedWaitMs,
            this._configuration.reconnectShortBackOffMs,
            this._configuration.reconnectLongBackOffMs
          )
        )
      ),
      this.audioVideoController
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

  get deviceController(): DeviceController {
    return this._deviceController;
  }

  get eventReporter(): EventReporter {
    return this._eventReporter;
  }

  /**
   * Clean up this instance and resources that it created.
   *
   * After calling `destroy`, internal fields like `audioVideoController` will be unavailable.
   */
  async destroy(): Promise<void> {
    if (isDestroyable(this.contentShareController)) {
      await this.contentShareController.destroy();
    }
    if (isDestroyable(this.audioVideoController)) {
      await this.audioVideoController.destroy();
    }
    if (isDestroyable(this.eventReporter)) {
      await this.eventReporter.destroy();
    }

    this._logger = undefined;
    this._configuration = undefined;
    this._deviceController = undefined;
    this.audioVideoFacade = undefined;
    this.audioVideoController = undefined;
    this.contentShareController = undefined;
    this._eventReporter = undefined;
  }

  private setupEventReporter(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    eventReporter?: EventReporter
  ): void {
    if (eventReporter) {
      this._eventReporter = eventReporter;
    } else {
      const eventIngestionURL = configuration.urls.eventIngestionURL;
      if (eventIngestionURL) {
        this.logger.info(`Event ingestion URL is present in the configuration`);
        const {
          meetingId,
          credentials: { attendeeId, joinToken },
        } = configuration;
        const meetingEventsClientConfiguration: EventsClientConfiguration = new MeetingEventsClientConfiguration(
          meetingId,
          attendeeId,
          joinToken
        );
        const eventIngestionConfiguration = new EventIngestionConfiguration(
          meetingEventsClientConfiguration,
          eventIngestionURL
        );
        this._eventReporter = new DefaultMeetingEventReporter(eventIngestionConfiguration, logger);
      }
    }
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
