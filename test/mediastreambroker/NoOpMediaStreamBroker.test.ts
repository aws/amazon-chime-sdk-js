// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import NoOpMediaStreamBroker from '../../src/mediastreambroker/NoOpMediaStreamBroker';

describe('NoOpMediaStreamBroker', () => {
  const assert: Chai.AssertStatic = chai.assert;

  describe('acquireAudioInputStream', () => {
    it('can fail to acquire an audio input device', async () => {
      await new NoOpMediaStreamBroker()
        .acquireAudioInputStream()
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('releaseAudioInputStream', () => {
    it('can be called', async () => {
      new NoOpMediaStreamBroker().releaseMediaStream(Substitute.for<MediaStream>());
    });
  });

  describe('acquireVideoInputStream', () => {
    it('can fail to acquire an video input device', async () => {
      await new NoOpMediaStreamBroker()
        .acquireVideoInputStream()
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('releaseVideoInputStream', () => {
    it('can be called', async () => {
      new NoOpMediaStreamBroker().releaseMediaStream(Substitute.for<MediaStream>());
    });
  });

  describe('acquireDisplayInputDevice', () => {
    it('can fail to acquire an display input device', async () => {
      await new NoOpMediaStreamBroker()
        .acquireDisplayInputStream(Substitute.for<MediaStreamConstraints>())
        .then(() => {
          assert.fail();
        })
        .catch(() => {});
    });
  });

  describe('releaseDisplayInputStream', () => {
    it('can be called', () => {
      new NoOpMediaStreamBroker().releaseMediaStream(Substitute.for<MediaStream>());
    });
  });
});
