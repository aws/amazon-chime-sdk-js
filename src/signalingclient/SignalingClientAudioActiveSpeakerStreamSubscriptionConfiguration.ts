// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkAudioActiveSpeakerStreamSubscriptionConfiguration } from "../signalingprotocol/SignalingProtocol";
  
  /**
 * [[SignalingClientAudioActiveSpeakerStreamSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.AudioActiveSpeakerStreamSubscriptionConfiguration`
 */
export default class SignalingClientAudioActiveSpeakerStreamSubscriptionConfiguration {
    mids?: string[];
  
    equals(other: this): boolean {
      return (
        other !== undefined &&
        this.mids === other.mids
      );
    }

    toSignaled(): SdkAudioActiveSpeakerStreamSubscriptionConfiguration {
      let signaledConfig = new SdkAudioActiveSpeakerStreamSubscriptionConfiguration();
      signaledConfig.mids = this.mids;
      return signaledConfig;
    }
  }