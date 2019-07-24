// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Logger from '../../logger/Logger';
import ScreenViewingDeltaRenderer from '../deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingDeltaSource from '../deltasource/ScreenViewingDeltaSource';
import ScreenViewingPacketType from '../session/ScreenViewingPacketType';
import ScreenViewingSession from '../session/ScreenViewingSession';
import ScreenViewingViewer from '../viewer/ScreenViewingViewer';
import ScreenViewingImageDimensions from './ScreenViewingImageDimensions';
import ScreenViewingMessageHandler from './ScreenViewingMessageHandler';

export default class DefaultScreenViewingMessageHandler implements ScreenViewingMessageHandler {
  constructor(
    private client: ScreenViewingSession,
    private deltaRenderer: ScreenViewingDeltaRenderer,
    private deltaSource: ScreenViewingDeltaSource,
    private viewer: ScreenViewingViewer,
    private logger: Logger
  ) {}

  handleEchoRequest(dataView: DataView): void {
    this.logger.info('DefaultScreenViewingMessageHandler: Handling echo request message');
    dataView.setUint8(0, ScreenViewingPacketType.ECHO_RESPONSE);
    this.client.send(new Uint8Array(dataView.buffer));
  }

  handleSetup(dataView: DataView): void {
    const width = dataView.getInt32(1);
    const height = dataView.getInt32(5);
    const macroBlock = dataView.getInt32(9);
    this.logger.info(
      `DefaultScreenViewingMessageHandler: Handling setup message, received width = ${width}, height = ${height}, and macro block = ${macroBlock}`
    );
    const imageDimensions: ScreenViewingImageDimensions = DefaultScreenViewingMessageHandler.calculateImageDimensions(
      width,
      height,
      macroBlock
    );
    this.deltaRenderer.buildViewer(imageDimensions);
  }

  // TODO: Move into a component
  private static calculateImageDimensions(
    width: number,
    height: number,
    macroBlock: number
  ): ScreenViewingImageDimensions {
    const widthRemainder: number = width % macroBlock;
    const heightRemainder: number = height % macroBlock;
    return {
      imageWidthPixels: width,
      imageHeightPixels: height,
      macroBlock: macroBlock,
      screenWidth: Math.floor(width / macroBlock) + (widthRemainder === 0 ? 0 : 1),
      screenHeight: Math.floor(height / macroBlock) + (heightRemainder === 0 ? 0 : 1),
      edgeWidth: widthRemainder === 0 ? macroBlock : widthRemainder,
      edgeHeight: heightRemainder === 0 ? macroBlock : heightRemainder,
      tileWidth: macroBlock,
      tileHeight: macroBlock,
    };
  }

  handleDelta(dataView: DataView): void {
    this.logger.debug(() => 'DefaultScreenViewingMessageHandler: Handling delta');
    const x: number = dataView.getUint8(1);
    const y: number = dataView.getUint8(2);
    this.deltaSource.pendingDx = x;
    this.deltaSource.pendingDy = y;
  }

  handleSync(_dataView: DataView): void {
    this.logger.debug(() => 'DefaultScreenViewingMessageHandler: Handling sync');
    this.deltaSource.flushSyncBuffer();
    this.viewer.resizeAndSync();
    if (this.deltaSource.notShared) {
      this.deltaSource.notShared = false;
    }
  }

  handleNoScreen(_dataView: DataView): void {
    this.logger.info('DefaultScreenViewingMessageHandler: Handling no screen');
    this.deltaSource.notShared = true;
  }

  handleEndScreen(_dataView: DataView): void {
    this.logger.info('DefaultScreenViewingMessageHandler: Handling end screen');
    this.viewer.stop();
  }

  // TODO: Move into a component
  handleDefault(dataView: DataView): void {
    this.logger.debug(() => 'DefaultScreenViewingMessageHandler: Handling default');
    const b0: number = dataView.getUint8(0);
    const b1: number = dataView.getUint8(1);
    if (!DefaultScreenViewingMessageHandler.shouldHandle(b0, b1)) {
      return;
    }
    const dx: number = this.deltaSource.pendingDx;
    const dy: number = this.deltaSource.pendingDy;
    this.deltaRenderer.syncBuffer[dy][dx] = new Uint8Array(dataView.buffer);
  }

  private static shouldHandle(b0: number, b1: number): boolean {
    return (
      b0 === ScreenViewingPacketType.JPEG_HEADER_BYTE_0 &&
      b1 === ScreenViewingPacketType.JPEG_HEADER_BYTE_1
    );
  }
}
