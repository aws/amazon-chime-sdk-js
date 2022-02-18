// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import VERSION from '../../src/versioning/version';
import Versioning from '../../src/versioning/Versioning';

// Matches short Git commit hashes: abcdefff.
// This depends on a configuration option and collisions, so accept a range.
const SHORT_SHA_RE = /^[a-f0-9]{5,40}$/;

// Matches:
// * Released versions:                       1.19.14
// * Pre-released versions:                   1.19.14-alpha.0
// * Unreleased versions:                     1.19.14+2.abcdefff
// * Unreleased versions with local changes:  1.19.14+2.abcdefff.dirty.
const VERSION_CORE = /^[1-9]+\.[0-9]+\.[0-9]+/;
const PRE_RELEASE = /(?:-([a-zA-Z]+(\.[0-9])*))/;
const BUILD = /(?:\+[1-9][0-9]*\.g[a-f0-9]{5,40}(?:\.dirty)?)/;
const VERSION_RE = new RegExp(
  VERSION_CORE.source +
    '(' +
    PRE_RELEASE.source +
    '|' +
    BUILD.source +
    '|' +
    PRE_RELEASE.source +
    BUILD.source +
    ')?$'
);

describe('Versioning', () => {
  describe('#buildSHA', () => {
    it('is a commit hash', () => {
      expect(Versioning.buildSHA).to.match(SHORT_SHA_RE);
    });
  });

  const semverString = VERSION.semverString;

  afterEach(() => {
    VERSION.semverString = semverString;
  });

  describe('#sdkVersion', () => {
    it('is semver', () => {
      expect(Versioning.sdkVersion).to.match(VERSION_RE);
    });
  });

  describe('#sdkVersionSemVer', () => {
    it('matches major minor patch', () => {
      VERSION.semverString = '1.22.33';
      expect(Versioning.sdkVersionSemVer.major).to.be.eq('1');
      expect(Versioning.sdkVersionSemVer.minor).to.be.eq('22');
      expect(Versioning.sdkVersionSemVer.patch).to.be.eq('33');
      expect(Versioning.sdkVersionSemVer.preRelease).to.be.undefined;
    });

    it('matches major minor', () => {
      VERSION.semverString = '1.22';
      expect(Versioning.sdkVersionSemVer.major).to.be.eq('1');
      expect(Versioning.sdkVersionSemVer.minor).to.be.eq('22');
      expect(Versioning.sdkVersionSemVer.patch).to.be.undefined;
      expect(Versioning.sdkVersionSemVer.preRelease).to.be.undefined;
    });

    it('is undefined when empty', () => {
      VERSION.semverString = '';
      expect(Versioning.sdkVersionSemVer.major).to.be.undefined;
      expect(Versioning.sdkVersionSemVer.minor).to.be.undefined;
      expect(Versioning.sdkVersionSemVer.patch).to.be.undefined;
      expect(Versioning.sdkVersionSemVer.preRelease).to.be.undefined;
    });

    it('does not include build', () => {
      VERSION.semverString = '1.19.14+2.abcdefff.dirty';
      expect(Versioning.sdkVersionSemVer.major).to.be.eq('1');
      expect(Versioning.sdkVersionSemVer.minor).to.be.eq('19');
      expect(Versioning.sdkVersionSemVer.patch).to.be.eq('14');
      expect(Versioning.sdkVersionSemVer.preRelease).to.be.undefined;
    });

    it('matches major minor patch pre-release', () => {
      VERSION.semverString = '3.30.11-beta.5';
      expect(Versioning.sdkVersionSemVer.major).to.be.eq('3');
      expect(Versioning.sdkVersionSemVer.minor).to.be.eq('30');
      expect(Versioning.sdkVersionSemVer.patch).to.be.eq('11');
      expect(Versioning.sdkVersionSemVer.preRelease).to.be.eq('beta.5');
    });
  });

  describe('the testing version regex', () => {
    it('matches a version', () => {
      expect('1.0.0').to.match(VERSION_RE);
    });
    it('matches a pre-release version', () => {
      expect('1.0.0-alpha.2').to.match(VERSION_RE);
    });
    it('matches a version with changes', () => {
      expect('1.0.0+1.g2abcde').to.match(VERSION_RE);
    });
    it('matches a version with changes and dirty', () => {
      expect('1.0.0+2.g1abcde.dirty').to.match(VERSION_RE);
    });
    it('matches a pre-release version with changes', () => {
      expect('1.0.0-alpha.2+1.g2abcde').to.match(VERSION_RE);
    });
    it('does not match others', () => {
      // Not a SHA1.
      expect('1.0.0+1.gzbcde').to.not.match(VERSION_RE);

      // Doesn't have 'g' for git.
      expect('1.0.0+1.mabcde').to.not.match(VERSION_RE);

      // Missing distance.
      expect('1.0.0.gabcde-dirty').to.not.match(VERSION_RE);

      // Wrong distance.
      expect('1.0.0+0.gabcdef').to.not.match(VERSION_RE);
      expect('1.0.0+3.gabcde-dirt').to.not.match(VERSION_RE);
      expect('1.0.0+3.gabcde.dirt').to.not.match(VERSION_RE);
      expect('1.0.0+4.gabcd').to.not.match(VERSION_RE);

      // Bad versions.
      expect('0.0.0').to.not.match(VERSION_RE);
      expect('a.0.0').to.not.match(VERSION_RE);
      expect('1.b.0').to.not.match(VERSION_RE);

      // This is expected to fail, but it would have worked in the past.
      expect('0.1.0').to.not.match(VERSION_RE);
    });
  });

  describe('the testing SHA regex', () => {
    it('matches short', () => {
      expect('abcde').to.match(SHORT_SHA_RE);
    });
    it('matches typical', () => {
      expect('abcde123').to.match(SHORT_SHA_RE);
    });
    it('matches long', () => {
      expect('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').to.match(SHORT_SHA_RE);
    });
    it('does not match invalid', () => {
      expect('aaaagh').to.not.match(SHORT_SHA_RE);
    });
    it('does not match too short', () => {
      expect('aaaa').to.not.match(SHORT_SHA_RE);
    });
    it('does not match too long', () => {
      expect('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee').to.not.match(SHORT_SHA_RE);
    });
  });
});
