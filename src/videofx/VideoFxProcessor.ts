// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fetchWithBehavior } from '../../libs/voicefocus/fetch';
import { loadWorker } from '../../libs/voicefocus/loader';
import { supportsWASM, supportsWorker } from '../../libs/voicefocus/support';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import EventController from '../eventcontroller/EventController';
import VideoFXEventAttributes from '../eventcontroller/VideoFXEventAttributes';
import Logger from '../logger/Logger';
import NoOpLogger from '../logger/NoOpLogger';
import { getDefaultAssetSpec } from '../utils/Utils';
import Versioning from '../versioning/Versioning';
import CanvasVideoFrameBuffer from '../videoframeprocessor/CanvasVideoFrameBuffer';
import VideoFrameBuffer from '../videoframeprocessor/VideoFrameBuffer';
import VideoFrameProcessor from '../videoframeprocessor/VideoFrameProcessor';
import { DeferredPromise } from './DeferredPromise';
import { SDKVersioningParams } from './SDKVersioningParams';
import { VideoFxCanvasOpsManager } from './VideoFxCanvasOpsManager';
import VideoFxConfig from './VideoFxConfig';
import {
  CDN_BASE_PATH,
  DEFAULT_STREAM_PARAMETERS,
  FXLIB_PATH,
  RESOURCE_CONSTRAINTS,
  SEGMENTATION_MODEL,
  WORKER_MSG,
  WORKER_PATH,
} from './VideoFxConstants';
import { VideoFxRenderer } from './VideoFxRenderer';
import { VideoFxSegmentationRateManager } from './VideoFxSegmentationRateManager';
import { VideoFxStreamParameters } from './VideoFxStreamParameters';

/**
 * [[VideoFxProcessor]] Mechanism that drives the data transformation
 * of individual video frames to apply ML-based background blur and
 * background replacement effects on the video stream.
 */
export default class VideoFxProcessor implements VideoFrameProcessor {
  private static isSharedArrayBufferSupported: boolean = typeof SharedArrayBuffer !== 'undefined';
  private fxLibScript: HTMLScriptElement;
  private effectConfig: VideoFxConfig;
  private streamParameters: VideoFxStreamParameters;
  private engineWorker: Worker;
  private canvasOpsManager: VideoFxCanvasOpsManager;
  private renderer: VideoFxRenderer;

  // Shared array buffer fields
  private sharedImageBuffer: SharedArrayBuffer;
  private sharedImageData: Uint8ClampedArray;

  // Deferred promises for requests/awaits with engine worker
  private buildEnginePromise: DeferredPromise<void>;
  private destroyedAssetsPromise: DeferredPromise<void>;

  //Fields to manage the segmentation process
  private segmentationRateManager: VideoFxSegmentationRateManager;
  private segmentationMask: ImageData;
  private segmentationRequestPromise: DeferredPromise<ImageData>;

  // Configure the buffer for where output frames will be placed
  private outputCanvas: HTMLCanvasElement = document.createElement('canvas') as HTMLCanvasElement;
  private canvasVideoFrameBuffer = new CanvasVideoFrameBuffer(this.outputCanvas);
  private eventController?: EventController | undefined;

