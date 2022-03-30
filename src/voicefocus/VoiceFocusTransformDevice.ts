// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AGCOptions, VoiceFocusAudioWorkletNode } from '../../libs/voicefocus/types';
import { NodeArguments, VoiceFocus } from '../../libs/voicefocus/voicefocus';
import AudioMixObserver from '../audiomixobserver/AudioMixObserver';
import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import AudioNodeSubgraph from '../devicecontroller/AudioNodeSubgraph';
import type AudioTransformDevice from '../devicecontroller/AudioTransformDevice';
import type Device from '../devicecontroller/Device';
import VoiceFocusTransformDeviceDelegate from './VoiceFocusTransformDeviceDelegate';
import VoiceFocusTransformDeviceObserver from './VoiceFocusTransformDeviceObserver';

/**
 * A device that augments a {@link Device} to apply Amazon Voice Focus
 * noise suppression to an audio input.
 */
class VoiceFocusTransformDevice implements AudioTransformDevice, AudioMixObserver {
  /** @internal */
  constructor(
    private device: Device,
    private voiceFocus: VoiceFocus,
    private delegate: VoiceFocusTransformDeviceDelegate,
    private nodeOptions: NodeArguments,
    private failed: boolean = false,
    private node: VoiceFocusAudioWorkletNode | undefined = undefined,
    private browserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior(),

    /** farEndStreams` maps from a stream that could cause echo or interfere with double talkto an `AudioSourceNode` that we use to mix multiple such streams.*/
    private farEndStreamToAudioSourceNode: Map<
      MediaStream,
      MediaStreamAudioSourceNode | null
    > = new Map(),

    /** mixDestNode is the Audio Destination Node where farEndStreams got mixed into one stream.*/
    private mixDestNode: MediaStreamAudioDestinationNode | undefined = undefined,

    /** mixSourceNode is the Audio Source Node where the stream out of mixDestNode got transfered into Audio Worklet Node for processing.*/
    private mixSourceNode: MediaStreamAudioSourceNode | undefined = undefined
  ) {}

  /**
   * Return the inner device as provided during construction, or updated via
   * {@link VoiceFocusTransformDevice.chooseNewInnerDevice}. Do not confuse
   * this method with {@link VoiceFocusTransformDevice.intrinsicDevice}.
   */
  getInnerDevice(): Device {
    return this.device;
  }

  /**
   * Disable the audio node while muted to reduce CPU usage.
   *
   * @param muted whether the audio device should be muted.
   */
  async mute(muted: boolean): Promise<void> {
    if (!this.node) {
      return;
    }
    if (muted) {
      await this.node.disable();
    } else {
      await this.node.enable();
    }
  }

  /**
   * Dispose of the inner workings of the transform device. After this method is called
   * you will need to create a new device to use Amazon Voice Focus again.
   */
  async stop(): Promise<void> {
    if (!this.node) {
      return;
    }
    this.node.disconnect();
    await this.node.stop();
  }

  /**
   * If you wish to choose a different inner device, but continue to use Amazon Voice Focus, you
   * can use this method to efficiently create a new device that will reuse
   * the same internal state. Only one of the two devices can be used at a time: switch
   * between them using {@link DeviceController.startAudioInput}.
   *
   * If the same device is passed as is currently in use, `this` is returned.
   *
   * @param inner The new inner device to use.
   */
  async chooseNewInnerDevice(inner: Device): Promise<VoiceFocusTransformDevice> {
    // If the new device is 'default', always recreate. Chrome can switch out
    // the real device underneath us.
    if (this.device === inner && !isDefaultDevice(inner)) {
      return this;
    }

    return new VoiceFocusTransformDevice(
      inner,
      this.voiceFocus,
      this.delegate,
      this.nodeOptions,
      this.failed,
      this.node,
      this.browserBehavior,
      this.farEndStreamToAudioSourceNode,
      this.mixDestNode,
      this.mixSourceNode
    );
  }

  async intrinsicDevice(): Promise<Device> {
    if (this.failed) {
      return this.device;
    }
    const isUsingES = this.nodeOptions.es;

    // Turn the Device into constraints with appropriate AGC settings.
    const trackConstraints: MediaTrackConstraints = {
      echoCancellation: !isUsingES,
      // @ts-ignore
      googEchoCancellation: !isUsingES,
      // @ts-ignore
      googEchoCancellation2: !isUsingES,

      noiseSuppression: false,

      // @ts-ignore
      googNoiseSuppression: false,
      // @ts-ignore
      googHighpassFilter: false,
      // @ts-ignore
      googNoiseSuppression2: false,
    };

    let useBuiltInAGC;
    if (this.nodeOptions && this.nodeOptions.agc !== undefined) {
      useBuiltInAGC = this.nodeOptions.agc.useBuiltInAGC;
    } else {
      useBuiltInAGC = true;
    }

    trackConstraints.autoGainControl = useBuiltInAGC;
    // @ts-ignore
    trackConstraints.googAutoGainControl = useBuiltInAGC;
    // @ts-ignore
    trackConstraints.googAutoGainControl2 = useBuiltInAGC;

    // Empty string and null.
    if (!this.device) {
      return trackConstraints;
    }

    // Device ID.
    if (typeof this.device === 'string') {
      /* istanbul ignore if */
      if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
        trackConstraints.deviceId = this.device;
      } else {
        trackConstraints.deviceId = { exact: this.device };
      }
      return trackConstraints;
    }

