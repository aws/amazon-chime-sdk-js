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
import CSPMonitor from '../cspmonitor/CSPMonitor';
import Destroyable, { isDestroyable } from '../destroyable/Destroyable';
import DeviceController from '../devicecontroller/DeviceController';
import DefaultEventController from '../eventcontroller/DefaultEventController';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import DeviceControllerBasedMediaStreamBroker from '../mediastreambroker/DeviceControllerBasedMediaStreamBroker';
import DefaultReconnectController from '../reconnectcontroller/DefaultReconnectController';
import SimulcastUplinkPolicy from '../videouplinkbandwidthpolicy/SimulcastUplinkPolicy';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
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

  constructor(
    configuration: MeetingSessionConfiguration,
    logger: Logger,
    deviceController: DeviceControllerBasedMediaStreamBroker,
    private _eventController?: EventController
  ) {
    this._configuration = configuration;
    this._logger = logger;

    this.checkBrowserSupportAndFeatureConfiguration();

    CSPMonitor.addLogger(this._logger);
    CSPMonitor.register();
    if (!this._eventController) {
      this._eventController = new DefaultEventController(configuration, logger);
    }
    /* istanbul ignore else */
    if (!deviceController.eventController) {
      deviceController.eventController = this.eventController;
    }
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
      this.eventController
    );
    this._deviceController = deviceController;
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

  get eventController(): EventController {
    return this._eventController;
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
    if (isDestroyable(this.eventController)) {
      await this.eventController.destroy();
    }

    CSPMonitor.removeLogger(this._logger);

    this._logger = undefined;
    this._configuration = undefined;
    this._deviceController = undefined;
    this.audioVideoFacade = undefined;
    this.audioVideoController = undefined;
    this.contentShareController = undefined;
    this._eventController = undefined;
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

    // Validation if a custom video uplink policy is specified
    if (this._configuration.videoUplinkBandwidthPolicy) {
      if (this.isSimulcastUplinkPolicy(this._configuration.videoUplinkBandwidthPolicy)) {
        if (!browserBehavior.hasChromiumWebRTC()) {
          throw new Error('Simulcast is only supported on Chromium-based browsers');
        }
        this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
      } else {
        this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
      }
    }

    if (this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers) {
      if (browserBehavior.hasChromiumWebRTC()) {
        this.logger.info(`Simulcast is enabled for ${browserBehavior.name()}`);
      } else {
        this._configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        this.logger.info('Simulcast is only supported on Chromium-based browsers');
      }
    }
  }

  private isSimulcastUplinkPolicy(policy: VideoUplinkBandwidthPolicy | undefined): boolean {
    return !!(policy && (policy as SimulcastUplinkPolicy).addObserver);
  }
}
