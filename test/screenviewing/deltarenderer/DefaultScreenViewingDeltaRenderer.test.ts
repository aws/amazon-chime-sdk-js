// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute, SubstituteOf } from '@fluffy-spoon/substitute';
import * as chai from 'chai';
import { ResizeObserverCallback } from 'resize-observer/lib/ResizeObserverCallback';

import DragEvent from '../../../src/dragobserver/DragEvent';
import DragObserver, { DragObserverFactory } from '../../../src/dragobserver/DragObserver';
import DragType from '../../../src/dragobserver/DragType';
import JPEGDecoderController from '../../../src/jpegdecoder/controller/JPEGDecoderController';
import JPEGDecoderInstance from '../../../src/jpegdecoder/instance/JPEGDecoderInstance';
import Logger from '../../../src/logger/Logger';
import LogLevel from '../../../src/logger/LogLevel';
import NoOpLogger from '../../../src/logger/NoOpLogger';
import PresentationPolicy from '../../../src/presentation/policy/PresentationPolicy';
import ResizeObserverAdapter from '../../../src/resizeobserveradapter/ResizeObserverAdapter';
import DefaultScreenViewingDeltaRenderer from '../../../src/screenviewing/deltarenderer/DefaultScreenViewingDeltaRenderer';
import ScreenViewingDeltaRenderer from '../../../src/screenviewing/deltarenderer/ScreenViewingDeltaRenderer';
import ScreenViewingImageDimensions from '../../../src/screenviewing/messagehandler/ScreenViewingImageDimensions';

