// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenMessageDetail from '../../screenmessagedetail/ScreenMessageDetail';

export default interface ScreenObserver {
  streamDidStart?(screenMessageDetail: ScreenMessageDetail): void;
  streamDidStop?(screenMessageDetail: ScreenMessageDetail): void;
  streamDidSwitch?(screenMessageDetail: ScreenMessageDetail): void;
}
