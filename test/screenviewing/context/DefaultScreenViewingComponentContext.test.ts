// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Substitute } from '@fluffy-spoon/substitute';
import * as chai from 'chai';

import DefaultScreenViewingComponentContext from '../../../src/screenviewing/context/DefaultScreenViewingComponentContext';
import ScreenViewingComponentContext from '../../../src/screenviewing/context/ScreenViewingComponentContext';
import ScreenObserver from '../../../src/screenviewing/observer/ScreenObserver';

describe('DefaultScreenViewingComponentContext', () => {
  const assert: Chai.AssertStatic = chai.assert;

  describe('constructor', () => {
    it('creates all objects without providers', () => {
      const componentContext: ScreenViewingComponentContext = new DefaultScreenViewingComponentContext(
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for()
      );
      assert.exists(componentContext.deltaRenderer);
      assert.exists(componentContext.deltaSource);
      assert.exists(componentContext.jpegDecoderController);
      assert.exists(componentContext.messageDispatcher);
      assert.exists(componentContext.messageHandler);
      assert.exists(componentContext.viewingSession);
      assert.exists(componentContext.viewer);
    });

    it('creates all objects with providers', () => {
      const componentContext: ScreenViewingComponentContext = new DefaultScreenViewingComponentContext(
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        {
          deltaRendererProvider: () => Substitute.for(),
          deltaSourceProvider: () => Substitute.for(),
          jpegDecoderControllerProvider: () => Substitute.for(),
          messageDispatcherProvider: () => Substitute.for(),
          messageHandlerProvider: () => Substitute.for(),
          sessionProvider: () => Substitute.for(),
          signalingSession: () => Substitute.for(),
          viewerProvider: () => Substitute.for(),
        }
      );
      assert.exists(componentContext.deltaRenderer);
      assert.exists(componentContext.deltaSource);
      assert.exists(componentContext.jpegDecoderController);
      assert.exists(componentContext.messageDispatcher);
      assert.exists(componentContext.messageHandler);
      assert.exists(componentContext.viewingSession);
      assert.exists(componentContext.viewer);
    });

    it('registers signaling session observer', (done: MochaDone) => {
      const componentContext: ScreenViewingComponentContext = new DefaultScreenViewingComponentContext(
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        Substitute.for(),
        {
          deltaRendererProvider: () => ({
            ...Substitute.for(),
            hideViewport(): void {},
            revealViewport(): void {
              done();
            },
          }),
          deltaSourceProvider: () => Substitute.for(),
          jpegDecoderControllerProvider: () => Substitute.for(),
          messageDispatcherProvider: () => Substitute.for(),
          messageHandlerProvider: () => Substitute.for(),
          sessionProvider: () => Substitute.for(),
          signalingSession: () => ({
            ...Substitute.for(),
            registerObserver(observer: ScreenObserver) {
              observer.streamDidStart({});
              observer.streamDidStop({});
            },
          }),
          viewerProvider: () => Substitute.for(),
        }
      );
      assert.exists(componentContext.deltaRenderer);
      assert.exists(componentContext.deltaSource);
      assert.exists(componentContext.jpegDecoderController);
      assert.exists(componentContext.messageDispatcher);
      assert.exists(componentContext.messageHandler);
      assert.exists(componentContext.viewingSession);
      assert.exists(componentContext.viewer);
    });
  });
});
