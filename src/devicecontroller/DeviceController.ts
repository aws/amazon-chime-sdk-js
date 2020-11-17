// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import DeviceChangeObserver from '../devicechangeobserver/DeviceChangeObserver';
import RemovableAnalyserNode from '../devicecontroller/RemovableAnalyserNode';
import AudioInputDevice from './AudioInputDevice';
import VideoInputDevice from './VideoInputDevice';
import VideoQualitySettings from './VideoQualitySettings';

/**
 * [[DeviceController]] keeps track of the devices being used for audio input
 * (e.g. microphone), video input (e.g. camera), audio output (e.g. speakers).
 * The list functions return MediaDeviceInfo objects. Once any list function is
 * called, changes in device availability are broadcast to any registered
 * [[DeviceChangeObserver]].
 *
 * Calling a choose function will request permission for the device indicated
 * by the device id or track constraint. Supply null to get the default device.
 * Make sure to choose the audio device before joining the session (even if
 * it is the default device) so that you can offer the user options if the
 * device cannot be selected before a connection is made.
 *
 * Note that in certain situations such as private tabs, the browser may
 * initially decline to provide device labels for when enumerating devices. If
 * this is the case, the internal device label trigger function is called to
 * try to coax the browser in to providing the labels. The default behavior of
 * the function is to make a microphone and camera access request which, if
 * successful, will unlock the labels. You may want to override this behavior to
 * provide a custom UX such as a prompt explaining why microphone and camera
 * access is being asked for by supplying your own function to
 * setDeviceLabelTrigger(). To disable the device label trigger, supply a
 * function that returns a rejected promise instead. For reference, the default
 * implementation calls getUserMedia for audio and video and returns the promise
 * to the stream so that the stream can be cleaned up once the labels are
 * detected.
 *
 * ```
 * (): Promise<MediaStream> => {
 *   return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
 * }
 * ```
 */
export default interface DeviceController {
  /**
   * Lists currently available audio input devices.
   */
  listAudioInputDevices(): Promise<MediaDeviceInfo[]>;

  /**
   * Lists currently available video input devices.
   */
  listVideoInputDevices(): Promise<MediaDeviceInfo[]>;

  /**
   * Lists currently available audio output devices.
   */
  listAudioOutputDevices(): Promise<MediaDeviceInfo[]>;

  /**
   * Selects an audio input device to use. The constraint may be a device id,
   * `MediaTrackConstraint`, `MediaStream` (containing audio track), or `null` to
   * indicate no device. It may also be an {@link AudioTransformDevice} to customize the
   * constraints used or to apply Web Audio transforms.
   *
   * The promise will resolve indicating success or it will throw an appropriate error
   * indicating the failure.
   */
  chooseAudioInputDevice(device: AudioInputDevice): Promise<void>;

  /**
   * Selects a video input device to use. The constraint may be a device id,
   * `MediaTrackConstraint`, `MediaStream` (containing video track), or `null` to
   * indicate no device. The promise will resolve indicating success or it will
   * throw an appropriate error indicating the failure.
   */
  chooseVideoInputDevice(device: VideoInputDevice): Promise<void>;

  /**
   * Selects an audio output device for use. Null specifies the default device.
   * Note: This method will throw an error if browser does not support
   * setSinkId. See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
   */
  chooseAudioOutputDevice(deviceId: string | null): Promise<void>;

  /**
   * Adds an observer to receive callbacks about device changes.
   */
  addDeviceChangeObserver(observer: DeviceChangeObserver): void;

  /**
   * Removes an observer to stop receiving callbacks about device changes.
   */
  removeDeviceChangeObserver(observer: DeviceChangeObserver): void;

  /**
   * Gets an `AnalyserNode` from the current audio input. This node can be used to
   * generate the display for a mic indicator. `null` is returned if no audio
   * input has been selected.
   *
   * The `AnalyserNode` is not updated automatically when you choose a new
   * audio input. Dispose of this one and fetch another by calling this method again.
   *
   * Note that this node should be cleaned up after use, and as such a
   * `{@link RemovableAnalyserNode}` is returned. Call
   * {@link RemovableAnalyserNode.removeOriginalInputs} to disconnect the node from the Web Audio
   * graph.
   */
  createAnalyserNodeForAudioInput(): RemovableAnalyserNode | null;

  /**
   * Starts a video preview of the currently selected video and binds it a video
   * element to be displayed before a meeting begins. Make sure to call
   * [[stopVideoPreviewForVideoInput]] when the preview is no longer necessary
   * so that the stream can be released and turn off the camera if it is not
   * being used anymore.
   */
  startVideoPreviewForVideoInput(element: HTMLVideoElement): void;

  /**
   * Stops the stream for a previously bound video preview and unbinds it from
   * the video element.
   */
  stopVideoPreviewForVideoInput(element: HTMLVideoElement): void;

  /**
   * Sets the device label trigger to use in the case where media device labels
   * are not present due to privacy restrictions in the browser. See above
   * for an explanation of how this works.
   */
  setDeviceLabelTrigger(trigger: () => Promise<MediaStream>): void;

  /**
   * Mixes the audio from the given media stream into the main audio input stream.
   */
  mixIntoAudioInput(stream: MediaStream): MediaStreamAudioSourceNode;

  /**
   * Sets the video input quality parameters to request when enabling video. These settings
   * take effect the next time a video input device is chosen. The default is 960x540 @ 15 fps
   * with a max bandwidth of 1400 kbps.
   */
  chooseVideoInputQuality(
    width: number,
    height: number,
    frameRate: number,
    maxBandwidthKbps: number
  ): void;

  /**
   * Get the current video input quality settings to request when enabling video.
   */
  getVideoInputQualitySettings(): VideoQualitySettings | null;
}
