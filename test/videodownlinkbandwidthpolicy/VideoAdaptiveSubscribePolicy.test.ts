// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoTileController from '../../src/audiovideocontroller/AudioVideoController';
import NoOpAudioVideoTileController from '../../src/audiovideocontroller/NoOpAudioVideoController';
import {
  SdkIndexFrame,
  SdkStreamDescriptor,
  SdkStreamMediaType,
} from '../../src/signalingprotocol/SignalingProtocol.js';
import VideoAdaptiveSubscribePolicy from '../../src/videodownlinkbandwidthpolicy/VideoAdaptiveSubscribePolicy';
import DefaultVideoStreamIndex from '../../src/videostreamindex/DefaultVideoStreamIndex';
import VideoTileController from '../../src/videotilecontroller/VideoTileController';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

describe('VideoAdaptiveSubscribePolicy', () => {
  const selfAttendeeId = 'self-cb7cb43b';
  let expect: Chai.ExpectStatic = chai.expect;
  let policy: VideoAdaptiveSubscribePolicy;
  let audioVideoController: AudioVideoTileController;
  let tileController: VideoTileController;
  let domMockBuilder: DOMMockBuilder;

  before(() => {
    domMockBuilder = new DOMMockBuilder();
    audioVideoController = new NoOpAudioVideoTileController();
    tileController = audioVideoController.videoTileController;
    policy = new VideoAdaptiveSubscribePolicy(selfAttendeeId, tileController);
  });

  after(() => {
    domMockBuilder.cleanup();
  });

  describe('wantsResubscribe', () => {
    it('returns false if policy is just initialized', () => {
      expect(policy.wantsResubscribe()).to.equal(false);
    });

    it('returns true if policy is updated with indexframe', () => {
      const index = new DefaultVideoStreamIndex(audioVideoController.logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );
      policy.updateIndex(index);
      expect(policy.wantsResubscribe()).to.equal(true);
    });
  });

  describe('chooseSubscriptions', () => {
    it('returns correct indices after policy is only updated with SdkIndexFrame', () => {
      const index = new DefaultVideoStreamIndex(audioVideoController.logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 4, 6]);
    });

    it('returns corrent indices after policy is updated with SdkIndexFrame and bandwidth', () => {
      const index = new DefaultVideoStreamIndex(audioVideoController.logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      policy.updateAvailableBandwidth(1000);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([2, 3, 6]);
    });

    it('returns corrent indices after policy is updated with SdkIndexFrame and bandwidth', () => {
      class MediaClientSmallNoOpHTMLVideoElement {
        static create(): HTMLVideoElement {
          const x = {
            clientWidth: 210,
            clientHeight: 180,
            width: 210,
            height: 180,
            videoWidth: 210,
            videoHeight: 180,
            style: {
              transform: '',
            },
            hasAttribute: (_x: string): boolean => {
              return false;
            },
            removeAttribute: (_x: string): void => {},
            setAttribute: (_x: string, _y: boolean): void => {},
            srcObject: false,
          };
          // @ts-ignore
          return x;
        }
      }

      class MediaClientLargeNoOpHTMLVideoElement {
        static create(): HTMLVideoElement {
          const x = {
            clientWidth: 640,
            clientHeight: 480,
            width: 640,
            height: 480,
            videoWidth: 640,
            videoHeight: 480,
            style: {
              transform: '',
            },
            hasAttribute: (_x: string): boolean => {
              return false;
            },
            removeAttribute: (_x: string): void => {},
            setAttribute: (_x: string, _y: boolean): void => {},
            srcObject: false,
          };
          // @ts-ignore
          return x;
        }
      }
      const tileId = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId, MediaClientSmallNoOpHTMLVideoElement.create());
      let tile = tileController.getVideoTile(tileId);
      // @ts-ignore
      const stream: MediaStream = {};
      tile.bindVideoStream('xy1', false, stream, 0, 0, 1);
      tile.stateRef().active = true;

      const tileId2 = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId2, MediaClientLargeNoOpHTMLVideoElement.create());
      tile = tileController.getVideoTile(tileId2);
      tile.bindVideoStream('xy2', false, stream, 0, 0, 1);
      tile.stateRef().active = true;

      const index = new DefaultVideoStreamIndex(audioVideoController.logger);
      index.integrateIndexFrame(
        new SdkIndexFrame({
          sources: [
            new SdkStreamDescriptor({
              streamId: 8,
              groupId: 4,
              maxBitrateKbps: 300,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 7,
              groupId: 4,
              maxBitrateKbps: 200,
              attendeeId: 'xy4',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 6,
              groupId: 2,
              maxBitrateKbps: 400,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 5,
              groupId: 2,
              maxBitrateKbps: 50,
              attendeeId: 'xy2',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 4,
              groupId: 399,
              maxBitrateKbps: 800,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 3,
              groupId: 399,
              maxBitrateKbps: 200,
              attendeeId: 'xy3',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 2,
              groupId: 1,
              maxBitrateKbps: 200,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
            new SdkStreamDescriptor({
              streamId: 1,
              groupId: 1,
              maxBitrateKbps: 100,
              attendeeId: 'xy1',
              mediaType: SdkStreamMediaType.VIDEO,
            }),
          ],
        })
      );

      policy.updateIndex(index);
      policy.updateAvailableBandwidth(1000);
      const subscriptions = policy.chooseSubscriptions();
      expect(subscriptions.array()).to.deep.equal([1, 3, 6, 7]);

      const tileId3 = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId3, MediaClientLargeNoOpHTMLVideoElement.create());
      tile = tileController.getVideoTile(tileId3);
      tile.bindVideoStream('xy3', false, stream, 0, 0, 1);
      tile.stateRef().active = true;
      policy.updateCalculatedOptimalReceiveSet();
      let wantsResubscribe = policy.wantsResubscribe();
      expect(wantsResubscribe).to.be.equal(false);

      const tileId4 = tileController.addVideoTile().id();
      tileController.bindVideoElement(tileId4, MediaClientLargeNoOpHTMLVideoElement.create());
      tile = tileController.getVideoTile(tileId4);
      tile.bindVideoStream('xy4', false, stream, 0, 0, 1);
      tile.stateRef().active = false;
      policy.updateCalculatedOptimalReceiveSet();
      wantsResubscribe = policy.wantsResubscribe();
      expect(wantsResubscribe).to.be.equal(false);
    });
  });
});
