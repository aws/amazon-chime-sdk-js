// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DragEvent from '../../dragobserver/DragEvent';
import DragObserver, { DragObserverFactory } from '../../dragobserver/DragObserver';
import DragType from '../../dragobserver/DragType';
import JPEGDecoderController from '../../jpegdecoder/controller/JPEGDecoderController';
import JPEGDecoderInstance from '../../jpegdecoder/instance/JPEGDecoderInstance';
import Logger from '../../logger/Logger';
import DefaultPresentation from '../../presentation/DefaultPresentation';
import PresentationPolicy, {
  ZoomEvent,
  ZoomType,
} from '../../presentation/policy/PresentationPolicy';
import ScaleToFitPresentationPolicy from '../../presentation/policy/ScaleToFitPresentationPolicy';
import Presentation from '../../presentation/Presentation';
import PresentationElementFactory from '../../presentation/PresentationElementFactory';
import ResizeObserverAdapter from '../../resizeobserveradapter/ResizeObserverAdapter';
import ResizeObserverAdapterFactory from '../../resizeobserveradapter/ResizeObserverAdapterFactory';
import ScreenViewingImageDimensions from '../messagehandler/ScreenViewingImageDimensions';
import ScreenViewingDeltaRenderer from './ScreenViewingDeltaRenderer';

export default class DefaultScreenViewingDeltaRenderer implements ScreenViewingDeltaRenderer {
  private static readonly SYNC_TIMEOUT_MS: number = 500;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-member-accessibility
  public syncBuffer: Uint8Array[][] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-member-accessibility
  public jpegDataArrays: Uint8Array[][] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-member-accessibility
  public hasRendered: boolean[][] = [];
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public imageDimensions: ScreenViewingImageDimensions;
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public lastResizeAndSyncTime: number;

  private presentation: Presentation = new DefaultPresentation();
  private policy: PresentationPolicy = new ScaleToFitPresentationPolicy();
  private viewport: HTMLElement | null = null;
  private content: HTMLCanvasElement | null = null;
  private resizeObserver: ResizeObserverAdapter;
  private dragObserver: DragObserver | null = null;
  private jpegDecoderInstance?: JPEGDecoderInstance;

  constructor(
    private jpegDecoderController: JPEGDecoderController,
    private logger: Logger,
    private window: Window,
    resizeObserverFactory: ResizeObserverAdapterFactory,
    private dragObserverFactory: DragObserverFactory
  ) {
    this.resizeObserver = resizeObserverFactory.create(
      () => this.updatePresentation && this.updatePresentation()
    );
  }

  private static make2DArray<T>(columns: number, rows: number): T[][] {
    const arr: T[][] = [];
    for (let i = 0; i < rows; i++) {
      arr[i] = new Array<T>(columns);
    }
    return arr;
  }

  buildViewer(imageDimensions: ScreenViewingImageDimensions): void {
    this.logger.info(
      `DefaultScreenViewingDeltaRenderer: Building viewer with info ${JSON.stringify(
        imageDimensions
      )}`
    );
    this.syncBuffer = DefaultScreenViewingDeltaRenderer.make2DArray(
      imageDimensions.screenWidth,
      imageDimensions.screenHeight
    );
    this.jpegDataArrays = DefaultScreenViewingDeltaRenderer.make2DArray(
      imageDimensions.screenWidth,
      imageDimensions.screenHeight
    );
    this.hasRendered = DefaultScreenViewingDeltaRenderer.make2DArray(
      imageDimensions.screenWidth,
      imageDimensions.screenHeight
    );
    this.jpegDecoderInstance = this.jpegDecoderController.createInstance(
      imageDimensions.macroBlock,
      imageDimensions.macroBlock
    );
    this.imageDimensions = imageDimensions;
  }

