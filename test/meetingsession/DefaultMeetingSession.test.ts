// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpAudioVideoController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import NoOpDeviceController, {
  NoOpDeviceControllerWithEventController,
} from '../../src/devicecontroller/NoOpDeviceController';
import DefaultEventController from '../../src/eventcontroller/DefaultEventController';
import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultMeetingSession from '../../src/meetingsession/DefaultMeetingSession';
import DefaultSimulcastUplinkPolicy from '../../src/videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy';
import NScaleVideoUplinkBandwidthPolicy from '../../src/videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('DefaultMeetingSession', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const OPERA_USERAGENT = 'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18';

  const setUserAgent = (userAgent: string): void => {
    // @ts-ignore
    navigator.userAgent = userAgent;
  };

  describe('constructor', () => {
    it('can be constructed and disposed of', async () => {
      const mockBuilder = new DOMMockBuilder();
      const deviceController = new NoOpDeviceController();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        deviceController
      );
      expect(session).to.exist;
      expect(session.audioVideo).to.exist;
      expect(session.configuration).to.exist;
      expect(session.logger).to.exist;
      expect(session.deviceController).to.exist;
      expect(session.contentShare).to.exist;
      mockBuilder.cleanup();
      expect(deviceController.destroyed).to.be.false;
      const csController = session.contentShare;

      await session.destroy();
      expect(session.contentShare).to.be.undefined;
      expect(session.deviceController).to.be.undefined;
      expect(deviceController.destroyed).to.be.false;
      // @ts-ignore
      expect(csController.destroyed).to.be.true;

      deviceController.destroy();
      expect(deviceController.destroyed).to.be.true;

      // This is safe to call twice.
      await session.destroy();
    });

    it('can be constructed with an unsupported browser', () => {
      const mockBuilder = new DOMMockBuilder();
      setUserAgent(OPERA_USERAGENT);
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      mockBuilder.cleanup();
    });

    describe('construct with simulcast', function () {
      it('can be constructed with simulcast feature for chromium-based browsers', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'chrome';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          true
        );
        mockBuilder.cleanup();
      });

      it('can be constructed with simulcast feature switched off for firefox', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'firefox';
        const mockBuilder = new DOMMockBuilder(domBehavior);

        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          false
        );
        mockBuilder.cleanup();
      });

      it('can be constructed with simulcast feature by passing simulcast uplink policy', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'chrome';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
        config.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
          'test',
          new NoOpLogger()
        );
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          true
        );
        expect(
          session.configuration.videoUplinkBandwidthPolicy instanceof DefaultSimulcastUplinkPolicy
        ).to.be.true;
        mockBuilder.cleanup();
      });

      it('enable simulcast if passing simulcast uplink policy', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'chrome';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        config.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
          'test',
          new NoOpLogger()
        );
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          true
        );
        expect(
          session.configuration.videoUplinkBandwidthPolicy instanceof DefaultSimulcastUplinkPolicy
        ).to.be.true;
        mockBuilder.cleanup();
      });

      it('throw error if passing simulcast uplink policy for firefox', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'firefox';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
        config.videoUplinkBandwidthPolicy = new DefaultSimulcastUplinkPolicy(
          'test',
          new NoOpLogger()
        );
        expect(() => {
          new DefaultMeetingSession(config, new NoOpLogger(), new NoOpDeviceController());
        }).to.throw('Simulcast is only supported on Chromium-based browsers');
        mockBuilder.cleanup();
        mockBuilder.cleanup();
      });

      it('disable simulcast feature if config uplink policy does not implement simulcast uplink policy', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'chrome';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;
        config.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('test');
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          false
        );
        expect(
          session.configuration.videoUplinkBandwidthPolicy instanceof
            NScaleVideoUplinkBandwidthPolicy
        ).to.be.true;
        mockBuilder.cleanup();
      });

      it('can pass in custom policy when simulcast is not enabled', () => {
        const domBehavior = new DOMMockBehavior();
        domBehavior.browserName = 'firefox';
        const mockBuilder = new DOMMockBuilder(domBehavior);
        const config = new NoOpAudioVideoController().configuration;

        config.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = false;
        config.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy('test');
        const session = new DefaultMeetingSession(
          config,
          new NoOpLogger(),
          new NoOpDeviceController()
        );
        expect(session).to.exist;
        expect(session.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers).to.equal(
          false
        );
        expect(
          session.configuration.videoUplinkBandwidthPolicy instanceof
            NScaleVideoUplinkBandwidthPolicy
        ).to.be.true;
        mockBuilder.cleanup();
      });
    });

    it('will contstruct an event controller', async () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController()
      );
      expect(session).to.exist;
      expect(session.eventController).to.exist;
      mockBuilder.cleanup();
      await session.destroy();
      expect(session.eventController).to.be.undefined;

      // This is safe to call twice.
      await session.destroy();
    });

    it('can be constructed with a custom event controler', () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceController(),
        new DefaultEventController(new NoOpAudioVideoController().configuration, new NoOpLogger())
      );
      expect(session).to.exist;
      expect(session.eventController).to.exist;
      mockBuilder.cleanup();
    });

    it('will set event controller for device controller if it does not have one', () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceControllerWithEventController(null)
      );
      expect(session).to.exist;
      expect(session.eventController).to.exist;
      expect(
        (session.deviceController as NoOpDeviceControllerWithEventController).eventController
      ).to.equal(session.eventController);
      mockBuilder.cleanup();
    });

    it('will not overwrite a existing device controller event controller', () => {
      const mockBuilder = new DOMMockBuilder();
      const session = new DefaultMeetingSession(
        new NoOpAudioVideoController().configuration,
        new NoOpLogger(),
        new NoOpDeviceControllerWithEventController(
          new DefaultEventController(new NoOpAudioVideoController().configuration, new NoOpLogger())
        )
      );
      expect(session).to.exist;
      expect(session.eventController).to.exist;
      expect(
        (session.deviceController as NoOpDeviceControllerWithEventController).eventController
      ).to.not.equal(session.eventController);
      mockBuilder.cleanup();
    });
  });
});
