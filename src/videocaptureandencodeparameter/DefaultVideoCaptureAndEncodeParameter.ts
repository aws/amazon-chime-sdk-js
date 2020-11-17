// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoCaptureAndEncodeParameter from './VideoCaptureAndEncodeParameter';

export default class DefaultVideoCaptureAndEncodeParameter
  implements VideoCaptureAndEncodeParameter {
  constructor(
    private cameraWidth: number,
    private cameraHeight: number,
    private cameraFrameRate: number,
    private maxEncodeBitrateKbps: number,
    private isSimulcast: boolean
  ) {}

  equal(other: DefaultVideoCaptureAndEncodeParameter): boolean {
    let checkForEqual: boolean =
      other.captureWidth() === this.cameraWidth &&
      other.captureHeight() === this.cameraHeight &&
      other.captureFrameRate() === this.cameraFrameRate &&
      other.encodeBitrates().length === this.encodeBitrates().length &&
      other.encodeWidths().length === this.encodeWidths().length &&
      other.encodeHeights().length === this.encodeHeights().length;

    if (checkForEqual) {
      for (let i = 0; i < other.encodeWidths().length; i++) {
        if (
          other.encodeWidths()[i] !== this.encodeWidths()[i] ||
          other.encodeHeights()[i] !== this.encodeHeights()[i] ||
          other.encodeBitrates()[i] !== this.encodeBitrates()[i]
        ) {
          checkForEqual = false;
          return checkForEqual;
        }
      }
    }

    return checkForEqual;
  }

  clone(): DefaultVideoCaptureAndEncodeParameter {
    return new DefaultVideoCaptureAndEncodeParameter(
      this.cameraWidth,
      this.cameraHeight,
      this.cameraFrameRate,
      this.maxEncodeBitrateKbps,
      this.isSimulcast
    );
  }

  captureWidth(): number {
    return this.cameraWidth;
  }

  captureHeight(): number {
    return this.cameraHeight;
  }

  captureFrameRate(): number {
    return this.cameraFrameRate;
  }

  encodeBitrates(): number[] {
    // TODO: add simulcast layer
    return [this.maxEncodeBitrateKbps];
  }

  encodeWidths(): number[] {
    return [this.cameraWidth];
  }

  encodeHeights(): number[] {
    return [this.cameraHeight];
  }
}
