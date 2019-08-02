// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ScreenSharingMessageFlag from '../../src/screensharingmessage/ScreenSharingMessageFlag';
import ScreenSharingMessageFlagSerializer from '../../src/screensharingmessageserialization/ScreenSharingMessageFlagSerializer';

describe('ScreenSharingMessageFlagSerializer', () => {
  const subject = new ScreenSharingMessageFlagSerializer();

  before(() => {
    chai.should();
  });

  describe('#serialize', () => {
    const expected = [
      [[], 0],
      [[ScreenSharingMessageFlag.Broadcast], 0x01],
      [[ScreenSharingMessageFlag.Local], 0x02],
      [[ScreenSharingMessageFlag.Synthesized], 0x04],
      [[ScreenSharingMessageFlag.Unicast], 0x08],
    ];

    for (const entry of expected) {
      it('is serialized', () => {
        subject.serialize(entry[0] as ScreenSharingMessageFlag[]).should.equal(entry[1]);
      });
    }
  });

  describe('#deserialize', () => {
    const expected = [
      [0x01, [ScreenSharingMessageFlag.Broadcast]],
      [0x02, [ScreenSharingMessageFlag.Local]],
      [0x04, [ScreenSharingMessageFlag.Synthesized]],
      [0x08, [ScreenSharingMessageFlag.Unicast]],
    ];

    for (const entry of expected) {
      it('is deserialized', () => {
        subject.deserialize(entry[0] as number).should.eql(entry[1]);
      });
    }
  });
});