  /**
   * Initializes a new instance of [[VideoFxProcessor]] with a default NoOp [[VideoFxConfig]].
   * @param logger
   * @param processingBudgetPerFrame throttling constraint for processing
   * @param eventController EventController object to manage events
   */
  constructor(
    private logger: Logger,
    processingBudgetPerFrame: number = RESOURCE_CONSTRAINTS.DEFAULT_PROCESSING_BUDGET_PER_FRAME,
    eventController?: EventController
  ) {
    // Validate the inputted resource constraint
    try {
      this.validateProcessingBudgetPerFrame(processingBudgetPerFrame);
    } catch (error) {
      this.logger.error(error);
      throw new Error(
        `Cannot instantiate VideoFxProcessor due to invalid ` +
          `processingBudgetPerFrame of ${processingBudgetPerFrame}`
      );
    }

    if (eventController) {
      this.eventController = eventController;
    }

    // Create a basic effectConfig (noOp)
    this.effectConfig = {
      backgroundBlur: {
        isEnabled: false,
        strength: 'low',
      },
      backgroundReplacement: {
        isEnabled: false,
        backgroundImageURL: null,
        defaultColor: 'black',
      },
    };

    // This promise object will be used to coordinate timing of sending/receiving frames from engine
    this.segmentationRequestPromise = new DeferredPromise<ImageData>();
    // Configure resource management for the segmentation frequency
    this.segmentationRateManager = new VideoFxSegmentationRateManager(
      this.logger,
      processingBudgetPerFrame
    );

    // Configure default streamParameters
    this.streamParameters = {
      framerate: DEFAULT_STREAM_PARAMETERS.FRAMES_PER_SECOND,
      width: DEFAULT_STREAM_PARAMETERS.WIDTH_IN_PIXEL,
      height: DEFAULT_STREAM_PARAMETERS.HEIGHT_IN_PIXEL,
      channels: DEFAULT_STREAM_PARAMETERS.CHANNEL_COUNT,
    };

    // Determine if shared array buffer can be used to transfer frame data from
    // main thread to web worker thread
    if (VideoFxProcessor.isSharedArrayBufferSupported) {
      this.sharedImageBuffer = new SharedArrayBuffer(
        SEGMENTATION_MODEL.WIDTH_IN_PIXELS *
          SEGMENTATION_MODEL.HEIGHT_IN_PIXELS *
          this.streamParameters.channels
      );
      this.sharedImageData = new Uint8ClampedArray(this.sharedImageBuffer);
    }
    this.logger.info(
      `VideoFx supports Shared Array Buffer: ` + `${VideoFxProcessor.isSharedArrayBufferSupported}`
    );

    // Determine if filter operations are supported
    this.canvasOpsManager = new VideoFxCanvasOpsManager(this.streamParameters, this.outputCanvas);

    // Configure the final transformed frame location
    this.outputCanvas.width = this.streamParameters.width;
    this.outputCanvas.height = this.streamParameters.height;

    // Set an empty mask at initialization
    this.segmentationMask = new ImageData(
      this.streamParameters.width,
      this.streamParameters.height
    );

    this.logger.info(
      `VideoFxProcessor instantiated with a processingBudgetPerFrame of ${processingBudgetPerFrame}`
    );
  }

  /**
   * Apply the [[VideoFxProcessor]]'s specialized effect onto the frame contained by
   * the buffer parameter.
   * @param buffers
   * @returns buffers
   */
  async process(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    // Note: Required method through implementation of VideoFrameProcessor.
    return buffers;
  }

  /**
   * Process an input stream and apply the visual effects specified in this effectConfig.
   * @param buffers the input stream
   * @returns an output stream of VideoFrameBuffer
   */
  private async fxProcess(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    // Process our input image into raw input data
    const inputCanvas = buffers[0].asCanvasElement() as HTMLCanvasElement;

    // We must confirm that our incoming stream did not change it's parameters
    if (this.didStreamParametersChange(inputCanvas)) {
      await this.adjustProcessorForNewStreamParameters(inputCanvas);
    }

    // Decide to use the existing segmentation or perform a new segmentation
    try {
      await this.manageSegmentationMask(inputCanvas);
    } catch (error) {
      this.logger.error(error);
      throw new Error(`Video stream could not be processed`);
    }

    // Render a final image using the input canvas and the segmentation mask
    await this.renderer.render(inputCanvas, this.segmentationMask);

    // Send canvas video frame buffer to rest of processor pipeline
    buffers[0] = this.canvasVideoFrameBuffer;
    return buffers;
  }

  /**
   * Perform a process call that just returns the input stream
   * @param buffers the input stream
   * @returns an output stream of VideoFrameBuffer
   */
  private async noOpProcess(buffers: VideoFrameBuffer[]): Promise<VideoFrameBuffer[]> {
    return buffers;
  }

  /**
   * Check if the stream dimensions/parameters have changed.
   * @param stream frame from current video stream about to be processed
   * @returns boolean representing if the stream parameters changed
   */
  private didStreamParametersChange(stream: HTMLCanvasElement): boolean {
    return (
      stream.width !== this.streamParameters.width || stream.height !== this.streamParameters.height
    );
  }

