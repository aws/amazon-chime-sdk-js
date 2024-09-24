// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkAudioMixedStreamSubscriptionConfiguration } from "../signalingprotocol/SignalingProtocol";

/**
 * [[SignalingClientAudioMixedStreamSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.AudioMixedStreamSubscriptionConfiguration`
 */
export default class SignalingClientAudioMixedStreamSubscriptionConfiguration {
    mid?: string;
  
    equals(other: this): boolean {
      return (
        other !== undefined &&
        this.mid === other.mid
      );
    }

    toSignaled(): SdkAudioMixedStreamSubscriptionConfiguration {
      let signaledConfig = new SdkAudioMixedStreamSubscriptionConfiguration();
      signaledConfig.mid = this.mid;
      return signaledConfig;
    }
  }
  