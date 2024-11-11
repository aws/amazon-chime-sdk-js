// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as sinon from 'sinon';

import {
  getFormattedOffset,
  getRandomValues,
  iterateEvery,
  SuppressedError,
  toLowerCasePropertyNames,
  wait,
} from '../../src/utils/Utils';

describe('Utils', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('wait', () => {
    it('atleast waits for the specified delay in milliseconds', async () => {
      const startTime = new Date().getTime();
      const delay = 500;
      await wait(delay);
      const endTime = new Date().getTime();

      // Timing is imprecise. Allow 2 milliseconds of fudge. I have seen this run in 499.
      expect(endTime - startTime).to.gte(delay - 2);
    });
  });

  describe('toLowerCasePropertyNames', () => {
    it('supports null as an input', () => {
      const input: null = null;
      const output = toLowerCasePropertyNames(input);
      expect(output).to.eq(null);
    });

    it('supports non object data as an input', () => {
      const input = 1;
      const output = toLowerCasePropertyNames(input);
      expect(output).to.eq(1);
    });

    it('supports an empty object as an input', () => {
      const input = {};
      const output = toLowerCasePropertyNames(input);
      expect(output).to.be.empty;
    });

    it('supports an undefined object as an input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any = undefined;
      const output = toLowerCasePropertyNames(input);
      expect(output).to.eq(undefined);
    });

    it('converts upper case keys to lower case', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any = {
        MeetingId: 'meeting-id',
        MediaPlacement: {
          AudioHostUrl: 'audio-host-url',
          ScreenDataUrl: 'screen-data-url',
          ScreenSharingUrl: 'screen-sharing-url',
          ScreenViewingUrl: 'screen-viewing-url',
          SignalingUrl: 'signaling-url',
          TurnControlUrl: 'turn-control-url',
        },
        Http: [[]],
      };

      const output = toLowerCasePropertyNames(input);
      const meetingIdOutput = Object.keys(output);
      const mediaPlacementOutput = Object.keys(output.mediaplacement);

      expect(meetingIdOutput[0]).to.eq('meetingid');
      expect(mediaPlacementOutput[0]).to.eq('audiohosturl');
      expect(mediaPlacementOutput[1]).to.eq('screendataurl');
      expect(mediaPlacementOutput[2]).to.eq('screensharingurl');
      expect(mediaPlacementOutput[3]).to.eq('screenviewingurl');
      expect(mediaPlacementOutput[4]).to.eq('signalingurl');
      expect(mediaPlacementOutput[5]).to.eq('turncontrolurl');
    });

    it('converts array of keys to lower case', () => {
      const input = {
        AttendeeId: 'Attendee-Id',
        JoinToken: 'Join-Token',
        MetaData: [{ HTTPMetadata1: 'Data 1' }, { HTTPMetadata2: 'Data 2' }],
      };

      const output = toLowerCasePropertyNames(input);
      const firstKey = Object.keys(output.metadata[0]);
      const secondKey = Object.keys(output.metadata[1]);

      expect(firstKey[0]).to.eq('httpmetadata1');
      expect(secondKey[0]).to.eq('httpmetadata2');
    });

    it('does not convert any values to lowercase', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const input: any = {
        MeetingId: 'meeting-id',
        MediaPlacement: {
          AudioHostUrl: 'audio-host-url',
          ScreenDataUrl: 'screen-data-url',
          ScreenSharingUrl: 'screen-sharing-url',
          ScreenViewingUrl: 'screen-viewing-url',
          SignalingUrl: 'signaling-url',
          TurnControlUrl: 'turn-control-url',
        },
        MetaData: ['HTTPMetadata1', 'HTTPMetadata2'],
        Http: [[]],
      };

      const output = toLowerCasePropertyNames(input);

      expect(output.meetingid).to.eq('meeting-id');
      expect(output.mediaplacement.audiohosturl).to.eq('audio-host-url');
      expect(output.mediaplacement.screendataurl).to.eq('screen-data-url');
      expect(output.mediaplacement.screensharingurl).to.eq('screen-sharing-url');
      expect(output.mediaplacement.screenviewingurl).to.eq('screen-viewing-url');
      expect(output.mediaplacement.signalingurl).to.eq('signaling-url');
      expect(output.mediaplacement.turncontrolurl).to.eq('turn-control-url');
      expect(output.metadata[0]).to.eq('HTTPMetadata1');
      expect(output.metadata[1]).to.eq('HTTPMetadata2');
    });

    it('gets correct formatted UTC offset from integer UTC offset', () => {
      expect(getFormattedOffset(180)).to.eq('-03:00');
      expect(getFormattedOffset(-330)).to.eq('+05:30');
      expect(getFormattedOffset(420)).to.eq('-07:00');
      expect(getFormattedOffset(-720)).to.eq('+12:00');
      expect(getFormattedOffset(-840)).to.eq('+14:00');
      expect(getFormattedOffset(0)).to.eq('+00:00');
    });
  });

  describe('getRandomValues', () => {
    it('should handle catch block for Node environment', () => {
      const buffer = new Uint32Array(1);
      const dataViewSpy = sinon.spy(DataView.prototype, 'setUint32');
      getRandomValues(buffer);
      expect(dataViewSpy.calledOnce).to.be.true;
      dataViewSpy.restore();
    });
  });

  describe('SuppressedError', () => {
    it('should properly construct a SuppressedError', () => {
      const err = new Error('bad');

      // string message
      const a = new SuppressedError(err, undefined, 'message');
      expect(a.message).to.eq('message');
      expect(a.suppressed).to.be.undefined;

      // value-as-error stringified
      const b = new SuppressedError(1, a);
      expect(b.message).to.eq('1');
      expect(b.suppressed).to.eq(a);

      // error.message
      const c = new SuppressedError(err);
      expect(c.message).to.eq('bad');
    });

    it('should suppress anything', () => {
      expect(() => {
        // b/c JS can throw anything, SuppressedError has to handle anything as an error
        const a = new SuppressedError(undefined, undefined, undefined);
        const values = [
          'string',
          1,
          {},
          [],
          new Date(),
          new Map(),
          new Set(),
          globalThis,
          null,
          Symbol('error'),
        ];
        values.forEach((value, i) => {
          new SuppressedError(value, a, i.toString());
        });
      }).not.to.throw;
    });
  });

  describe('iterateEvery', () => {
    it('should iterate over every value even if some callbacks throw and collect all errors into a single SuppressedError', () => {
      const values = [1, 2, 3, 4, 5, 6];
      const evens = values.filter(a => a % 2 === 0);
      const throwEven = sinon.spy((a: number) => {
        if (a % 2 === 0) throw new Error(`${a}`);
      });
      let error = undefined;
      try {
        iterateEvery(values, throwEven);
      } catch (err) {
        error = err;
      }
      expect(throwEven.callCount).to.eq(values.length);
      expect(throwEven.exceptions.filter(e => !!e).length).to.eq(evens.length);
      expect(error).to.be.instanceof(SuppressedError);

      const messages: string[] = [];
      let se = error instanceof SuppressedError ? error : undefined;
      while (se) {
        messages.push(se.message);
        se = se.suppressed;
      }
      expect(messages).to.eql(evens.map(n => n.toString()).reverse());
    });

    it('should not throw an error for null or undefined', () => {
      expect(() => iterateEvery(null, () => {})).not.to.throw;
      expect(() => iterateEvery(undefined, () => {})).not.to.throw;
    });

    it('should throw an error when the data is not iterable', () => {
      // @ts-expect-error 3 is not iterable
      expect(() => iterateEvery(3, () => {})).to.throw;
    });
  });
});
