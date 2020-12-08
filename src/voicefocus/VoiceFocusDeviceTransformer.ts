// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { VoiceFocusFetchBehavior, VoiceFocusPaths } from '../../libs/voicefocus/types';
import { Logger as VoiceFocusLogger } from '../../libs/voicefocus/types';
import type { NodeArguments } from '../../libs/voicefocus/voicefocus';
import { VoiceFocus } from '../../libs/voicefocus/voicefocus';
import type Device from '../devicecontroller/Device';
import Logger from '../logger/Logger';
import Versioning from '../versioning/Versioning';
import type AssetSpec from './AssetSpec';
import LoggerAdapter from './LoggerAdapter';
import type VoiceFocusConfig from './VoiceFocusConfig';
import type VoiceFocusDeviceOptions from './VoiceFocusDeviceOptions';
import type VoiceFocusSpec from './VoiceFocusSpec';
import VoiceFocusTransformDevice from './VoiceFocusTransformDevice';
import VoiceFocusTransformDeviceDelegate from './VoiceFocusTransformDeviceDelegate';

/**
 * `VoiceFocusDeviceTransformer` is used to create {@link VoiceFocusTransformDevice|transform devices}
 * that apply Amazon Voice Focus noise suppression to audio input.
 *
 * This transformer captures relevant configuration. You should check for support, initialize,
 * and then create a device as follows:
 *
 * ```
 * const deviceID = null;
 *
 * // This check for support is cheap and quick, and should be used to gate use
 * // of this feature.
 * if (!(await VoiceFocusDeviceTransformer.isSupported()) {
 *   console.log('Amazon Voice Focus not supported in this browser.');
 *   return deviceID;
 * }
 *
 * let transformer: VoiceFocusDeviceTransformer;
 * try {
 *   // This operation can fail in ways that do not indicate no support,
 *   // but do indicate an inability to apply Amazon Voice Focus. Trying again
 *   // might succeed.
 *   transformer = await VoiceFocusDeviceTransformer.create({});
 * } catch (e) {
 *   // Something went wrong.
 *   console.log('Unable to instantiate Amazon Voice Focus.');
 *   return deviceID;
 * }
 *
 * if (!transformer.isSupported()) {
 *   // The transformer will fall through, but your UI might care.
 *   console.log('Amazon Voice Focus not supported in this browser.');
 * }
 *
 * return await transformer.createTransformDevice(deviceID);
 * ```
 */
export class VoiceFocusDeviceTransformer {
  // The Voice Focus logger is a bit more sophisticated, allowing following args,
  // and allows drop-in use of `console`. We create an adapter to allow SDK loggers
  // to be used until they match.
  private logger: Logger;
  private vfLogger: VoiceFocusLogger;
  private preload: boolean;

  private configuration: Promise<VoiceFocusConfig>;
  private fetchBehavior: VoiceFocusFetchBehavior;
  private pendingVoiceFocus: Promise<[VoiceFocus, VoiceFocusTransformDeviceDelegate]>;
  private supported = true;

  /**
   * Quickly check whether Amazon Voice Focus is supported on this platform.
   *
   * This will return `false` if key technologies are absent. A value of `true` does not
   * necessarily mean that adding Amazon Voice Focus will succeed: it is still possible that the
   * configuration of the page or the CPU speed of the device are limiting factors.
   *
   * `VoiceFocusDeviceTransformer.create` will return an instance whose `isSupported()`
   * method more accurately reflects whether Amazon Voice Focus is supported in the current environment.
   *
   * This method will only reject if you provide invalid inputs.
   *
   * @param spec An optional asset group and URL paths to use when fetching. You can pass
   *             a complete `VoiceFocusSpec` here for convenience, matching the signature of `create`.
   * @param options Additional named arguments, including `logger`.
   */
  static isSupported(
    spec?: AssetSpec & { paths?: VoiceFocusPaths },
    options?: { logger?: Logger }
  ): Promise<boolean> {
    const fetchBehavior = VoiceFocusDeviceTransformer.defaultFetchBehavior();
    const logger = options?.logger ? new LoggerAdapter(options.logger) : undefined;
    const opts = {
      fetchBehavior,
      logger,
    };
    return VoiceFocus.isSupported(VoiceFocusDeviceTransformer.augmentSpec(spec), opts);
  }

  /**
   * Create a transformer that can apply Amazon Voice Focus noise suppression to a device.
   *
   * This method will reject if the provided spec is invalid, or if the process of
   * checking for support or estimating fails (e.g., because the network is unreachable).
   *
   * If Amazon Voice Focus is not supported on this device, this call will not reject and
   * `isSupported()` will return `false` on the returned instance. That instance will
   * pass through devices unmodified.
   *
   * @param spec A definition of how you want Amazon Voice Focus to behave. See the declaration of
   *             {@link VoiceFocusSpec}` for details.
   * @param options Additional named arguments, including `logger` and `preload`.
   */
  static async create(
    spec: VoiceFocusSpec = {},
    options: VoiceFocusDeviceOptions = {}
  ): Promise<VoiceFocusDeviceTransformer> {
    const transformer = new VoiceFocusDeviceTransformer(spec, options);

    // This also preps the first VoiceFocus instance.
    await transformer.init();
    return transformer;
  }

