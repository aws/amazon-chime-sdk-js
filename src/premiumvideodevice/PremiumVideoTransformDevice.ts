import Device from '../devicecontroller/Device';
import VideoTransformDevice from '../devicecontroller/VideoTransformDevice';
import Logger from '../logger/Logger';
import PremiumVideoStreamHandler from './PremiumVideoStreamHandler';

export default class PremiumVideoTransformDevice implements VideoTransformDevice {
    private inputMediaStream: MediaStream;
    private premiumVideoStreamHandler: PremiumVideoStreamHandler;

    constructor(
        private logger: Logger,
        private device: Device,
    ) {
        // initialize the stream handler
        this.premiumVideoStreamHandler = new PremiumVideoStreamHandler(logger);
    }

    async stop(): Promise<void> {
        if (this.inputMediaStream) {
            for (const track of this.inputMediaStream.getVideoTracks()) {
                track.stop();
            }
        }
        this.inputMediaStream = null;
    }

    async intrinsicDevice(): Promise<Device> {
        return this.device;
    }
    
    async transformStream(mediaStream?: MediaStream): Promise<MediaStream> {
        await this.premiumVideoStreamHandler.setInputMediaStream(mediaStream);
        this.inputMediaStream = mediaStream
        return this.premiumVideoStreamHandler.getActiveOutputMediaStream();
    }
    
    onOutputStreamDisconnect(): void {
        this.logger.info('DefaultVideoTransformDevice: detach stopping input media stream');
        
        const deviceIsMediaStream = this.device && (this.device as MediaStream).id;

        // Turn off the camera, unless device is a MediaStream
        if (!deviceIsMediaStream) {
            if (this.inputMediaStream) {
                for (const track of this.inputMediaStream.getVideoTracks()) {
                    track.stop();
                }
            }
        }
    }

    get outputMediaStream(): MediaStream {
        return this.premiumVideoStreamHandler.outputMediaStream;
    }

    chooseNewInnerDevice(newDevice: Device): PremiumVideoTransformDevice {
        const newPremiumTransformDevice = new PremiumVideoTransformDevice(
            this.logger, 
            newDevice
        );
        return newPremiumTransformDevice;
    }
    
    getInnerDevice(): Device {
        return this.device;
    }
}