describe('DefaultScreenViewingDeltaRenderer', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger: Logger = new NoOpLogger(LogLevel.DEBUG);
  const controller: JPEGDecoderController = Substitute.for();

  const defaultImageDimensions: ScreenViewingImageDimensions = {
    imageWidthPixels: 4,
    imageHeightPixels: 4,
    macroBlock: 2,
    screenWidth: 2,
    screenHeight: 2,
    edgeWidth: 0,
    edgeHeight: 0,
    tileWidth: 0,
    tileHeight: 0,
  };

  describe('constructor', () => {
    it('builds', () => {
      let resizeObserverCallback: ResizeObserverCallback;
      let dragCallback: (dragEvent: DragEvent) => void;
      const renderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        {
          create(callback: ResizeObserverCallback): ResizeObserverAdapter {
            resizeObserverCallback = callback;
            return Substitute.for();
          },
        },
        () => Substitute.for()
      );
      renderer.changePresentationPolicy(Substitute.for());
      renderer.setViewport(Substitute.for());
      resizeObserverCallback && resizeObserverCallback(Substitute.for(), Substitute.for());
      dragCallback &&
        dragCallback({
          type: DragType.DRAG,
          coords: [1, 2],
        });
    });
  });

  describe('buildViewer', () => {
    it('builds', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer(defaultImageDimensions);
      expect(deltaRenderer.syncBuffer).to.exist;
      expect(deltaRenderer.jpegDataArrays).to.exist;
      expect(deltaRenderer.hasRendered).to.exist;
    });
  });

  describe('resizeAndSync', () => {
    it('skips if no jpeg decoder instance', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );

      deltaRenderer.resizeAndSync();
    });

    it('skips if no container', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );

      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 800,
        imageHeightPixels: 200,
        screenWidth: 2,
        screenHeight: 2,
      });
      deltaRenderer.resizeAndSync();
    });

    it('skips if too early', () => {
      const performance: SubstituteOf<Performance> = Substitute.for();
      performance.now().returns(0);

      const window: SubstituteOf<Window> = Substitute.for();
      window.performance.returns(performance);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 800,
        imageHeightPixels: 200,
        screenWidth: 2,
        screenHeight: 2,
      });
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.lastResizeAndSyncTime = 0;

      deltaRenderer.resizeAndSync();
    });

    it('skips if no context', () => {
      const performance: SubstituteOf<Performance> = Substitute.for();
      performance.now().returns(500);

      const canvas = {
        ...Substitute.for(),
        width: 200,
        height: 200,
        getContext(
          _contextId: '2d',
          _contextAttributes?: CanvasRenderingContext2DSettings
        ): CanvasRenderingContext2D | null {
          return undefined;
        },
      };

      const document: SubstituteOf<Document> = Substitute.for();
      document.createElement(Arg.any()).returns(canvas);

      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      style.width.returns('100px');
      style.height.returns('100px');
      style.left.returns('10px');
      style.top.returns('10px');

      const window: SubstituteOf<Window> = Substitute.for();
      window.performance.returns(performance);
      window.document.returns(document);
      window.getComputedStyle(Arg.any()).returns(style);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 200,
        imageHeightPixels: 200,
        screenWidth: 2,
        screenHeight: 2,
      });
      const presentationPolicy: SubstituteOf<PresentationPolicy> = Substitute.for();
      presentationPolicy.calculate(Arg.any(), Arg.any()).returns({
        dimensions: [100, 100],
        translations: [10, 10],
      });
      deltaRenderer.changePresentationPolicy(presentationPolicy);
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.lastResizeAndSyncTime = 0;
      deltaRenderer.jpegDataArrays = [
        [Uint8Array.of(), undefined],
        [undefined, Uint8Array.of()],
      ];
      deltaRenderer.hasRendered = [
        [true, true],
        [false, false],
      ];

      deltaRenderer.resizeAndSync();
      deltaRenderer.setViewport(Substitute.for());
    });

    it('resizes and renders for width', () => {
      const performance: SubstituteOf<Performance> = Substitute.for();
      performance.now().returns(500);

      const canvas: SubstituteOf<HTMLCanvasElement> = Substitute.for();
      canvas.width.returns(200);
      canvas.height.returns(200);

      const document: SubstituteOf<Document> = Substitute.for();
      document.createElement(Arg.any()).returns(canvas);

      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      style.width.returns('100px');
      style.height.returns('100px');
      style.left.returns('10px');
      style.top.returns('10px');

      const window: SubstituteOf<Window> = Substitute.for();
      window.performance.returns(performance);
      window.document.returns(document);
      window.getComputedStyle(Arg.any()).returns(style);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 800,
        imageHeightPixels: 200,
        screenWidth: 2,
        screenHeight: 2,
      });
      const presentationPolicy: SubstituteOf<PresentationPolicy> = Substitute.for();
      presentationPolicy.calculate(Arg.any(), Arg.any()).returns({
        dimensions: [100, 100],
        translations: [10, 10],
      });
      deltaRenderer.changePresentationPolicy(presentationPolicy);
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.lastResizeAndSyncTime = 0;
      deltaRenderer.jpegDataArrays = [
        [Uint8Array.of(), undefined],
        [undefined, Uint8Array.of()],
      ];
      deltaRenderer.hasRendered = [
        [true, true],
        [false, false],
      ];

      deltaRenderer.resizeAndSync();
    });

    it('resizes and renders for height', () => {
      const performance: SubstituteOf<Performance> = Substitute.for();
      performance.now().returns(500);

      const canvas: SubstituteOf<HTMLCanvasElement> = Substitute.for();
      canvas.width.returns(200);
      canvas.height.returns(200);

      const document: SubstituteOf<Document> = Substitute.for();
      document.createElement(Arg.any()).returns(canvas);

      const style: SubstituteOf<CSSStyleDeclaration> = Substitute.for();
      style.width.returns('100px');
      style.height.returns('100px');
      style.left.returns('10px');
      style.top.returns('10px');

      const window: SubstituteOf<Window> = Substitute.for();
      window.performance.returns(performance);
      window.document.returns(document);
      window.getComputedStyle(Arg.any()).returns(style);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 200,
        imageHeightPixels: 600,
      });
      const presentationPolicy: SubstituteOf<PresentationPolicy> = Substitute.for();
      presentationPolicy.calculate(Arg.any(), Arg.any()).returns({
        dimensions: [100, 100],
        translations: [10, 10],
      });

      deltaRenderer.changePresentationPolicy(presentationPolicy);
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.lastResizeAndSyncTime = 0;

      deltaRenderer.resizeAndSync();
    });

    it('renders for error', () => {
      const performance: SubstituteOf<Performance> = Substitute.for();
      performance.now().returns(500);

      const canvas: SubstituteOf<HTMLCanvasElement> = Substitute.for();
      canvas.width.returns(200);
      canvas.height.returns(200);

      const document: SubstituteOf<Document> = Substitute.for();
      document.createElement(Arg.any()).returns(canvas);

      const window: SubstituteOf<Window> = Substitute.for();
      window.performance.returns(performance);
      window.document.returns(document);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        {
          ...Substitute.for(),
          createInstance(_width: number, _height: number): JPEGDecoderInstance {
            return {
              ...Substitute.for(),
              decodeToImageData(_inputArray: Uint8Array): ImageData {
                throw new Error('test error');
              },
            };
          },
        },
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.buildViewer({
        ...Substitute.for(),
        imageWidthPixels: 200,
        imageHeightPixels: 200,
        screenWidth: 2,
        screenHeight: 2,
      });
      const presentationPolicy: SubstituteOf<PresentationPolicy> = Substitute.for();
      deltaRenderer.changePresentationPolicy(presentationPolicy);
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.lastResizeAndSyncTime = 0;
      deltaRenderer.jpegDataArrays = [
        [Uint8Array.of(), Uint8Array.of()],
        [Uint8Array.of(), Uint8Array.of()],
      ];

      deltaRenderer.resizeAndSync();
    });
  });

  describe('close', () => {
    it('closes', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        () => Substitute.for()
      );
      deltaRenderer.setViewport(Substitute.for());
      deltaRenderer.close();
    });
  });

  describe('setViewport', () => {
    it('sets the container', () => {
      const dragObserverFactory: DragObserverFactory = (
        window: Window,
        callback: (dragEvent: DragEvent) => void,
        _element: HTMLElement
      ): DragObserver => {
        callback({
          type: DragType.DRAG,
          coords: [0, 0],
        });
        return Substitute.for();
      };
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        dragObserverFactory
      );
      deltaRenderer.setViewport(Substitute.for());
    });
  });

  describe('zoom', () => {
    it('zooms', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.zoomRelative(2);
    });
  });

  describe('zoomAbsolute', () => {
    it('zooms', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.zoomAbsolute(2);
    });
  });

  describe('zoomReset', () => {
    it('resets', () => {
      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );
      deltaRenderer.zoomReset();
    });
  });

  describe('hideViewport and revealViewport', () => {
    it('hides and reveals the viewport', () => {
      let style = {
        display: 'none',
      };

      let canvas = {
        style: style,
      };

      const document: SubstituteOf<Document> = Substitute.for();
      document.createElement(Arg.any()).returns(canvas);
      const window: SubstituteOf<Window> = Substitute.for();
      window.document.returns(document);
      // @ts-ignore
      window.getComputedStyle(Arg.any()).returns(canvas.style);

      const deltaRenderer: ScreenViewingDeltaRenderer = new DefaultScreenViewingDeltaRenderer(
        controller,
        logger,
        window,
        Substitute.for(),
        Substitute.for()
      );

      // Test style doesn't change before setViewport
      canvas.style.display = 'block';
      deltaRenderer.hideViewport();
      expect(style.display).to.equal('block');
      style.display = 'none';
      deltaRenderer.revealViewport();
      expect(style.display.valueOf()).to.equal('none');

      // Test style does change after setViewport
      deltaRenderer.setViewport(Substitute.for());
      canvas.style.display = 'block';
      deltaRenderer.hideViewport();
      expect(canvas.style.display).to.equal('none');
      deltaRenderer.revealViewport();
      expect(canvas.style.display).to.equal('block');
    });
  });
});
