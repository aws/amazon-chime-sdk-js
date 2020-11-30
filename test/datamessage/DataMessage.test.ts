// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import DataMessage from '../../src/datamessage/DataMessage';

describe('DataMessage', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  const timestampMs = 10000;
  const topic = 'topic';
  const senderAttendeeId = 'senderId';
  const senderExternalUserId = 'senderExternalId';
  const dataJson = { subject: 'test', message: 'test message' };
  const dataString = JSON.stringify(dataJson);
  const dataBytes = new TextEncoder().encode(dataString);

  describe('can be constructed', () => {
    it('with no throttled', () => {
      const message = new DataMessage(
        timestampMs,
        topic,
        dataBytes,
        senderAttendeeId,
        senderExternalUserId
      );
      expect(message.timestampMs).to.eq(timestampMs);
      expect(message.topic).to.eq(topic);
      expect(message.senderAttendeeId).to.eq(senderAttendeeId);
      expect(message.senderExternalUserId).to.eq(senderExternalUserId);
      expect(message.throttled).to.be.false;
    });

    it('with throttled', () => {
      const message = new DataMessage(
        timestampMs,
        topic,
        dataBytes,
        senderAttendeeId,
        senderExternalUserId,
        true
      );
      expect(message.timestampMs).to.eq(timestampMs);
      expect(message.topic).to.eq(topic);
      expect(message.senderAttendeeId).to.eq(senderAttendeeId);
      expect(message.senderExternalUserId).to.eq(senderExternalUserId);
      expect(message.throttled).to.be.true;
    });
  });

  describe('data convert helper', () => {
    const message = new DataMessage(
      timestampMs,
      topic,
      dataBytes,
      senderAttendeeId,
      senderExternalUserId
    );

    it('to text', () => {
      expect(message.text()).to.eq(dataString);
    });

    it('to JSON', () => {
      expect(message.json()).to.eql(dataJson);
    });
  });
});
