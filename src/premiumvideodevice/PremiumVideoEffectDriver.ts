import Logger from "../logger/Logger";
import PremiumVideoEffectConfig from "./PremiumVideoEffectConfig"

const CHANNEL_COUNT = 4; // The number of channels in a video frame
const MAX_PIXEL_VAL = 255; // Max pixel value in unsigned 8 bit int space

/**
 * [[PremiumVideoEffectDriver]] Mechanism that drives the data transformation 
 * of individual images/frames in order to apply different ML-Based effects.
 * Current Dummy Effects:
 *  blue shift
 *  red shift
 * Future Effects:
 *  bg blur
 *  bg replacement
 */
export default class PremiumVideoEffectDriver {
    constructor(
        private logger: Logger,
        private config: PremiumVideoEffectConfig
    ) {
        this.logger.info("PremiumVideoEffectDriver Created")
    }

    /**
     * Apply a transformation of configured effects onto an input image
     * @param inputImageData 
     * @returns transformed image data to be pasted onto output canvas
     */
    async apply(inputImageData: ImageData): Promise<ImageData>{
        console.log('[hunter] b r' + this.config.blueShiftEnabled + ' ' + this.config.redShiftEnabled)
        const imageElements = inputImageData.width * inputImageData.height
                                     * CHANNEL_COUNT;
        let rawOutputData: Uint8ClampedArray = new Uint8ClampedArray(imageElements);

        for (let i = 0; i < imageElements; i++) {
            if (this.config.redShiftEnabled && i % 4 == 0) {
                rawOutputData[i] = MAX_PIXEL_VAL;
            } else if (this.config.blueShiftEnabled && i % 4 == 2) {
                rawOutputData[i] = MAX_PIXEL_VAL;
            } else {
                rawOutputData[i] = inputImageData.data[i];
            }
        }

        return new ImageData(rawOutputData, inputImageData.width,
            inputImageData.height);
    }

    /**
     * Enable the Blue Shift Effect
     * @param enabled 
     */
    setBlueShiftState(enabled: boolean): void {
        this.config.blueShiftEnabled = enabled;
    }  

    /**
     * Enable the Red Shift Effect
     * @param enabled 
     */
    setRedShiftState(enabled: boolean): void {
        this.config.redShiftEnabled = enabled;
    }

    /**
     * Get the current [[PremiumVideoEffectConfig]]
     * @returns the current PremiumVideoEffectConfig
     */
    getEffectConfig(): PremiumVideoEffectConfig {
        return this.config;
    }

}