    // It's a stream.
    if ((this.device as MediaStream).id) {
      // Nothing we can do.
      return this.device;
    }

    // It's constraints.
    return {
      ...this.device,
      ...trackConstraints,
    };
  }

  async createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph> {
    if (this.node?.context === context) {
      return {
        start: this.node,
        end: this.node,
      };
    }

    const agc: AGCOptions = { useVoiceFocusAGC: false };
    const options = {
      enabled: true,
      agc,
      ...this.nodeOptions,
    };

    try {
      this.node?.disconnect();
      this.node = await this.voiceFocus.createNode(context, options);
      if (this.nodeOptions.es) {
        this.mixDestNode = new MediaStreamAudioDestinationNode(context, {
          channelCount: 1,
          channelCountMode: 'explicit',
        });
        for (const stream of this.farEndStreamToAudioSourceNode.keys()) {
          this.assignFarEndStreamToAudioSourceNode(stream);
        }
        this.createMixSourceNode();
      }
      const start = this.node;
      const end = this.node;
      return { start, end };
    } catch (e) {
      // It's better to return some audio stream than nothing.
      this.failed = true;
      this.delegate.onFallback(this, e);
      throw e;
    }
  }

  async observeMeetingAudio(audioVideo: AudioVideoFacade): Promise<void> {
    if (!this.nodeOptions.es) {
      return;
    }
    audioVideo.addAudioMixObserver(this);
    const stream = await audioVideo.getCurrentMeetingAudioStream();
    if (stream) {
      this.addFarEndStream(stream);
    }
  }

  async unObserveMeetingAudio(audioVideo: AudioVideoFacade): Promise<void> {
    if (!this.nodeOptions.es) {
      return;
    }
    audioVideo.removeAudioMixObserver(this);
    const stream = await audioVideo.getCurrentMeetingAudioStream();
    if (stream) {
      this.removeFarendStream(stream);
    }
  }

  /**
   * Add an observer to receive notifications about Amazon Voice Focus lifecycle events.
   * See {@link VoiceFocusTransformDeviceObserver} for details.
   * If the observer has already been added, this method call has no effect.
   */
  addObserver(observer: VoiceFocusTransformDeviceObserver): void {
    this.delegate.addObserver(observer);
  }

  /**
   * Remove an existing observer. If the observer has not been previously {@link
   * VoiceFocusTransformDevice.addObserver|added}, this method call has no effect.
   */
  removeObserver(observer: VoiceFocusTransformDeviceObserver): void {
    this.delegate.removeObserver(observer);
  }

  async addFarEndStream(activeStream: MediaStream | null): Promise<void> {
    if (
      !this.nodeOptions.es ||
      !activeStream ||
      this.farEndStreamToAudioSourceNode.has(activeStream)
    ) {
      return;
    }
    if (this.node) {
      this.assignFarEndStreamToAudioSourceNode(activeStream);
    } else {
      this.farEndStreamToAudioSourceNode.set(activeStream, null);
    }
  }

  async removeFarendStream(inactiveStream: MediaStream): Promise<void> {
    this.farEndStreamToAudioSourceNode.get(inactiveStream)?.disconnect();
    this.farEndStreamToAudioSourceNode.delete(inactiveStream);
  }

  async meetingAudioStreamBecameActive(activeStream: MediaStream | null): Promise<void> {
    this.addFarEndStream(activeStream);
  }

  async meetingAudioStreamBecameInactive(inactiveStream: MediaStream): Promise<void> {
    this.removeFarendStream(inactiveStream);
  }

  private assignFarEndStreamToAudioSourceNode(streamToAdd: MediaStream): void {
    const streamNodeToAdd = (this.node.context as AudioContext).createMediaStreamSource(
      streamToAdd
    );
    streamNodeToAdd.channelCount = 1;
    streamNodeToAdd.channelCountMode = 'explicit';
    this.farEndStreamToAudioSourceNode.set(streamToAdd, streamNodeToAdd);
    streamNodeToAdd.connect(this.mixDestNode, 0);
  }

  private createMixSourceNode(): void {
    this.mixSourceNode = (this.node.context as AudioContext).createMediaStreamSource(
      this.mixDestNode.stream
    );
    this.mixSourceNode.channelCount = 1;
    this.mixSourceNode.channelCountMode = 'explicit';
    this.mixSourceNode.connect(this.node, 0, 1);
  }
}

function isDefaultDevice(device: Device): boolean {
  if (device === 'default') {
    return true;
  }
  if (!device || typeof device !== 'object') {
    return false;
  }
  if ('deviceId' in device && device.deviceId === 'default') {
    return true;
  }
  if ('id' in device && device.id === 'default') {
    return true;
  }
  return false;
}

export default VoiceFocusTransformDevice;
