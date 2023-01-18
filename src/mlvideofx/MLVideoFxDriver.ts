import { loadWorker } from '../../libs/voicefocus/loader';
import Logger from '../logger/Logger';
import DeferredPromise from './DeferredPromise';
import MLVideoFxAssetReadiness from './MLVideoFxAssetReadiness';
import MLVideoFxConfig from './MLVideoFxConfig';

const CHANNEL_COUNT = 4; // The number of channels in a video frame
const MAX_PIXEL_VAL = 255; // Max pixel value in unsigned 8 bit int space
const ENGINE_BASE_URL = 'http://d1nux75bjarwom.cloudfront.net/';

/**
 * [[MLVideoFxDriver]] Mechanism that drives the data transformation
 * of individual images/frames in order to apply different ML-Based effects.
 * Current Dummy Effects (removed in production):
 *  blue shift
 *  red shift
 * Future Effects:
 *  bg blur
 *  bg replacement
 */
export default class MLVideoFxDriver {
  private engineWorker: Worker;
  private assetReadiness: MLVideoFxAssetReadiness;
  private engineInstantiatedPromise: DeferredPromise;

  constructor(private logger: Logger, private effectConfig: MLVideoFxConfig) {
    this.logger.info(
      `MLVideoFxDriver created with default config: ` + JSON.stringify(effectConfig)
    );

    this.engineInstantiatedPromise = new DeferredPromise();
    this.assetReadiness = { 
      engineWorkerAssetsReady: false, 
      engineReady: false
    };
  }

  /**
   * Apply a transformation of configured effects onto an input image
   * @param inputImageData
   * @returns transformed image data to be pasted onto output canvas
   */
  async apply(inputImageData: ImageData): Promise<ImageData> {
    const transformData = (currentPixel: number, idx: number): number => {
      if (this.effectConfig.redShiftEnabled && idx % CHANNEL_COUNT === 0) {
        return MAX_PIXEL_VAL;
      } else if (this.effectConfig.blueShiftEnabled && idx % CHANNEL_COUNT === 2) {
        return MAX_PIXEL_VAL;
      } else {
        return currentPixel;
      }
    };
    const rawOutputData: Uint8ClampedArray = inputImageData.data.map((currentPixel, idx) =>
      transformData(currentPixel, idx)
    );

    return new ImageData(rawOutputData, inputImageData.width, inputImageData.height);
  }

  /**
   * Loads all of the default assets that are associated with the default configuration
   * passed into the MLVideoFxDriver at construction
   * @returns
   */
  async loadDefaultAssets(): Promise<void> {
    // The engine worker will always be a required asset for the MLVideoFxDriver
    await this.loadEngineWorker();
    // If the engine worker didn't load properly, exit because the engine
    // worker is essential to all functionality of the MLVideoFxDriver
    if (!this.assetReadiness.engineWorkerAssetsReady) return;

    // The engine itself will always be a required asset for the MLVideoFxDriver
    await this.instantiateEngine();
    // If the engine didn't instantiate, exit because the engine
    // is essential to all functionality of the MLVideoFxDriver
    if (!this.assetReadiness.engineReady) return;

    this.logger.info(
      'Finished default loading of assets for MLVideoFxDriver. Asset Readiness: ' +
        JSON.stringify(this.assetReadiness)
    );
  }

  /**
   * Fetch and then load or engine worker into a web-worker
   */
  async loadEngineWorker(): Promise<void> {
    // The engine worker will always be a required asset for the MLVideoFxDriver
    try {
      // Load the worker that will communicate with our MLVideoFxEngine
      this.engineWorker = await loadWorker(
        ENGINE_BASE_URL + 'worker.js',
        'MLVideoFxEngineWorker',
        {},
        null
      );
      this.assetReadiness.engineWorkerAssetsReady = true;
      this.logger.info("Successfully loaded the MLVideoFxDriver's engine worker");
      // Configure a handler to deal with messages received form the engine worker
      this.engineWorker.onmessage = event => this.engineWorkerReceiver(event);
    } catch (error) {
      this.assetReadiness.engineWorkerAssetsReady = false;
      this.logger.error("Failed to load the MLVideoFxDriver's FX engine worker: " + error.message);
    }
  }

  /**
   * Instantiate the MLVideoFxEngine (the web-assembly)
   */
  async instantiateEngine(): Promise<void> {
    // Send a message via our engine worker to instantiate
    // the engine's web assembly unit
    this.engineWorker.postMessage({
      msg: 'initialize',
      payload: {
        wasmPath: ENGINE_BASE_URL + '_cwt-wasm.wasm',
        simdPath: ENGINE_BASE_URL + '_cwt-wasm-simd.wasm',
      },
    });
    // Wait until the engine finishes instantiating
    await this.engineInstantiatedPromise.getPromise().catch(() => {
      this.logger.error("Failed to instantiate the MLVideoFxEngine");
    });
  }

  /**
   * Enable the Blue Shift Effect
   * @param enabled
   */
  // This is a developmental feature and will be moved before merging into prod
  setBlueShiftState(enabled: boolean): void {
    this.effectConfig.blueShiftEnabled = enabled;
  }

  /**
   * Enable the Red Shift Effect
   * @param enabled
   */
  // This is a developmental feature and will be moved before merging into prod
  setRedShiftState(enabled: boolean): void {
    this.effectConfig.redShiftEnabled = enabled;
  }

  /**
   * Get the current [[MLVideoFxConfig]]
   * @returns the current [[MLVideoFxConfig]]
   */
  getEffectConfig(): MLVideoFxConfig {
    return this.effectConfig;
  }

  /**
   * Get the current [[MLVideoFxAssetProfile]]
   * @returns [[MLVideoFxAssetProfile]]
   */
  getAssetReadiness(): MLVideoFxAssetReadiness {
    return this.assetReadiness;
  }

  /**
   * Receives messages from the engine worker and then delegates
   * the proper response to a different function
   * @param event notification to be received from our engine worker
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected engineWorkerReceiver(event: MessageEvent<any>): void {
    const msg = event.data;
    switch (msg.msg) {
      case "initialize":
        this.handleCompletedEngineInitialization(msg.payload);
        break;
      default:
        this.logger.info(`MLVideoFx worker received unknown event msg: ${JSON.stringify(msg)}`);
        break;
    }
  }

  /**
   * Handle the message returned from our MLVideoFX Engine worker after it completes
   * instantiating the MLVideoFxEngine. 
   */
  protected handleCompletedEngineInitialization(initSuccess: boolean) {
    this.assetReadiness.engineReady = initSuccess;
    // Resolve or reject our engineInstantiatedPromise depending on success
    // of instatiation
    if (!initSuccess) {
      this.engineInstantiatedPromise.rejectPromise();
    } else {
      this.logger.info("Successfully instantiated the MLVideoFxEngine");
      this.engineInstantiatedPromise.resolvePromise();
    }
  }
}
