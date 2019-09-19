// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import MaybeProvider from '../maybe/MaybeProvider';
import ScreenMessageDetail from '../screenmessagedetail/ScreenMessageDetail';

export default interface ScreenMessageDetailSerialization {
  /**
   * Payload deserializer
   * @param {Uint8Array} data
   * @returns {ScreenMessageDetail}
   */
  deserialize(data: Uint8Array): MaybeProvider<ScreenMessageDetail>;
}
