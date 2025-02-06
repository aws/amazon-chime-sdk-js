// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import AudioVideoControllerState from '../../src/audiovideocontroller/AudioVideoControllerState';
import { audioVideoEventAttributesFromState } from '../../src/eventcontroller/AudioVideoEventAttributes';

describe('audioVideoEventAttributesFromState', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  it('extracts attributes correctly when all values are set', () => {
    const mockState = new AudioVideoControllerState();
    mockState.startTimeMs = Date.now() - 5000;
    mockState.signalingOpenDurationMs = 100;
    mockState.iceGatheringDurationMs = 200;
    mockState.attendeePresenceDurationMs = 300;
    mockState.meetingStartDurationMs = 400;
    mockState.maxVideoTileCount = 5;
    mockState.poorConnectionCount = 2;

    const attributes = audioVideoEventAttributesFromState(mockState);

    expect(attributes.meetingDurationMs).to.be.closeTo(5000, 50);
    expect(attributes.signalingOpenDurationMs).to.equal(100);
    expect(attributes.iceGatheringDurationMs).to.equal(200);
    expect(attributes.attendeePresenceDurationMs).to.equal(300);
    expect(attributes.meetingStartDurationMs).to.equal(400);
    expect(attributes.maxVideoTileCount).to.equal(5);
    expect(attributes.poorConnectionCount).to.equal(2);
  });

  it('does not set properties when they are null', () => {
    const mockState = new AudioVideoControllerState();
    mockState.startTimeMs = null;
    mockState.signalingOpenDurationMs = null;
    mockState.iceGatheringDurationMs = null;
    mockState.attendeePresenceDurationMs = null;
    mockState.meetingStartDurationMs = null;
    mockState.maxVideoTileCount = undefined;
    mockState.poorConnectionCount = undefined;

    const attributes = audioVideoEventAttributesFromState(mockState);

    expect(attributes).to.not.have.property('meetingDurationMs');
    expect(attributes).to.not.have.property('signalingOpenDurationMs');
    expect(attributes).to.not.have.property('iceGatheringDurationMs');
    expect(attributes).to.not.have.property('attendeePresenceDurationMs');
    expect(attributes).to.not.have.property('meetingStartDurationMs');
    expect(attributes).to.not.have.property('maxVideoTileCount');
    expect(attributes).to.not.have.property('poorConnectionCount');
  });
});
