// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as chai from 'chai';

import NoOpLogger from '../../src/logger/NoOpLogger';
import DefaultSessionStateController from '../../src/sessionstatecontroller/DefaultSessionStateController';
import SessionStateController from '../../src/sessionstatecontroller/SessionStateController';
import { SessionStateControllerAction } from '../../src/sessionstatecontroller/SessionStateControllerAction';
import { SessionStateControllerState } from '../../src/sessionstatecontroller/SessionStateControllerState';
import { SessionStateControllerTransitionResult } from '../../src/sessionstatecontroller/SessionStateControllerTransitionResult';

describe('DefaultSessionStateController', () => {
  const expect: Chai.ExpectStatic = chai.expect;
  const logger: NoOpLogger = new NoOpLogger();

  describe('construction', () => {
    it('can be constructed', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller).to.exist;
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
    });
  });

  describe('perform', () => {
    it('can connect and disconnect', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      let counter = 0;

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);

      expect(
        controller.perform(SessionStateControllerAction.Update, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Updating);

      expect(
        controller.perform(SessionStateControllerAction.FinishUpdating, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);

      expect(
        controller.perform(SessionStateControllerAction.Disconnect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishDisconnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);

      expect(counter).to.equal(6);
    });

    it('can connect and fail during connecting', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      let counter = 0;

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.Fail, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishDisconnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);

      expect(counter).to.equal(3);
    });

    it('can reconnect after connecting', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      let counter = 0;

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);

      expect(
        controller.perform(SessionStateControllerAction.Reconnect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(counter).to.equal(3);
    });

    it('can fail after connecting', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      let counter = 0;

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);

      expect(
        controller.perform(SessionStateControllerAction.Fail, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishDisconnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);

      expect(counter).to.equal(4);
    });

    it('can fail while updating', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      let counter = 0;

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);

      expect(
        controller.perform(SessionStateControllerAction.Update, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Updating);

      expect(
        controller.perform(SessionStateControllerAction.Fail, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishDisconnecting, () => {
          counter += 1;
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);

      expect(counter).to.equal(5);
    });

    it('will roll back to the original state if a transition fails', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          throw new Error('test error');
        })
      ).to.equal(SessionStateControllerTransitionResult.TransitionFailed);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
    });

    it('will defer disconnecting until after finishing connecting', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      const sequence: string[] = [];

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          sequence.push('Connect');
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.Disconnect, () => {
          sequence.push('Disconnect');
        })
      ).to.equal(SessionStateControllerTransitionResult.DeferredTransition);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          sequence.push('FinishConnecting');
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(sequence).to.deep.equal(['Connect', 'FinishConnecting', 'Disconnect']);
    });

    it('will pick the highest priority deferred action', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      const sequence: string[] = [];

      expect(
        controller.perform(SessionStateControllerAction.Connect, () => {
          sequence.push('Connect');
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.Disconnect, () => {
          sequence.push('Disconnect');
        })
      ).to.equal(SessionStateControllerTransitionResult.DeferredTransition);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.Update, () => {
          sequence.push('Update');
        })
      ).to.equal(SessionStateControllerTransitionResult.DeferredTransition);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, () => {
          sequence.push('FinishConnecting');
        })
      ).to.equal(SessionStateControllerTransitionResult.Transitioned);
      expect(controller.state()).to.equal(SessionStateControllerState.Disconnecting);

      expect(sequence).to.deep.equal(['Connect', 'FinishConnecting', 'Disconnect']);
    });

    it('will catch an error during a defer', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      expect(controller.perform(SessionStateControllerAction.Connect, () => {})).to.equal(
        SessionStateControllerTransitionResult.Transitioned
      );
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(
        controller.perform(SessionStateControllerAction.Disconnect, () => {
          throw new Error('test error');
        })
      ).to.equal(SessionStateControllerTransitionResult.DeferredTransition);
      expect(controller.state()).to.equal(SessionStateControllerState.Connecting);

      expect(controller.perform(SessionStateControllerAction.FinishConnecting, () => {})).to.equal(
        SessionStateControllerTransitionResult.Transitioned
      );
      expect(controller.state()).to.equal(SessionStateControllerState.Connected);
    });

    it('will ignore an action for which no transition is available', () => {
      const controller: SessionStateController = new DefaultSessionStateController(logger);
      const unexpected = (): void => {
        throw new Error('unexpected callback');
      };
      expect(controller.state()).to.equal(SessionStateControllerState.NotConnected);
      expect(controller.perform(SessionStateControllerAction.Update, unexpected)).to.equal(
        SessionStateControllerTransitionResult.NoTransitionAvailable
      );
      expect(
        controller.perform(SessionStateControllerAction.FinishConnecting, unexpected)
      ).to.equal(SessionStateControllerTransitionResult.NoTransitionAvailable);
      expect(controller.perform(SessionStateControllerAction.FinishUpdating, unexpected)).to.equal(
        SessionStateControllerTransitionResult.NoTransitionAvailable
      );
      expect(controller.perform(SessionStateControllerAction.Disconnect, unexpected)).to.equal(
        SessionStateControllerTransitionResult.NoTransitionAvailable
      );
      expect(controller.perform(SessionStateControllerAction.Reconnect, unexpected)).to.equal(
        SessionStateControllerTransitionResult.NoTransitionAvailable
      );
      expect(controller.perform(SessionStateControllerAction.Fail, unexpected)).to.equal(
        SessionStateControllerTransitionResult.NoTransitionAvailable
      );
    });
  });
});
