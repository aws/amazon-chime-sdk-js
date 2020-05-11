// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import Maybe from '../../src/maybe/Maybe';
import ProtocolScreenMessageDetail from '../../src/screenmessagedetail/ProtocolScreenMessageDetail';
import ProtocolScreenMessageDetailSerialization from '../../src/screenmessagedetailserialization/ProtocolScreenMessageDetailSerialization';
import { SdkScreenSignalingMessage } from '../../src/screensignalingprotocol/ScreenSignalingProtocol';

describe('ProtocolScreenMessageDetailSerialization', () => {
  const subject = new ProtocolScreenMessageDetailSerialization();

  describe('#deserialize', () => {
    describe('null', () => {
      it('is none', () => {
        chai.expect(subject.deserialize(null).isNone).to.be.true;
      });
    });

    it('is deserialized', () => {
      const attendeeId = 'attendeeId';
      const message = SdkScreenSignalingMessage.create({ attendeeId: attendeeId });
      const data = SdkScreenSignalingMessage.encode(message).finish();
      chai
        .expect(subject.deserialize(data))
        .to.eql(Maybe.of(new ProtocolScreenMessageDetail(message)));
    });
  });
});
