// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import ContentShareConstants from '../../src/contentsharecontroller/ContentShareConstants';
import DefaultModality from '../../src/modality/DefaultModality';

describe('DefaultModality', () => {
  const expect: Chai.ExpectStatic = chai.expect;

  describe('base', () => {
    it('returns expected values', () => {
      expect(new DefaultModality('').base()).to.eq('');
      expect(new DefaultModality('base').base()).to.eq('base');
      expect(new DefaultModality('base#modality').base()).to.eq('base');
      expect(new DefaultModality('base#modality#bad').base()).to.eq('base');
    });
  });

  describe('modality', () => {
    it('returns expected values', () => {
      expect(new DefaultModality('').modality()).to.eq('');
      expect(new DefaultModality('base').modality()).to.eq('');
      expect(new DefaultModality('base#modality').modality()).to.eq('modality');
      expect(new DefaultModality('base#modality#bad').modality()).to.eq('');
    });
  });

  describe('hasModality', () => {
    it('returns expected values', () => {
      expect(new DefaultModality('').hasModality('')).to.eq(false);
      expect(new DefaultModality('').hasModality('modality')).to.eq(false);
      expect(new DefaultModality('').hasModality('modality#bad')).to.eq(false);
      expect(new DefaultModality('base').hasModality('')).to.eq(false);
      expect(new DefaultModality('base').hasModality('modality')).to.eq(false);
      expect(new DefaultModality('base').hasModality('modality#bad')).to.eq(false);
      expect(new DefaultModality('base#modality').hasModality('')).to.eq(false);
      expect(new DefaultModality('base#modality').hasModality('modality')).to.eq(true);
      expect(new DefaultModality('base#modality').hasModality('modality#bad')).to.eq(false);
      expect(new DefaultModality('base#modality#bad').hasModality('')).to.eq(false);
      expect(new DefaultModality('base#modality#bad').hasModality('modality')).to.eq(false);
      expect(new DefaultModality('base#modality#bad').hasModality('modality#bad')).to.eq(false);
    });
  });

  describe('withModality', () => {
    it('returns expected values', () => {
      expect(new DefaultModality('').withModality('').id()).to.eq('');
      expect(new DefaultModality('').withModality('modality').id()).to.eq('');
      expect(new DefaultModality('').withModality('modality#bad').id()).to.eq('');
      expect(new DefaultModality('base').withModality('').id()).to.eq('base');
      expect(new DefaultModality('base').withModality('modality').id()).to.eq('base#modality');
      expect(new DefaultModality('base').withModality('modality#bad').id()).to.eq('base');
      expect(new DefaultModality('base#other').withModality('').id()).to.eq('base');
      expect(new DefaultModality('base#other').withModality('modality').id()).to.eq(
        'base#modality'
      );
      expect(new DefaultModality('base#other').withModality('modality#bad').id()).to.eq('base');
      expect(new DefaultModality('base#other#bad').withModality('').id()).to.eq('base');
      expect(new DefaultModality('base#other#bad').withModality('modality').id()).to.eq(
        'base#modality'
      );
      expect(new DefaultModality('base#other#bad').withModality('modality#bad').id()).to.eq('base');
    });
  });

  describe('content', () => {
    const modality = ContentShareConstants.Modality;
    it('returns expected values', () => {
      expect(new DefaultModality('base' + modality).base()).to.eq('base');
      expect(new DefaultModality('base' + modality).modality()).to.eq(
        DefaultModality.MODALITY_CONTENT
      );
      expect(
        new DefaultModality('base' + modality).hasModality(DefaultModality.MODALITY_CONTENT)
      ).to.eq(true);
      expect(new DefaultModality('base').withModality(DefaultModality.MODALITY_CONTENT).id()).to.eq(
        'base' + modality
      );
    });
  });
});
