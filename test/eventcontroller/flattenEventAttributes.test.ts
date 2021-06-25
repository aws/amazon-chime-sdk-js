// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import flattenEventAttributes from '../../src/eventcontroller/flattenEventAttributes';

describe('flattenEventAttributes', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('flattens event attributes', () => {
    const attributes = {
      maxVideoTileCount: 0,
      meetingDurationMs: 150209,
      meetingStatus: 'TaskFailed',
      signalingOpenDurationMs: 108,
      iceGatheringDurationMs: 113,
      attendeePresenceDurationMs: 731,
      poorConnectionCount: 1,
      meetingStartDurationMs: 564,
      retryCount: 25,
      meetingErrorMessage: 'Something went wrong',
    };
    const expectedResult = {
      maxVideoTileCount: 0,
      meetingDurationMs: 150209,
      meetingStatus: 'TaskFailed',
      signalingOpenDurationMs: 108,
      iceGatheringDurationMs: 113,
      attendeePresenceDurationMs: 731,
      poorConnectionCount: 1,
      meetingStartDurationMs: 564,
      retryCount: 25,
      meetingErrorMessage: 'Something went wrong',
    };
    const result = flattenEventAttributes(attributes);
    expect(result).to.deep.eq(expectedResult);
  });

  it('throws an error if array type is encountered in attributes', () => {
    const attributes = {
      audioInputErrorMessage: 'Something went wrong',
      meetingHistory: [
        {
          name: 'audioInputFailed',
          timestampMs: Date.now(),
        },
      ],
    };
    expect(() => flattenEventAttributes(attributes)).to.throw(
      'Unhandled type received while flattening attributes.'
    );
  });

  it('throws an error if nested object type is encountered in attributes', () => {
    const attributes = {
      audioInputErrorMessage: 'Something went wrong',
      customAttribute1: {
        test: 'This is a nested object',
      },
      customAttribute2: {
        test: {
          test: 'This is a nested object',
        },
      },
      meetingHistory: [
        {
          name: 'audioInputFailed',
          timestampMs: Date.now(),
        },
      ],
    };
    expect(() => flattenEventAttributes(attributes)).to.throw(
      'Unhandled type received while flattening attributes.'
    );
  });

  it('removes null or undefined attributes', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ice: any = null;
    const attributes = {
      attendeePresenceDurationMs: 15,
      iceGatheringDurationMs: ice,
    };
    const expectedResult = {
      attendeePresenceDurationMs: 15,
    };
    expect(flattenEventAttributes(attributes)).to.deep.eq(expectedResult);
  });

  it('removes empty string attributes', () => {
    const attributes = {
      attendeePresenceDurationMs: 15,
      meetingStatus: '',
    };
    const expectedResult = {
      attendeePresenceDurationMs: 15,
    };
    expect(flattenEventAttributes(attributes)).to.deep.eq(expectedResult);
  });
});
