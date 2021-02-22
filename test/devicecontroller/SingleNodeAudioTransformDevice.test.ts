// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { isAudioTransformDevice } from '../../src/devicecontroller/AudioTransformDevice';
import SingleNodeAudioTransformDevice from '../../src/devicecontroller/SingleNodeAudioTransformDevice';
import DOMMockBehavior from '../dommock/DOMMockBehavior';
import DOMMockBuilder from '../dommock/DOMMockBuilder';

chai.use(chaiAsPromised);
chai.should();

class FailingAudioTransformDevice extends SingleNodeAudioTransformDevice<GainNode> {
  createSingleAudioNode(_context: AudioContext): Promise<GainNode> {
    throw new Error('oh no');
  }
}

class GainAudioTransformDevice extends SingleNodeAudioTransformDevice<GainNode> {
  async createSingleAudioNode(context: AudioContext): Promise<GainNode> {
    return context.createGain();
  }
}

describe('SingleNodeAudioTransformDevice', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  let dom: DOMMockBuilder;

  before(() => {
    dom = new DOMMockBuilder(new DOMMockBehavior());
  });

  after(() => {
    dom.cleanup();
  });

  describe('isAudioTransformDevice', () => {
    it('matches gain', () => {
      expect(isAudioTransformDevice(new GainAudioTransformDevice('default'))).to.be.true;
    });

    it('matches failing', () => {
      expect(isAudioTransformDevice(new FailingAudioTransformDevice('default'))).to.be.true;
    });
  });

  describe('stacks appropriately', () => {
    it('returns nodes', async () => {
      const d = new GainAudioTransformDevice('default');
      const { start, end } = await d.createAudioNode(new AudioContext());
      expect(start).to.eq(end);

      // You can call it again.
      await d.createAudioNode(new AudioContext());
    });

    it('fails', async () => {
      const f = new FailingAudioTransformDevice('default');
      expect(f.createAudioNode(new AudioContext())).to.eventually.be.rejectedWith('oh no');
    });

    it('does not touch inner', async () => {
      const d = new GainAudioTransformDevice('default');
      expect(await d.intrinsicDevice()).to.equal('default');

      const constraint = { sampleRate: 44100 };
      const c = new GainAudioTransformDevice(constraint);
      expect(await c.intrinsicDevice()).to.eq(constraint);
    });

    it('has mute and stop', async () => {
      const d1 = new GainAudioTransformDevice('default');
      await d1.mute(true); // Does nothing.
      await d1.stop();

      const d2 = new GainAudioTransformDevice('default');
      await d2.createAudioNode(new AudioContext());
      await d2.stop();
    });
  });
});
