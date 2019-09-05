// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import ScreenSharingSession from '../screensharingsession/ScreenSharingSession';
import ScreenSharingSessionContainer from '../screensharingsession/ScreenSharingSessionContainer';
import RunnableTask from '../task/RunnableTask';
import ScreenShareFacade from './ScreenShareFacade';
import ScreenShareFacadeObserver from './ScreenShareFacadeObserver';

export default class DefaultScreenShareFacade implements ScreenShareFacade {
  private screenSharingSession: ScreenSharingSession;

  constructor(
    private configuration: MeetingSessionConfiguration,
    private logger: Logger,
    private mediaStreamBroker: MediaStreamBroker
  ) {
    const url = this.configuration.urls.screenSharingURL;

    // FIXME: this should be injected directly; determine what purpose this facade serves
    this.screenSharingSession = new ScreenSharingSessionContainer(
      this.mediaStreamBroker,
      this.logger,
      this.configuration.screenSharingSessionOptions
    )
      .screenSharingSessionFactory()
      .create(url, this.configuration.credentials.joinToken);
  }

  async open(): Promise<void> {
    await new RunnableTask<Event>(
      this.logger,
      (): Promise<Event> => {
        return this.screenSharingSession.open(this.configuration.screenSharingTimeoutMs);
      },
      'DefaultScreenShareFacadeOpen'
    ).run();
  }

  async close(): Promise<void> {
    await new RunnableTask<Event>(
      this.logger,
      (): Promise<Event> => {
        return this.screenSharingSession.close(this.configuration.screenSharingTimeoutMs);
      },
      'DefaultScreenShareFacadeClose'
    ).run();
  }

  async start(sourceId?: string): Promise<void> {
    await new RunnableTask<void>(
      this.logger,
      (): Promise<void> => {
        return this.screenSharingSession.start(sourceId);
      },
      'DefaultScreenShareFacadeStart'
    ).run();
  }

  async stop(): Promise<void> {
    await new RunnableTask<void>(
      this.logger,
      (): Promise<void> => {
        return this.screenSharingSession.stop();
      },
      'DefaultScreenShareFacadeStop'
    ).run();
  }

  registerObserver(observer: ScreenShareFacadeObserver): void {
    this.screenSharingSession.registerObserver(observer);
  }

  unregisterObserver(observer: ScreenShareFacadeObserver): void {
    this.screenSharingSession.deregisterObserver(observer);
  }
}
