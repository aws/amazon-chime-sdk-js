// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AGCOptions, VoiceFocusAudioWorkletNode } from '../../libs/voicefocus/types';
import { NodeArguments, VoiceFocus } from '../../libs/voicefocus/voicefocus';
import DefaultBrowserBehavior from '../browserbehavior/DefaultBrowserBehavior';
import AudioNodeSubgraph from '../devicecontroller/AudioNodeSubgraph';
import type AudioTransformDevice from '../devicecontroller/AudioTransformDevice';
import type Device from '../devicecontroller/Device';
import VoiceFocusTransformDeviceDelegate from './VoiceFocusTransformDeviceDelegate';
import VoiceFocusTransformDeviceObserver from './VoiceFocusTransformDeviceObserver';

/**
 * A device that augments an {@link Device} to apply Amazon Voice Focus
 * noise suppression to an audio input.
 */
class VoiceFocusTransformDevice implements AudioTransformDevice {
  /** @internal */
  constructor(
    private device: Device,
    private voiceFocus: VoiceFocus,
    private delegate: VoiceFocusTransformDeviceDelegate,
    private nodeOptions: NodeArguments,
    private failed: boolean = false,
    private node: VoiceFocusAudioWorkletNode | undefined = undefined,
    private browserBehavior: DefaultBrowserBehavior = new DefaultBrowserBehavior()
  ) {}

  /**
   * Return the inner device as provided during construction, or updated via
   * {@link chooseNewInnerDevice}. Do not confuse this method with {@link intrinsicDevice}.
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
   * between them using {@link DeviceController.chooseAudioInputDevice}.
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
      this.browserBehavior
    );
  }

  async intrinsicDevice(): Promise<Device> {
    if (this.failed) {
      return this.device;
    }

    // Turn the Device into constraints with appropriate AGC settings.
    const trackConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      // @ts-ignore
      googEchoCancellation: true,
      // @ts-ignore
      googEchoCancellation2: true,

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
    const agc: AGCOptions = { useVoiceFocusAGC: false };
    const options = {
      enabled: true,
      agc,
      ...this.nodeOptions,
    };

    try {
      this.node = await this.voiceFocus.createNode(context, options);
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