  /**
   * Adjust the videoFxProcessor to handle new stream parameters.
   * @param stream frame from current video stream about to be processed
   */
  private async adjustProcessorForNewStreamParameters(stream: HTMLCanvasElement): Promise<void> {
    // Update the stored streamParameters
    this.streamParameters.width = stream.width;
    this.streamParameters.height = stream.height;

    // Notify the canvas ops manager to reconfigure pipeline dimensions
    await this.canvasOpsManager.configureForStreamParameters(this.streamParameters);

    // Configure the renderer to work with new stream dimensions
    await this.renderer.configure(
      this.streamParameters.width,
      this.streamParameters.height,
      this.effectConfig
    );
  }

  /**
   * Clean up any excess memory that has been allocated by [[VideoFxProcessor]].
   */
  async destroy(): Promise<void> {
    // Note: Required method through implementation of VideoFrameProcessor.
    this.canvasVideoFrameBuffer.destroy();
    if (this.fxLibScript && this.fxLibScript.parentNode) {
      this.fxLibScript.parentNode.removeChild(this.fxLibScript);
    }
    if (this.engineWorker) {
      // Post message to destroy all assets
      this.destroyedAssetsPromise = new DeferredPromise<void>();
      this.engineWorker.postMessage({
        msg: WORKER_MSG.DESTROY_ASSETS_REQUEST,
      });
      // Wait until all the assets are destroyed
      await this.destroyedAssetsPromise.getPromise();

      // Close the engine worker
      this.engineWorker.postMessage({
        msg: WORKER_MSG.CLOSE_WORKER_REQUEST,
      });
    }
    this.logger.info(`VideoFxProcessor destroyed.`);
  }