  resizeAndSync(): void {
    if (!this.imageDimensions || !this.jpegDecoderInstance) {
      return;
    }
    const now: number = this.window.performance.now();
    if (
      !this.content ||
      now - this.lastResizeAndSyncTime < DefaultScreenViewingDeltaRenderer.SYNC_TIMEOUT_MS
    ) {
      return;
    }
    this.logger.debug(() => `DefaultScreenViewingDeltaRenderer: sync'ing`);
    if (
      this.content.width !== this.imageDimensions.imageWidthPixels ||
      this.content.height !== this.imageDimensions.imageHeightPixels
    ) {
      this.content.width = this.imageDimensions.imageWidthPixels;
      this.content.height = this.imageDimensions.imageHeightPixels;
      this.updatePresentation && this.updatePresentation();
    }
    this.renderSync();
    this.lastResizeAndSyncTime = this.window.performance.now();
  }

  private renderSync(): void {
    this.logger.debug(() => `DefaultScreenViewingDeltaRenderer: Rendering sync`);
    const context = this.getContext();
    if (!context) {
      return;
    }
    for (let row = 0; row < this.imageDimensions.screenHeight; row++) {
      for (let col = 0; col < this.imageDimensions.screenWidth; col++) {
        const dx: number = col * this.imageDimensions.macroBlock;
        const dy: number = row * this.imageDimensions.macroBlock;
        const rendered: boolean = this.hasRendered[row][col];
        const jpegDataArray = this.jpegDataArrays[row][col];
        if (!jpegDataArray || rendered) {
          continue;
        }
        const imageData = this.getImageData(jpegDataArray);
        if (!imageData) {
          continue;
        }
        context.putImageData(imageData, dx, dy);
        this.hasRendered[row][col] = true;
      }
    }
  }

  getImageData(jpegDataArray: Uint8Array): ImageData {
    try {
      return this.jpegDecoderInstance.decodeToImageData(jpegDataArray);
    } catch (e) {
      this.logger.error(e);
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.content && this.content.getContext('2d');
  }

  close(): void {
    this.logger.info(`DefaultScreenViewingDeltaRenderer: Closing`);
    this.getContext() && this.getContext().clearRect(0, 0, this.content.width, this.content.height);
    this.viewport && this.viewport.removeChild(this.content);
    this.dragObserver && this.dragObserver.unobserve();
    this.content = null;
    this.viewport = null;
    this.dragObserver = null;
  }

  setViewport(viewport: HTMLElement): void {
    if (this.viewport || this.content) {
      this.logger.warn('Current view must be closed before starting anew');
      return;
    }
    this.viewport = viewport;
    this.content = this.window.document.createElement('canvas');
    this.viewport.prepend(this.content);
    this.resizeObserver.observe(viewport);
    this.dragObserver = this.dragObserverFactory(
      this.window,
      (dragEvent: DragEvent) => {
        dragEvent.type !== DragType.BEGIN &&
          this.updatePresentation &&
          this.updatePresentation(
            {
              type: ZoomType.NONE,
            },
            dragEvent
          );
      },
      viewport
    );
    if (this.imageDimensions) {
      this.hasRendered = DefaultScreenViewingDeltaRenderer.make2DArray(
        this.imageDimensions.screenWidth,
        this.imageDimensions.screenHeight
      );
    }
  }

  hideViewport(): void {
    if (this.content) {
      this.content.style.display = 'none';
    }
  }

  revealViewport(): void {
    if (this.content) {
      this.content.style.display = 'block';
    }
  }

  changePresentationPolicy(policy: PresentationPolicy): void {
    this.policy = policy;
    this.updatePresentation();
  }

  zoomRelative(relativeZoomFactor: number): void {
    this.updatePresentation({
      type: ZoomType.ZOOM,
      relativeFactor: relativeZoomFactor,
    });
  }

  zoomAbsolute(absoluteZoomFactor: number): void {
    this.updatePresentation({
      type: ZoomType.ZOOM,
      absoluteFactor: absoluteZoomFactor,
    });
  }

  zoomReset(): void {
    this.updatePresentation({
      type: ZoomType.RESET,
    });
  }

  private updatePresentation(zoomEvent?: ZoomEvent, dragEvent?: DragEvent): void {
    this.imageDimensions &&
      this.viewport &&
      this.content &&
      this.presentation.present(
        PresentationElementFactory.createSource(this.imageDimensions),
        PresentationElementFactory.createViewport(this.viewport, this.window),
        PresentationElementFactory.createContent(this.content, this.window),
        this.policy,
        zoomEvent,
        dragEvent
      );
  }
}
