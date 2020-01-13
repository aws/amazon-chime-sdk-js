// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import LogLevel from '../../../src/logger/LogLevel';
import NoOpLogger from '../../../src/logger/NoOpLogger';
import ScreenViewingSessionObserver from '../../../src/screenviewing/clientobserver/ScreenViewingSessionObserver';
import ScreenViewingDeltaRenderer from '../../../src/screenviewing/deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingDeltaSource from '../../../src/screenviewing/deltasource/ScreenViewingDeltaSource';
import DefaultScreenViewingMessageHandler from '../../../src/screenviewing/messagehandler/DefaultScreenViewingMessageHandler';
import ScreenViewingImageDimensions from '../../../src/screenviewing/messagehandler/ScreenViewingImageDimensions';
import ScreenViewingPacketType from '../../../src/screenviewing/session/ScreenViewingPacketType';
import ScreenViewingSession from '../../../src/screenviewing/session/ScreenViewingSession';
import ScreenViewingSessionConnectionRequest from '../../../src/screenviewing/session/ScreenViewingSessionConnectionRequest';
import ScreenViewingViewer from '../../../src/screenviewing/viewer/ScreenViewingViewer';

describe('DefaultScreenViewingMessageHandler', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const dataTail: Uint8Array = new Uint8Array([0x10, 0x11, 0x12]);
  const noOpScreenViewingSession: ScreenViewingSession = {
    withObserver(_observer: ScreenViewingSessionObserver): ScreenViewingSession {
      return this;
    },
    openConnection(_request: ScreenViewingSessionConnectionRequest): Promise<Event> {
      return Promise.resolve(Substitute.for<Event>());
    },
    closeConnection(): Promise<void> {
      return undefined;
    },
    send(_data: Uint8Array): Promise<void> {
      return undefined;
    },
  };
  const noOpDeltaRenderer: ScreenViewingDeltaRenderer = Substitute.for<
    ScreenViewingDeltaRenderer
  >();
  const noOpDeltaSource: ScreenViewingDeltaSource = {
    pendingDx: 0,
    pendingDy: 0,
    notShared: true,
    flushSyncBuffer(): void {},
  };
  const noOpViewer: ScreenViewingViewer = {
    start(): void {},
    stop(): void {},
    resizeAndSync(): void {},
  };

  describe('handleEchoRequest', () => {
    it('sends', (done: MochaDone) => {
      const data: Uint8Array = Uint8Array.of(0x04, ...dataTail);
      new DefaultScreenViewingMessageHandler(
        {
          ...noOpScreenViewingSession,
          send(data: Uint8Array): Promise<void> {
            expect(data).to.eql(Uint8Array.of(0x05, ...dataTail));
            done();
            return undefined;
          },
        },
        noOpDeltaRenderer,
        noOpDeltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleEchoRequest(new DataView(data.buffer));
    });

    it('send error does not bubble out', () => {
      const data: Uint8Array = Uint8Array.of(0x04, ...dataTail);
      new DefaultScreenViewingMessageHandler(
        {
          ...noOpScreenViewingSession,
          send(_data: Uint8Array): Promise<void> {
            throw new Error('send error');
          },
        },
        noOpDeltaRenderer,
        noOpDeltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleEchoRequest(new DataView(data.buffer));
    });
  });

  describe('handleSetup', () => {
    it('calculates dimensions and builds viewer, width divisible by mb', (done: MochaDone) => {
      const buffer: ArrayBuffer = new ArrayBuffer(13);
      const dataView: DataView = new DataView(buffer);
      dataView.setInt32(1, 1920);
      dataView.setInt32(5, 1080);
      dataView.setInt32(9, 16);
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        {
          ...noOpDeltaRenderer,
          buildViewer(imageDimensions: ScreenViewingImageDimensions): void {
            expect(imageDimensions.imageWidthPixels).to.equal(1920);
            expect(imageDimensions.imageHeightPixels).to.equal(1080);
            expect(imageDimensions.macroBlock).to.equal(16);
            expect(imageDimensions.screenWidth).to.equal(120);
            expect(imageDimensions.screenHeight).to.equal(68);
            expect(imageDimensions.edgeWidth).to.equal(16);
            expect(imageDimensions.edgeHeight).to.equal(8);
            expect(imageDimensions.tileWidth).to.equal(16);
            expect(imageDimensions.tileHeight).to.equal(16);
            done();
          },
        },
        noOpDeltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleSetup(dataView);
    });

    it('calculates dimensions and builds viewer, height divisible by mb', (done: MochaDone) => {
      const buffer: ArrayBuffer = new ArrayBuffer(13);
      const dataView: DataView = new DataView(buffer);
      dataView.setInt32(1, 1080);
      dataView.setInt32(5, 1920);
      dataView.setInt32(9, 16);
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        {
          ...noOpDeltaRenderer,
          buildViewer(imageDimensions: ScreenViewingImageDimensions): void {
            expect(imageDimensions.imageWidthPixels).to.equal(1080);
            expect(imageDimensions.imageHeightPixels).to.equal(1920);
            expect(imageDimensions.macroBlock).to.equal(16);
            expect(imageDimensions.screenWidth).to.equal(68);
            expect(imageDimensions.screenHeight).to.equal(120);
            expect(imageDimensions.edgeWidth).to.equal(8);
            expect(imageDimensions.edgeHeight).to.equal(16);
            expect(imageDimensions.tileWidth).to.equal(16);
            expect(imageDimensions.tileHeight).to.equal(16);
            done();
          },
        },
        noOpDeltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleSetup(dataView);
    });
  });

  describe('handleDelta', () => {
    it('sets pending dx and dy in delta source', () => {
      const buffer: ArrayBuffer = new ArrayBuffer(8);
      const dataView: DataView = new DataView(buffer);
      dataView.setUint8(1, 10);
      dataView.setUint8(2, 20);
      const deltaSource: ScreenViewingDeltaSource = {
        ...noOpDeltaSource,
        pendingDx: 0,
        pendingDy: 0,
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        noOpDeltaRenderer,
        deltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleDelta(new DataView(dataView.buffer));
      expect(deltaSource.pendingDx).to.equal(10);
      expect(deltaSource.pendingDy).to.equal(20);
    });
  });

  describe('handleSync', () => {
    it('handles the sync when not shared', () => {
      let flushedSyncBuffer = false;
      let viewerSyncd = false;
      const deltaSource: ScreenViewingDeltaSource = {
        ...noOpDeltaSource,
        notShared: true,
        flushSyncBuffer(): void {
          flushedSyncBuffer = true;
        },
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        noOpDeltaRenderer,
        deltaSource,
        {
          ...noOpViewer,
          resizeAndSync(): void {
            viewerSyncd = true;
          },
        },
        new NoOpLogger(LogLevel.DEBUG)
      ).handleSync(null);
      expect(flushedSyncBuffer && viewerSyncd && !deltaSource.notShared).to.equal(true);
    });

    it('handles the sync when shared', () => {
      let flushedSyncBuffer = false;
      let viewerSyncd = false;
      const deltaSource: ScreenViewingDeltaSource = {
        ...noOpDeltaSource,
        notShared: false,
        flushSyncBuffer(): void {
          flushedSyncBuffer = true;
        },
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        noOpDeltaRenderer,
        deltaSource,
        {
          ...noOpViewer,
          resizeAndSync(): void {
            viewerSyncd = true;
          },
        },
        new NoOpLogger(LogLevel.DEBUG)
      ).handleSync(null);
      expect(flushedSyncBuffer && viewerSyncd && deltaSource.notShared).to.equal(false);
    });
  });

  describe('handleNoScreen', () => {
    it('handles', () => {
      const deltaSource: ScreenViewingDeltaSource = {
        ...noOpDeltaSource,
        notShared: false,
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        noOpDeltaRenderer,
        deltaSource,
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleNoScreen(null);
      expect(deltaSource.notShared).to.equal(true);
    });
  });

  describe('handleEndScreen', () => {
    it('stops', (done: MochaDone) => {
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        noOpDeltaRenderer,
        noOpDeltaSource,
        {
          ...noOpViewer,
          stop(): void {
            done();
          },
        },
        new NoOpLogger(LogLevel.DEBUG)
      ).handleEndScreen(null);
    });
  });

  describe('handleDefault', () => {
    it('no-ops on no handle', () => {
      const buffer: ArrayBuffer = new ArrayBuffer(8);
      const dataView: DataView = new DataView(buffer);
      dataView.setUint8(0, 0);
      dataView.setUint8(1, 0);
      const deltaRenderer: ScreenViewingDeltaRenderer = {
        ...noOpDeltaRenderer,
        syncBuffer: [[]],
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        deltaRenderer,
        { ...noOpDeltaSource, pendingDx: 0, pendingDy: 0 },
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleDefault(dataView);
      expect(deltaRenderer.syncBuffer[0][0]).to.not.exist;
    });

    it('sets the sync buffer', () => {
      const buffer: ArrayBuffer = new ArrayBuffer(8);
      const dataView: DataView = new DataView(buffer);
      dataView.setUint8(0, ScreenViewingPacketType.JPEG_HEADER_BYTE_0);
      dataView.setUint8(1, ScreenViewingPacketType.JPEG_HEADER_BYTE_1);
      const deltaRenderer: ScreenViewingDeltaRenderer = {
        ...noOpDeltaRenderer,
        syncBuffer: [[]],
      };
      new DefaultScreenViewingMessageHandler(
        noOpScreenViewingSession,
        deltaRenderer,
        { ...noOpDeltaSource, pendingDx: 0, pendingDy: 0 },
        noOpViewer,
        new NoOpLogger(LogLevel.DEBUG)
      ).handleDefault(dataView);
      expect(deltaRenderer.syncBuffer[0][0]).to.eql(new Uint8Array(dataView.buffer));
    });
  });
});