  /**
   * Manage the segmentation mask that is used to generate a final frame. This function
   * will calculate whether or not to re-generate a segmenation and also monitor
   * how computationally expensive the rate of segmentation are.
   * @param inputCanvas canvas to be used for segmentation
   */
  private async manageSegmentationMask(inputCanvas: HTMLCanvasElement): Promise<void> {
    try {
      this.segmentationRateManager.submitFrame();
      if (this.segmentationRateManager.shouldApplySegmentation()) {
        // Perform a segmentation inference on the downsampled current video frame
        this.segmentationRateManager.startSegmentation();
        const inferenceInputImageData = this.canvasOpsManager.getInferenceInputData(inputCanvas);
        this.segmentationMask = await this.generateSegmentationMask(inferenceInputImageData);
        this.segmentationRateManager.completeSegmentation();
      }
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Can not properly manage the returned segmentation mask`);
    }
  }

  /**
   * Generate a segmentation mask from the input frame.
   * @param inferenceImageData
   * @returns image data representing segmenation mask
   */
  private async generateSegmentationMask(inferenceImageData: ImageData): Promise<ImageData> {
    if (VideoFxProcessor.isSharedArrayBufferSupported) {
      this.sharedImageData.set(inferenceImageData.data);
      this.engineWorker.postMessage({
        msg: WORKER_MSG.PERFORM_SEGMENTATION_SAB_REQUEST,
        payload: this.sharedImageBuffer,
      });
    } else {
      this.engineWorker.postMessage(
        {
          msg: WORKER_MSG.PERFORM_SEGMENTATION_REQUEST,
          payload: inferenceImageData,
        },
        [inferenceImageData.data.buffer]
      );
    }

    // Wait for input image to be returned from VideoFxEngine
    try {
      const segmentationMask = await this.segmentationRequestPromise.getPromise();
      return segmentationMask;
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Segmentation mask could not be generated`);
    }
  }

  /**
   * Make a deep copy of the VideoFxConfig passed in. Needs to be updated if additional
   * fields are added to VideoFxConfig.
   * @param effectConfig
   * @returns newEffectConfig
   */
  private cloneConfigFrom(effectConfig: VideoFxConfig): VideoFxConfig {
    return {
      backgroundBlur: {
        isEnabled: effectConfig.backgroundBlur.isEnabled,
        strength: effectConfig.backgroundBlur.strength,
      },
      backgroundReplacement: {
        isEnabled: effectConfig.backgroundReplacement.isEnabled,
        backgroundImageURL: effectConfig.backgroundReplacement.backgroundImageURL,
        defaultColor: effectConfig.backgroundReplacement.defaultColor,
      },
    };
  }

  /**
   * Update the [[VideoFxProcessor]] to apply a new set of effects by updating the instance property
   * [[VideoFxConfig]]. If the effectConfig parameter fails validation, an error is thrown and there is
   * no update.
   * @Param effectConfig updated [[VideoFxConfig]] with new video effects
   */
  async setEffectConfig(effectConfig: VideoFxConfig): Promise<void> {
    if (this.sameVideoFxConfig(effectConfig, this.effectConfig)) {
      return;
    }

    const newEffectConfig = this.cloneConfigFrom(effectConfig);

    // Validate the effect config
    try {
      await this.validateEffectConfig(newEffectConfig);
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Provided effect config is invalid, not updating VideoFxProcessor`);
    }

    // Configure background replacement image/canvas
    if (newEffectConfig.backgroundReplacement.isEnabled) {
      await this.canvasOpsManager.loadReplacementBackground(newEffectConfig);
      await this.renderer.setBackgroundReplacementCanvas(
        this.canvasOpsManager.getBackgroundReplacementCanvas()
      );
    }

    // Configure the renderer to implement the desired effect configuration
    await this.renderer.configure(
      this.streamParameters.width,
      this.streamParameters.height,
      newEffectConfig
    );

    // Can now officially set the effect config since the rest of the processor is
    // configured for the new effects
    this.effectConfig = newEffectConfig;

    // If no effects are enabled, run no op process, otherwise run the effect based processing
    if (
      !this.effectConfig.backgroundBlur.isEnabled &&
      !this.effectConfig.backgroundReplacement.isEnabled
    ) {
      this.process = this.noOpProcess;
    } else {
      this.process = this.fxProcess;
    }
    this.logger.info(
      `VideoFxProcessor effect configuration updated to: ${JSON.stringify(this.effectConfig)}`
    );

    if (this.eventController) {
      this.publishVideoFxConfigEvent();
    }
  }

  /**
   * Confirm that the config consists of valid values.
   * @param config that will be validated
   */
  private async validateEffectConfig(config: VideoFxConfig): Promise<void> {
    // We confirm that both blur and replacement are not enabled due to builder error
    if (config.backgroundBlur.isEnabled && config.backgroundReplacement.isEnabled) {
      throw new Error(
        `Invalid VideoFx configuration: Background Blur and Background Replacement ` +
          `can not both be enabled`
      );
    } else if (config.backgroundReplacement.isEnabled) {
      await this.validateReplacementConfig(config);
    }
    // backgroundBlur does not need to be validated, as valid blurStrength value
    // is checked at compile time.
  }

  /**
   * Confirm that the config consists of valid values for background replacement.
   * @param config that will be validated for background replacement
   */
  private async validateReplacementConfig(config: VideoFxConfig): Promise<void> {
    if (
      config.backgroundReplacement.backgroundImageURL &&
      config.backgroundReplacement.defaultColor
    ) {
      throw new Error(
        `Invalid VideoFx configuration: Background Replacement can not have both an ` +
          `image URL and default color`
      );
    }
    if (
      !config.backgroundReplacement.backgroundImageURL &&
      !config.backgroundReplacement.defaultColor
    ) {
      throw new Error(
        `Invalid VideoFx configuration: Background Replacement image URL and default ` +
          `can not both be null/undefined`
      );
    }

    // Confirm that the image properly loads
    try {
      if (config.backgroundReplacement.backgroundImageURL) {
        await this.canvasOpsManager.loadImage(config.backgroundReplacement.backgroundImageURL);
      }
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Invalid VideoFx configuration: backgroundImageURL failed to load`);
    }

    const defaultColor = config.backgroundReplacement.defaultColor;
    // Confirm that defaultColor is a valid color for fillStyle. We support black by default.
    if (
      defaultColor &&
      defaultColor !== 'black' &&
      defaultColor !== '#000000' &&
      defaultColor !== '#000'
    ) {
      // First validate hexadecimal color code
      if (defaultColor.includes('#')) {
        const hexRegex = new RegExp(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        if (!hexRegex.test(defaultColor)) {
          throw new Error(
            `Invalid hexadecimal color code for default replacement ` +
              `background: ${defaultColor}`
          );
        }
      }
      const testColorCanvas = document.createElement('canvas');
      const testColorCtx = testColorCanvas.getContext('2d');
      // fillStyle is #000000 black by default
      const prevFillStyle = testColorCtx.fillStyle;
      testColorCtx.fillStyle = defaultColor;
      // fillStyle will not change after assignment if invalid value is used
      /* istanbul ignore next */
      if (testColorCtx.fillStyle === prevFillStyle) {
        throw new Error(`Invalid color for default replacement background: ${defaultColor}`);
      }
    }
  }

  /**
   * Confirm that the processingBudgePerFrame constraint holds valid values.
   * @param constraint to be validated
   */
  private validateProcessingBudgetPerFrame(processingBudgetPerFrame: number): void {
    if (
      processingBudgetPerFrame < RESOURCE_CONSTRAINTS.MIN_PROCESSING_BUDGET ||
      processingBudgetPerFrame > RESOURCE_CONSTRAINTS.MAX_PROCESSING_BUDGET
    ) {
      throw new Error(
        `Invalid resource constraint: cycle percentage must be within ` +
          `range of ${RESOURCE_CONSTRAINTS.MIN_PROCESSING_BUDGET} and ` +
          `${RESOURCE_CONSTRAINTS.MAX_PROCESSING_BUDGET}`
      );
    }
  }

  /**
   * Loads all of the assets that are associated with the stored effectConfig.
   */
  private async loadAssets(): Promise<void> {
    this.logger.info(`Loading required assets for the VideoFxProcessor`);
    try {
      const sdkVersioningParams = this.getSDKVersioningParams();

      await this.loadEngineWorker(sdkVersioningParams);
      await this.buildEngine(sdkVersioningParams);
      await this.loadFxLib(sdkVersioningParams);
      // @ts-ignore
      this.renderer = constructRenderer(
        SEGMENTATION_MODEL.WIDTH_IN_PIXELS,
        SEGMENTATION_MODEL.HEIGHT_IN_PIXELS,
        this.effectConfig,
        this.outputCanvas
      );
    } catch (error) {
      // NOTE: when we update to es2022, throw errors that are chained together
      this.logger.error(error.toString());
      throw new Error(`Failed to load necessary assets for the VideoFxProcessor`);
    }
    this.logger.info(`Finished loading of essential VideoFxProcessor assets.`);
  }

  /**
   * Determines the current set of specifications that define the current SDK version.
   * @returns an [[SDKVersioningParams]] object defining the parameters of the
   * current SDK
   */
  private getSDKVersioningParams(): SDKVersioningParams {
    const defaultAssetSpec = getDefaultAssetSpec();
    const sdkVersioningParams = {
      assetGroup: defaultAssetSpec.assetGroup,
      revisionID: defaultAssetSpec.revisionID,
      sdk: encodeURIComponent(Versioning.sdkVersion),
      ua: encodeURIComponent(Versioning.sdkUserAgentLowResolution),
    };
    return sdkVersioningParams;
  }

  /**
   * Generate a final path to an asset belonging to current version of SDK.
   * @param basePath Base of the path that will be used to generate a final path
   * @param sdkVersioningParams Parameters of the current SDK version
   * @returns A final path specific to an asset belonging to current SDK
   * version
   */
  private getPathFromSDKVersioningParams(
    basePath: string,
    sdkVersioningParams: SDKVersioningParams
  ): string {
    const path = new URL(basePath);
    for (const [key, value] of Object.entries(sdkVersioningParams)) {
      if (value !== undefined) {
        // Encode the key and value into uri format
        const uriEncodedKey = encodeURIComponent(key);
        const uriEncodedValue = encodeURIComponent(value);
        // Set encoded key/value as query params
        path.searchParams.set(uriEncodedKey, uriEncodedValue);
      }
    }

    return path.toString();
  }

  /**
   * Fetch and then load the engine worker into a web-worker.
   */
  private async loadEngineWorker(sdkVersioningParams: SDKVersioningParams): Promise<void> {
    // The engine worker will always be a required asset for the VideoFxProcessor
    try {
      // Determine engine worker path from versioning of the SDK worker
      const engineWorkerPath = this.getPathFromSDKVersioningParams(
        CDN_BASE_PATH + WORKER_PATH,
        sdkVersioningParams
      );

      // Load the worker that will communicate with the VideoFxEngine
      this.engineWorker = await loadWorker(engineWorkerPath, 'VideoFxEngineWorker', {}, null);
      this.logger.info(`Successfully loaded the VideoFxProcessor's engine worker`);
      // Configure a handler to deal with messages received form the engine worker
      this.engineWorker.addEventListener('message', event => this.engineWorkerReceiver(event));
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Failed to load the VideoFxProcessor's engine worker`);
    }
  }

  /**
   * Build the videoFxEngine.
   * @param sdkVersioningParams [[SDKVersioningParams]] defining current version of SDK
   */
  private async buildEngine(sdkVersioningParams: SDKVersioningParams): Promise<void> {
    // Instantiate the deferred promise so we can wait for the worker to
    // return a completion message
    this.buildEnginePromise = new DeferredPromise<void>();

    // Send a message via the engine worker to instantiate
    // the video fx engine
    this.engineWorker.postMessage({
      msg: WORKER_MSG.BUILD_ENGINE_REQUEST,
      payload: {
        cdnBasePath: CDN_BASE_PATH,
        sdkVersioningParams: sdkVersioningParams,
      },
    });

    // Wait until the engine finishes building
    try {
      await this.buildEnginePromise.getPromise();
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Failed to instantiate the VideoFxEngine`);
    }
  }

  /**
   * Loads the Video Fx library to drive video post-processing, given the versioning
   * of the SDK worker from the SDKVersioningParams interface passed as a parameter.
   * @param sdkVersioningParams
   */
  private async loadFxLib(sdkVersioningParams: SDKVersioningParams): Promise<void> {
    // Determine engine worker path from versioning of the SDK worker
    const fxLibPath = this.getPathFromSDKVersioningParams(
      CDN_BASE_PATH + FXLIB_PATH,
      sdkVersioningParams
    );

    const WORKER_FETCH_OPTIONS: RequestInit = {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
    };

    try {
      const res = await fetchWithBehavior(fxLibPath, WORKER_FETCH_OPTIONS, {});
      if (!res.ok) {
        throw new Error('Fetch failed.');
      }
      const blobURL = window.URL.createObjectURL(await res.blob());
      await new Promise((resolve, reject) => {
        this.fxLibScript = document.createElement('script');
        this.fxLibScript.setAttribute('src', blobURL);
        this.fxLibScript.setAttribute('type', 'module');
        this.fxLibScript.setAttribute('async', 'false');
        this.fxLibScript.addEventListener('load', resolve);
        this.fxLibScript.addEventListener('error', reject);
        document.body.appendChild(this.fxLibScript);
      });
    } catch (error) {
      this.logger.error(error.toString());
      throw new Error(`Failed to load the fxlib`);
    }
  }

  /**
   * Getter for the current [[VideoFxConfig]] maintained as an instance property of
   * [[VideoFxProcessor]].
   * @returns currentEffectConfig
   */
  getEffectConfig(): VideoFxConfig {
    return this.cloneConfigFrom(this.effectConfig);
  }

  /**
   * Receives messages from the engine worker and then delegates
   * the proper response to a different function.
   * @param event notification to be received from the engine worker
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private engineWorkerReceiver(event: MessageEvent<any>): void {
    const msg = event.data;
    switch (msg.msg) {
      case WORKER_MSG.BUILD_ENGINE_RESPONSE:
        this.settleEngineBuildPromise(msg.payload);
        break;
      case WORKER_MSG.PERFORM_SEGMENTATION_RESPONSE:
        this.settleSegmentationPromise(msg.payload.output);
        break;
      case WORKER_MSG.PERFORM_SEGMENTATION_SAB_RESPONSE:
        this.settleSegmentationPromiseSAB();
        break;
      case WORKER_MSG.DESTROY_ASSETS_RESPONSE:
        this.destroyedAssetsPromise.resolvePromise();
        break;
      default:
        this.logger.info(`VideoFx worker received unknown event msg: ${JSON.stringify(msg)}`);
        break;
    }
  }

  /**
   * Handle the message returned from the VideoFX Engine worker to
   * settle (resolve/reject) the promise associated with initializing the engine.
   * @param buildStatus status of the final result of building the engine
   */
  private settleEngineBuildPromise(buildStatus: number): void {
    // Resolve or reject the engineInstantiatedPromise depending on success
    // of instatiation
    if (buildStatus !== SEGMENTATION_MODEL.LOAD_SUCCESS) {
      this.buildEnginePromise.rejectPromise(new Error(`Failed to build VideoFxProcessor's engine`));
    } else {
      this.logger.info(`Successfully built the VideoFxEngine`);
      this.buildEnginePromise.resolvePromise();
    }
  }

  /**
   * Handle the received segmentation mask and then resolve/reject the promise to notify
   * the main processing function to prepare for the next frame (using ImageData transfer).
   * @param segmentationMask
   */
  private settleSegmentationPromise(segmentationMask: ImageData): void {
    // Resolve or reject the frameRequestPromise depending on the success of transforming
    // the input image
    if (segmentationMask) {
      // Resolve segmentation promise with mask data
      this.segmentationRequestPromise.resolveAndReplacePromise(segmentationMask);
    } else {
      this.segmentationRequestPromise.rejectAndReplacePromise(
        new Error(`Failed to perform a segmentation on the input image`)
      );
    }
  }

  /**
   * Handle the received segmentation mask and then resolve/reject the promise to notify
   * the main processing function to prepare for the next frame (using shared array buffer).
   */
  private settleSegmentationPromiseSAB(): void {
    try {
      // Resolve segmentation promise with mask data
      const transformedImageData = new ImageData(
        new Uint8ClampedArray(this.sharedImageData),
        SEGMENTATION_MODEL.WIDTH_IN_PIXELS,
        SEGMENTATION_MODEL.HEIGHT_IN_PIXELS
      );
      this.segmentationRequestPromise.resolveAndReplacePromise(transformedImageData);
    } catch {
      this.segmentationRequestPromise.rejectAndReplacePromise(
        new Error(
          `Failed to perform a segmentation with a shared ` + `array buffer on the input image`
        )
      );
    }
  }

  /**
   * Function that will convert the VideoFxProcessor into a NoOp version of itself.
   * Will only return input video stream and not use worker, engine, or segmentation
   * model.
   */
  private setToNoOpProcess(): void {
    this.process = this.noOpProcess;
  }

  /**
   * Detect client environment to determine if the [[VideoFxProcessor]] is supported.
   * @param logger to record/report events of checking processor support
   * @param attemptAssetLoad will also fetch and build all relevant components of the
   * processor to ensure end to end feature is supported
   * @returns a boolean promise that will resolve to true if supported and false if not
   */
  static async isSupported(
    logger: Logger = new NoOpLogger(),
    attemptAssetLoad: boolean = true
  ): Promise<boolean> {
    // allCheckedPassed represents the state of support and we assume it is true until checkEnv tells us otherwise
    let allCheckedPassed: boolean = true;
    // checkEnv evaluates a boolean condition, badPromiseCondition, that when true would cause isSupported to fail.
    // We also log a corresponding error message for each support check so a builder can see what is still needed
    // in their environment.
    const checkEnv = (badPromiseCondition: boolean, message: string): void => {
      if (badPromiseCondition) {
        logger.info(message);
        allCheckedPassed = false;
      }
    };

    // Get context for operating environment
    // could not figure out how to remove globalThis to test failure case
    /* istanbul ignore next */
    checkEnv(typeof globalThis === 'undefined', 'Browser does not have globalThis.');

    // Check workers are supported
    checkEnv(!supportsWorker(globalThis, logger), 'Browser does not support web workers.');

    // Check wasm is supported
    checkEnv(!supportsWASM(globalThis, logger), 'Browser does not support wasm.');

    // Check webgl2 is supported
    checkEnv(
      !document.createElement('canvas').getContext('webgl2'),
      'Browser does not support webgl.'
    );

    // Check browser support
    const browserBehavior = new DefaultBrowserBehavior();
    checkEnv(
      !browserBehavior.isVideoFxSupportedBrowser(),
      'Browser is unsupported for VideoFxProcessor'
    );

    // checkProcessor first checks if we can load all required assets and then tests VideoFxProcessor.
    const checkProcessor = async (): Promise<boolean> => {
      if (attemptAssetLoad) {
        try {
          const testFxProcessor = new VideoFxProcessor(logger);
          await testFxProcessor.loadAssets();
          await testFxProcessor.destroy(); // destroy assets we just temp loaded
        } catch {
          logger.info('Browser environment is unable to access the required external assets.');
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(true);
    };

    return Promise.resolve(allCheckedPassed ? await checkProcessor() : false);
  }

  /**
   * Create a [[VideoFxProcessor]] that has loaded its necessary components, ready to instantly
   * process a video stream with the effects specified in the passed [[VideoFxConfig]].
   *
   * ** NOTICE **
   *
   * Amazon Chime background blur 2.0 and background replacement 2.0
   * Copyright 2023 Amazon.com, Inc. or its affiliates. All Rights Reserved.
   *
   * By installing or using this package, you agree to the AWS Customer Agreement, AWS Service Terms, and AWS Privacy Notice.
   * If you already have an AWS Customer Agreement, you agree that the terms of that agreement govern your download and use of this package.
   * This package is provided as AWS Content and subject to the AWS Customer agreement and any other agreement with AWS governing your use of
   * AWS services.
   */
  static async create(
    logger: Logger,
    effectConfig: VideoFxConfig,
    processingBudgetPerFrame: number = RESOURCE_CONSTRAINTS.DEFAULT_PROCESSING_BUDGET_PER_FRAME
  ): Promise<VideoFxProcessor> {
    // Create the videoFxProcessor
    const videoFxProcessor: VideoFxProcessor = new VideoFxProcessor(
      logger,
      processingBudgetPerFrame
    );

    // Load the required assets and set desired effect config
    try {
      await videoFxProcessor.loadAssets();
      await videoFxProcessor.setEffectConfig(effectConfig);
      return videoFxProcessor;
    } catch (error) {
      logger.error(error.toString());
      // If we fail loading an essential asset from above, we overwrite our
      // processor to process with no operations or effects
      videoFxProcessor.setToNoOpProcess();
      throw new Error(`VideoFxProcessor built with support for only NoOp processing`);
    }
  }

  /** @internal */
  setEventController(eventController: EventController): void {
    /*
    if this is a first time we set the eventController, need to publish the current VideoFxConfig.
    Otherwise, just set the eventController.
    */
    if (this.eventController) {
      this.eventController = eventController;
    } else {
      this.eventController = eventController;
      this.publishVideoFxConfigEvent();
    }
  }

  private publishVideoFxConfigEvent(): void {
    const mediaFXEventAttibutes: VideoFXEventAttributes = {
      backgroundBlurEnabled: this.effectConfig.backgroundBlur.isEnabled.toString(),
      backgroundBlurStrength: this.effectConfig.backgroundBlur.strength,
      backgroundReplacementEnabled: this.effectConfig.backgroundReplacement.isEnabled.toString(),
      backgroundFilterVersion: 2,
    };
    this.eventController.publishEvent('backgroundFilterConfigSelected', mediaFXEventAttibutes);
  }

  private sameVideoFxConfig(firstConfig: VideoFxConfig, secondConfig: VideoFxConfig): boolean {
    return (
      firstConfig.backgroundBlur.isEnabled === secondConfig.backgroundBlur.isEnabled &&
      firstConfig.backgroundBlur.strength === secondConfig.backgroundBlur.strength &&
      firstConfig.backgroundReplacement.backgroundImageURL ===
        secondConfig.backgroundReplacement.backgroundImageURL &&
      firstConfig.backgroundReplacement.defaultColor ===
        secondConfig.backgroundReplacement.defaultColor &&
      firstConfig.backgroundReplacement.isEnabled === secondConfig.backgroundReplacement.isEnabled
    );
  }
}
