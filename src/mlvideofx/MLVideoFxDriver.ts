import Logger from '../logger/Logger';
import MLVideoFxConfig from './MLVideoFxConfig';

const CHANNEL_COUNT = 4; // The number of channels in a video frame
const MAX_PIXEL_VAL = 255; // Max pixel value in unsigned 8 bit int space

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
  constructor(private logger: Logger, private config: MLVideoFxConfig) {
    this.logger.info(`MLVideoFxDriver created with config: ` + JSON.stringify(config));
  }

  /**
   * Apply a transformation of configured effects onto an input image
   * @param inputImageData
   * @returns transformed image data to be pasted onto output canvas
   */
  async apply(inputImageData: ImageData): Promise<ImageData> {
    const transformData = (currentPixel: number, idx: number): number => {
      if (this.config.redShiftEnabled && idx % CHANNEL_COUNT === 0) {
        return MAX_PIXEL_VAL;
      } else if (this.config.blueShiftEnabled && idx % CHANNEL_COUNT === 2) {
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
   * Enable the Blue Shift Effect
   * @param enabled
   */
  // This is a developmental feature and will be moved before merging into prod
  setBlueShiftState(enabled: boolean): void {
    this.config.blueShiftEnabled = enabled;
  }

  /**
   * Enable the Red Shift Effect
   * @param enabled
   */
  // This is a developmental feature and will be moved before merging into prod
  setRedShiftState(enabled: boolean): void {
    this.config.redShiftEnabled = enabled;
  }

  /**
   * Get the current [[MLVideoFxConfig]]
   * @returns the current MLVideoFxConfig
   */
  getEffectConfig(): MLVideoFxConfig {
    return this.config;
  }
}
