// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Maybe from '../maybe/Maybe';
import MaybeProvider from '../maybe/MaybeProvider';
import ProtocolScreenMessageDetail from '../screenmessagedetail/ProtocolScreenMessageDetail';
import ScreenMessageDetail from '../screenmessagedetail/ScreenMessageDetail';
import { SdkScreenSignalingMessage } from '../screensignalingprotocol/ScreenSignalingProtocol';
import ScreenMessageDetailSerialization from './ScreenMessageDetailSerialization';

export default class ProtocolScreenMessageDetailSerialization
  implements ScreenMessageDetailSerialization {
  deserialize(data: Uint8Array | null): MaybeProvider<ScreenMessageDetail> {
    return Maybe.of(data).map(
      d => new ProtocolScreenMessageDetail(SdkScreenSignalingMessage.decode(d))
    );
  }
}
