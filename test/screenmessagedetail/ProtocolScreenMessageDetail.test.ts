// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import ProtocolScreenMessageDetail from '../../src/screenmessagedetail/ProtocolScreenMessageDetail';
import { ISdkScreenSignalingMessage } from '../../src/screensignalingprotocol/ScreenSignalingProtocol';

describe('ProtocolScreenMessageDetail', () => {
  describe('#attendeeId', () => {
    it('is delegated', () => {
      const message = Substitute.for<ISdkScreenSignalingMessage>();
      message.attendeeId.returns('attendeeId');
      chai.expect(new ProtocolScreenMessageDetail(message).attendeeId).to.eq('attendeeId');
    });
  });
});