  /**
   * Return whether this transformer is able to function in this environment.
   * If not, calls to
   * {@link VoiceFocusDeviceTransformer.createTransformDevice|createTransformDevice}`
   * will pass through an unmodified device.
   */
  isSupported(): boolean {
    return this.supported;
  }

  /**
   * Apply Amazon Voice Focus to the selected {@link Device}.
   *
   * If this is a stream, it should be one that does not include other noise suppression features,
   * and you should consider whether to disable automatic gain control (AGC) on the stream, because
   * it can interact with noise suppression.
   *
   * @returns a device promise. This will always resolve to either a
   *          {@link VoiceFocusTransformDevice} or undefined; it will never reject.
   */
  async createTransformDevice(
    device: Device,
    nodeOptions?: NodeArguments
  ): Promise<VoiceFocusTransformDevice | undefined> {
    if (!this.supported) {
      // Fall back.
      return undefined;
    }

    try {
      const preload = true;
      const [vf, delegate] = await this.allocateVoiceFocus(preload);
      return new VoiceFocusTransformDevice(device, vf, delegate, nodeOptions);
    } catch (e) {
      // Fall back.
      /* istanbul ignore next */
      return undefined;
    }
  }

  private constructor(
    private spec: VoiceFocusSpec,
    {
      preload = true,
      logger,
      fetchBehavior = VoiceFocusDeviceTransformer.defaultFetchBehavior(),
    }: VoiceFocusDeviceOptions
  ) {
    this.logger = logger;
    this.vfLogger = logger ? new LoggerAdapter(logger) : undefined;
    this.preload = preload;
    this.fetchBehavior = fetchBehavior;

    // If the user didn't specify one, add the default, which is
    // identified by the major and minor SDK version.
    this.spec = VoiceFocusDeviceTransformer.augmentSpec(this.spec);
  }

  private static augmentSpec(spec: VoiceFocusSpec): VoiceFocusSpec {
    if (!spec || (!spec.assetGroup && !spec.revisionID)) {
      return {
        ...spec,
        assetGroup: VoiceFocusDeviceTransformer.currentSDKAssetGroup(),
      };
    }
    return spec;
  }

  private async configure(): Promise<VoiceFocusConfig> {
    const options = {
      fetchBehavior: this.fetchBehavior,
      logger: this.vfLogger,
    };

    return VoiceFocus.configure(this.spec, options);
  }

  private async init(): Promise<void> {
    this.configuration = this.configure();

    const config = await this.configuration;
    if (!config.supported) {
      // No need to init: it won't work.
      this.supported = false;
      return;
    }

    // We initialize the first one right now, which makes it easier to detect
    // possible failures.
    // This can throw for malformed input. Pass that up the chain.
    this.pendingVoiceFocus = this.createVoiceFocus(config, this.preload);

    try {
      await this.pendingVoiceFocus;
    } catch (e) {
      this.logger?.error(`Unable to initialize Amazon Voice Focus: ${e}`);
      this.supported = false;
    }
  }

  private async createVoiceFocus(
    config: VoiceFocusConfig,
    preload: boolean
  ): Promise<[VoiceFocus, VoiceFocusTransformDeviceDelegate]> {
    const delegate = new VoiceFocusTransformDeviceDelegate();
    const vf = await VoiceFocus.init(config, { delegate, preload, logger: this.vfLogger });
    return [vf, delegate];
  }

  private async allocateVoiceFocus(
    preload: boolean
  ): Promise<[VoiceFocus, VoiceFocusTransformDeviceDelegate]> {
    // A little safety.
    /* istanbul ignore next */
    if (!this.supported) {
      throw new Error('Not supported.');
    }

    if (this.pendingVoiceFocus) {
      // Use the one we already have, and free the slot for any future execution.
      const vf = this.pendingVoiceFocus;
      this.pendingVoiceFocus = undefined;
      return vf;
    }

    return this.createVoiceFocus(await this.configuration, preload);
  }

  private static majorVersion(): string {
    return Versioning.sdkVersion.match(/^[1-9][0-9]*\.(?:0|[1-9][0-9]*)/)[0];
  }

  private static majorMinorVersion(): string {
    return Versioning.sdkVersion.match(/^[1-9][0-9]*\.(?:0|(?:[1-9][0-9]*))\.(?:0|[1-9][0-9]*)/)[0];
  }

  private static currentSDKAssetGroup(): string {
    // Just on the off chance someone does something silly, handle
    // malformed version strings here.
    const v = this.majorVersion();

    // Just a little safety.
    /* istanbul ignore next */
    if (!v) {
      return `stable-v1`;
    }

    return `sdk-${v}`;
  }

  // Note that we use query strings here, not headers, in order to make these requests 'simple' and
  // avoid the need for CORS preflights.
  // Be very, very careful if you choose to add headers here. You should never need to.
  private static defaultFetchBehavior(): VoiceFocusFetchBehavior {
    // Just a little safety.
    /* istanbul ignore next */
    const version = VoiceFocusDeviceTransformer.majorMinorVersion() || 'unknown';
    const ua = Versioning.sdkUserAgentLowResolution;
    return {
      escapedQueryString: `sdk=${encodeURIComponent(version)}&ua=${encodeURIComponent(ua)}`,
    };
  }
}

export default VoiceFocusDeviceTransformer;
