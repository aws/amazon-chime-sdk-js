import Logger from "../logger/Logger";

const DEFAULT_FRAMERATE = 15;

/** @internal */
interface HTMLCanvasElementWithCaptureStream extends HTMLCanvasElement {
    // Not in IE, but that's OK.
    captureStream(frameRate?: number): MediaStream;
}

export default class PremiumVideoStreamHandler {
    private framerate: number = DEFAULT_FRAMERATE;
    private lastTimeOut: ReturnType<typeof setTimeout> | undefined;
    private hasStarted: boolean = false;

    // Inputs
    private videoInput: HTMLVideoElement = document.createElement('video') as HTMLVideoElement;
    private canvasInput: HTMLCanvasElement = document.createElement('canvas');
    private inputCtx = this.canvasInput.getContext('2d');
    private inputVideoStream: MediaStream | null = null;

    // Outputs
    private canvasOutput: HTMLCanvasElementWithCaptureStream = document.createElement(
        'canvas'
    ) as HTMLCanvasElementWithCaptureStream;
    private outputCtx = this.canvasOutput.getContext('2d');
    outputMediaStream: MediaStream = new MediaStream();

    // Constructor just sets a logger for the object
    constructor(private logger: Logger) {}
 
    getActiveOutputMediaStream(): MediaStream {
        if (this.isOutputMediaStreamActive()) {
            return this.outputMediaStream;
        }
        this.outputMediaStream = this.canvasOutput.captureStream(this.framerate);
        this.cloneInputAudioTracksToOutput();
        return this.outputMediaStream;
    }

    stopStream(): void {
        throw new Error('Method not implemented.');
    }
    destroyStream(): void {
        throw new Error('Method not implemented.');
    }

    async setInputMediaStream(inputMediaStream: MediaStream | null): Promise<void> {
        if (!inputMediaStream) {
            this.stop();
            return;
        }

        if (inputMediaStream.getVideoTracks().length === 0) {
            this.logger.error("No video tracks in input media stream, ignoring");
            return;
        }


        this.inputVideoStream = inputMediaStream;
        const settings = this.inputVideoStream.getVideoTracks()[0].getSettings();
        this.canvasOutput.width = settings.width;
        this.canvasOutput.height = settings.height;
        this.videoInput.addEventListener('loadedmetadata', this.process); // this will be the trigger function
        this.videoInput.srcObject = this.inputVideoStream;
        // avoid iOS safari full screen video -- not sure what this does
        this.videoInput.setAttribute('playsinline', 'true');
        
        this.videoInput.load();
        try {
            await this.videoInput.play();
        } catch {
            this.logger.warn('Video element play() overriden by another load()');
        }

        this.cloneInputAudioTracksToOutput();
    }

    // WHY IS THE FUNCTION DECLARED LIKE THIS?????
    process = async (_event:Event): Promise<void> => {
        if (!this.inputVideoStream) {
            return;
        }
        const processVideoStart = performance.now();

        // Draw the videoInput onto our input canvas
        if (this.videoInput.videoWidth) {
            // Match input canvas to same dimensions as our input stream 
            if (this.canvasInput.width !== this.videoInput.videoWidth || 
                 this.canvasInput.height !== this.videoInput.videoHeight) {
                this.canvasInput.width = this.videoInput.videoWidth;
                this.canvasInput.height = this.videoInput.videoHeight;
            }
            this.inputCtx.drawImage(this.videoInput, 0, 0);
        }

        // Collect out input frame data
        let inputImageData = this.inputCtx.getImageData(0, 0, 
            this.canvasInput.width, this.canvasInput.height);

        // Transform input data

        // Confirm that the output canvas is still matching video frame size
        if (this.canvasOutput.width !== this.videoInput.videoWidth && 
            this.canvasOutput.height !== this.videoInput.videoHeight) {
           this.canvasOutput.width = this.videoInput.videoWidth;
           this.canvasOutput.height = this.videoInput.videoHeight;
       }
    
       // Place transformed data onto outp
        this.outputCtx.putImageData(inputImageData, 0, 0);

        if (!this.hasStarted) {
            this.hasStarted = true;
        }

        // timing to maintain requested fps
        const processVideoLatency = performance.now() - processVideoStart;
        //const leave = (1000 * 2) / this.framerate - processVideoLatency; // half fps
        const nextFrameDelay = Math.max(0, 1000 / this.framerate - processVideoLatency);

        // TODO: use requestAnimationFrame which is more organic and allows browser to conserve resources by its choices.
        /* @ts-ignore */
        this.lastTimeout = setTimeout(this.process, nextFrameDelay);
    }

    stop() {;
        this.videoInput.removeEventListener('loadedmetadata', this.process)
        this.videoInput.srcObject = null;

        this.destroyInputMediaAndBuffers();

        // Stop all the output tracks, but don't discard the media stream,
        // because it's how other parts of the codebase recognize when
        // a selected stream is part of this transform device.
        if (this.outputMediaStream) {
            for (const track of this.outputMediaStream.getVideoTracks()) {
            track.stop();
            }
        }

        // This will prevent the process loop from continuing to call itself
        if (this.lastTimeOut) {
            clearTimeout(this.lastTimeOut);
            this.lastTimeOut = undefined;
        }

        if (this.hasStarted) {
            this.hasStarted = false;
        }
        
    }

    private destroyInputMediaAndBuffers() {
        if (this.inputVideoStream) {
            for (const track of this.inputVideoStream.getTracks()) {
              track.stop();
            }
        }
        this.inputVideoStream = null;
    }

    private cloneInputAudioTracksToOutput(): void {
        if (!this.isOutputMediaStreamActive() || this.inputVideoStream === null) {
            this.logger.info('Not cloning input audio tracks to output, do not have media streams ready');
            return; // Just wait for `getActiveOutputMediaStream`
        }

        // Remove current audio tracks from output
        for (const audioTrack of this.outputMediaStream.getAudioTracks()) {
            this.logger.info(`Removing audio track ${audioTrack.id} from output stream`);
            this.outputMediaStream.removeTrack(audioTrack);
        }

        // Add new audio track to output
        for (const audioTrack of this.inputVideoStream.getAudioTracks()) {
            this.logger.info(`Adding audio track ${audioTrack.id} to output stream`);
            this.outputMediaStream.addTrack(audioTrack);
        }
    }

    private isOutputMediaStreamActive(): boolean {
        return this.outputMediaStream && this.outputMediaStream.active;
    }
}