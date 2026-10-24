// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AudioVideoFacade,
  ConsoleLogger,
  Device,
  LogLevel,
  VoiceFocusDeviceTransformer,
  VoiceFocusModelComplexity,
  VoiceFocusModelName,
  VoiceFocusPaths,
  VoiceFocusSpec,
  VoiceFocusTransformDevice,
} from 'amazon-chime-sdk-js';

import { VoiceFocusOverrides } from '../config/MeetingConfig';
import { STRINGS } from '../strings';
import { JoinInfo } from './ApiClient';

const MAX_VOICE_FOCUS_COMPLEXITY: VoiceFocusModelComplexity | undefined = undefined;

function modelName(name: string | undefined): VoiceFocusModelName | undefined {
  return name && ['default', 'ns_es'].includes(name) ? (name as VoiceFocusModelName) : undefined;
}

/** Amazon Voice Focus support check, transformer creation and device wrapping. */
export default class VoiceFocus {
  supported = false;
  /** False until `checkSupport` has run; `supported` is meaningless before that. */
  checked = false;
  /** Voice Focus stopped processing (fell back to the raw microphone, or cannot keep up). */
  onDegraded: ((reason: string) => void) | undefined;
  private insufficientResourcesReported = false;
  private transformer: VoiceFocusDeviceTransformer | undefined;
  private device: VoiceFocusTransformDevice | undefined;
  /** One transformer per page: concurrent callers share the in-flight model download. */
  private transformerPromise: Promise<VoiceFocusDeviceTransformer> | undefined;
  /** One transform device at a time: a second wrap while the first is being built reuses it. */
  private devicePromise: Promise<VoiceFocusTransformDevice | undefined> | undefined;
  private readonly logger: ConsoleLogger;

  constructor(
    private readonly overrides: VoiceFocusOverrides,
    logLevel: LogLevel
  ) {
    this.logger = new ConsoleLogger('SDK', logLevel);
  }

  /** A fresh spec each call: the SDK mutates what it is given and the first meeting's choice must not leak. */
  spec(joinInfo: JoinInfo): VoiceFocusSpec {
    const echoReduction =
      joinInfo?.Meeting?.Meeting?.MeetingFeatures?.Audio?.EchoReduction === 'AVAILABLE';
    const paths: VoiceFocusPaths | undefined = this.overrides.cdn
      ? {
          processors: `${this.overrides.cdn}processors/`,
          wasm: `${this.overrides.cdn}wasm/`,
          workers: `${this.overrides.cdn}workers/`,
          models: `${this.overrides.cdn}wasm/`,
        }
      : undefined;
    return {
      name: modelName(this.overrides.name) ?? modelName(echoReduction ? 'ns_es' : 'default'),
      assetGroup: this.overrides.assetGroup,
      revisionID: this.overrides.revisionID,
      paths,
    };
  }

  async checkSupport(joinInfo: JoinInfo): Promise<boolean> {
    try {
      this.supported = await VoiceFocusDeviceTransformer.isSupported(this.spec(joinInfo), {
        logger: this.logger,
      });
      if (this.supported) {
        this.transformer = await this.getTransformer(joinInfo);
        this.supported = !!this.transformer && this.transformer.isSupported();
      }
    } catch {
      this.supported = false;
    }
    this.checked = true;
    this.logger.info(`[DEMO] Amazon Voice Focus ${this.supported ? 'is' : 'is not'} supported.`);
    return this.supported;
  }

  private getTransformer(joinInfo: JoinInfo): Promise<VoiceFocusDeviceTransformer> {
    this.transformerPromise ??= this.createTransformer(joinInfo).catch(error => {
      this.transformerPromise = undefined;
      throw error;
    });
    return this.transformerPromise;
  }

  private async createTransformer(joinInfo: JoinInfo): Promise<VoiceFocusDeviceTransformer> {
    const spec = this.spec(joinInfo);
    const config = await VoiceFocusDeviceTransformer.configure(spec, { logger: this.logger });
    const exceeds = (configured: VoiceFocusModelComplexity): boolean =>
      Number.parseInt(configured.substring(1), 10) >
      Number.parseInt(MAX_VOICE_FOCUS_COMPLEXITY!.substring(1), 10);
    if (MAX_VOICE_FOCUS_COMPLEXITY && config.supported && exceeds(config.model.variant)) {
      this.logger.info(`Downgrading VF to ${MAX_VOICE_FOCUS_COMPLEXITY}`);
      spec.variant = MAX_VOICE_FOCUS_COMPLEXITY;
      this.transformer = await VoiceFocusDeviceTransformer.create(
        spec,
        { logger: this.logger },
        undefined,
        joinInfo
      );
    } else {
      this.transformer = await VoiceFocusDeviceTransformer.create(
        spec,
        { logger: this.logger },
        config,
        joinInfo
      );
    }
    return this.transformer;
  }

  /** Wrap `inner` in a Voice Focus device, reusing the existing one when possible. */
  async wrap(
    inner: Device,
    joinInfo: JoinInfo,
    audioVideo: AudioVideoFacade
  ): Promise<Device | VoiceFocusTransformDevice> {
    if (!this.supported) {
      return inner;
    }
    // Checked before any await, so overlapping calls see the device that is already being built.
    if (this.devicePromise) {
      const existing = await this.devicePromise;
      if (existing) {
        return (this.device = await existing.chooseNewInnerDevice(inner));
      }
    }
    this.devicePromise = this.createDevice(inner, joinInfo, audioVideo);
    return (await this.devicePromise) ?? inner;
  }

  private async createDevice(
    inner: Device,
    joinInfo: JoinInfo,
    audioVideo: AudioVideoFacade
  ): Promise<VoiceFocusTransformDevice | undefined> {
    try {
      const transformer = await this.getTransformer(joinInfo);
      const device = await transformer.createTransformDevice(inner);
      if (device) {
        device.addObserver({
          voiceFocusFellBackToInnerStream: (_device, error) =>
            this.onDegraded?.(STRINGS.voiceFocusCannotProcess(error.message)),
          // Fires every few hundred milliseconds while glitching; report it once per device.
          voiceFocusInsufficientResources: () => {
            if (!this.insufficientResourcesReported) {
              this.insufficientResourcesReported = true;
              this.onDegraded?.(STRINGS.voiceFocusCannotKeepUp);
            }
          },
        });
        await device.observeMeetingAudio(audioVideo);
        return (this.device = device);
      }
    } catch {
      // Fall through to the unprocessed device.
    }
    this.devicePromise = undefined;
    return undefined;
  }

  async stop(): Promise<void> {
    await this.device?.stop();
    this.device = undefined;
    this.devicePromise = undefined;
    this.insufficientResourcesReported = false;
  }
}
