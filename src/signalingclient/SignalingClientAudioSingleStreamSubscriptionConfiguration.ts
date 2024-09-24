// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SdkAudioSingleStreamSubscriptionConfiguration } from "../signalingprotocol/SignalingProtocol";

/**
 * [[SignalingClientAudioSingleStreamSubscriptionConfiguration]] is an internal representation of
 * `SignalingProtocol.AudioSingleStreamSubscriptionConfiguration`
 */
export default class SignalingClientAudioSingleStreamSubscriptionConfiguration {
  mid?: string;
  audioStreamId?: number;

  equals(other: this): boolean {
    return (
      other !== undefined &&
      this.mid === other.mid &&
      this.audioStreamId === other.audioStreamId
    );
  }

  toSignaled(): SdkAudioSingleStreamSubscriptionConfiguration {
    let signaledConfig = new SdkAudioSingleStreamSubscriptionConfiguration();
    signaledConfig.mid = this.mid;
    signaledConfig.audioStreamId = this.audioStreamId;
    return signaledConfig;
  }
}
