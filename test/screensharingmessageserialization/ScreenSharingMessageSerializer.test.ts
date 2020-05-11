// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import Maybe from '../../src/maybe/Maybe';
import ScreenMessageDetail from '../../src/screenmessagedetail/ScreenMessageDetail';
import ScreenMessageDetailSerialization from '../../src/screenmessagedetailserialization/ScreenMessageDetailSerialization';
import ScreenSharingMessage from '../../src/screensharingmessage/ScreenSharingMessage';
import ScreenSharingMessageFlag from '../../src/screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageType from '../../src/screensharingmessage/ScreenSharingMessageType';
import ScreenSharingMessageFlagSerialization from '../../src/screensharingmessageserialization/ScreenSharingMessageFlagSerialization';
import ScreenSharingMessageSerializer from '../../src/screensharingmessageserialization/ScreenSharingMessageSerializer';
import ScreenSharingMessageTypeSerialization from '../../src/screensharingmessageserialization/ScreenSharingMessageTypeSerialization';
import DOMBlobMock from '../domblobmock/DOMBlobMock';

describe('ScreenSharingMessageSerializer', () => {
  // eslint-disable-next-line
  const GlobalAny = global as any;

  before(() => {
    chai.should();
    GlobalAny.Blob = DOMBlobMock;
  });

  after(() => {
    delete GlobalAny.Blob;
  });

  describe('#serialize', () => {
    it('is serialized', () => {
      const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
      const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
      const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();

      const subject = new ScreenSharingMessageSerializer(
        typeSerialization,
        flagSerialization,
        signalingSerialization
      );

      typeSerialization.serialize(Arg.any()).returns(0xa);
      flagSerialization.serialize(Arg.any()).returns(0xb);

      const message: ScreenSharingMessage = {
        type: ScreenSharingMessageType.HeartbeatRequestType,
        flags: [ScreenSharingMessageFlag.Broadcast],
        data: new Uint8Array([0x01]),
      };

      subject.serialize(message).should.be.instanceOf(GlobalAny.Blob);
    });
  });

  describe('#deserialize', () => {
    it('is deserialized', () => {
      const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
      const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
      const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
      const subject = new ScreenSharingMessageSerializer(
        typeSerialization,
        flagSerialization,
        signalingSerialization
      );

      typeSerialization
        .deserialize(Arg.any())
        .returns(ScreenSharingMessageType.HeartbeatRequestType);
      flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);

      const message: ScreenSharingMessage = {
        type: ScreenSharingMessageType.HeartbeatRequestType,
        flags: [ScreenSharingMessageFlag.Broadcast],
        data: new Uint8Array([0x01]),
        detail: null,
      };

      subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
    });

    describe('StreamEnd', () => {
      describe('null', () => {
        it('is deserialize', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );

          typeSerialization.deserialize(Arg.any()).returns(ScreenSharingMessageType.StreamEnd);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(null));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.StreamEnd,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: null,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });

      describe('non-null', () => {
        it('is deserialized', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );
          const detail = Substitute.for<ScreenMessageDetail>();

          typeSerialization.deserialize(Arg.any()).returns(ScreenSharingMessageType.StreamEnd);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(detail));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.StreamEnd,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: detail,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });
    });

    describe('PresenterSwitch', () => {
      describe('null', () => {
        it('is deserialized', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );

          typeSerialization
            .deserialize(Arg.any())
            .returns(ScreenSharingMessageType.PresenterSwitch);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(null));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.PresenterSwitch,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: null,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });

      describe('non-null', () => {
        it('is deserialized', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );
          const detail = Substitute.for<ScreenMessageDetail>();

          typeSerialization
            .deserialize(Arg.any())
            .returns(ScreenSharingMessageType.PresenterSwitch);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(detail));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.PresenterSwitch,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: detail,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });
    });

    describe('StreamStart', () => {
      describe('null', () => {
        it('is deserialized', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );

          typeSerialization.deserialize(Arg.any()).returns(ScreenSharingMessageType.StreamStart);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(null));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.StreamStart,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: null,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });

      describe('non-null', () => {
        it('is deserialized', () => {
          const typeSerialization = Substitute.for<ScreenSharingMessageTypeSerialization>();
          const flagSerialization = Substitute.for<ScreenSharingMessageFlagSerialization>();
          const signalingSerialization = Substitute.for<ScreenMessageDetailSerialization>();
          const subject = new ScreenSharingMessageSerializer(
            typeSerialization,
            flagSerialization,
            signalingSerialization
          );
          const detail = Substitute.for<ScreenMessageDetail>();

          typeSerialization.deserialize(Arg.any()).returns(ScreenSharingMessageType.StreamStart);
          flagSerialization.deserialize(Arg.any()).returns([ScreenSharingMessageFlag.Broadcast]);
          signalingSerialization.deserialize(Arg.all()).returns(Maybe.of(detail));

          const message: ScreenSharingMessage = {
            type: ScreenSharingMessageType.StreamStart,
            flags: [ScreenSharingMessageFlag.Broadcast],
            data: new Uint8Array([0x01]),
            detail: detail,
          };

          subject.deserialize(new Uint8Array([0x01, 0x01, 0x0, 0x0, 0x01])).should.eql(message);
        });
      });
    });
  });
});
