// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkAudioTopNStreamSubscriptionConfiguration } from "../signalingprotocol/SignalingProtocol";
  
  /**
 * [[SignalingClientAudioTopNStreamSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.AudioTopNStreamSubscriptionConfiguration`
 */
export default class SignalingClientAudioTopNStreamSubscriptionConfiguration {
    mids?: string[];
  
    equals(other: this): boolean {
      return (
        other !== undefined &&
        this.mids === other.mids
      );
    }

    toSignaled(): SdkAudioTopNStreamSubscriptionConfiguration {
      let signaledConfig = new SdkAudioTopNStreamSubscriptionConfiguration();
      signaledConfig.mids = this.mids;
      return signaledConfig;
    }
  }