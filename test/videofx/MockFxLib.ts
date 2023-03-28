// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import * as fetch from '../../libs/voicefocus/fetch';
import { VideoFxConfig } from '../../src';
import { VideoFxRenderer } from '../../src/videofx/VideoFxRenderer';
import DOMMockBehavior from '../dommock/DOMMockBehavior';

/**
 * This is a mock for our FxLib which is used to represent the external
 * assets that would be fetched in production
 */
export default class MockFxLib {
  private commonsSandbox: sinon.SinonSandbox;
  private domBehavior: DOMMockBehavior;

  // Sets the sandbox to the one being used in unit tests
  setSandbox(sandbox: sinon.SinonSandbox): void {
    this.commonsSandbox = sandbox;
  }

  setDomBehavior(domBehavior: DOMMockBehavior): void {
    this.domBehavior = domBehavior;
  }

  stubSuccess(): void {
    this.domBehavior.responseStatusCode = 200;
    this.domBehavior.scriptHasParent = true;
    this.configureVideoFxRenderer();
  }

  stubFailedFetch(): void {
    this.domBehavior.responseStatusCode = 404;
    this.domBehavior.scriptHasParent = true;
    this.configureVideoFxRenderer();
  }

  stubFailedInitialize(): void {
    this.domBehavior.responseStatusCode = 200;
    this.domBehavior.scriptHasParent = false;
  }

  private configureVideoFxRenderer(): void {
    async function mockConfigure(
      _width: number,
      _height: number,
      _effectConfig: VideoFxConfig
    ): Promise<void> {}
    async function mockRender(
      _inputCanvas: HTMLCanvasElement,
      _segmentationMask: ImageData
    ): Promise<void> {}
    async function mockSetBackgroundReplacementCanvas(
      _backgroundReplacementCanvas: HTMLCanvasElement
    ): Promise<void> {}

    const mockVideoFxRenderer: VideoFxRenderer = {
      render: mockRender,
      configure: mockConfigure,
      setBackgroundReplacementCanvas: mockSetBackgroundReplacementCanvas,
    };

    // Configure the fetch to fxlib
    const fetchWithBehaviorPromise = new Promise<Response>(resolve => {
      resolve(new Response());
    });
    this.commonsSandbox.stub(fetch, 'fetchWithBehavior').returns(fetchWithBehaviorPromise);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).constructRenderer = function constructRenderer(
      _width: number,
      _height: number,
      _effectConfig: VideoFxConfig,
      _outputCanvas: HTMLCanvasElement
    ): VideoFxRenderer {
      return mockVideoFxRenderer;
    };
  }
}
