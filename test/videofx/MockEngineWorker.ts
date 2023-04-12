// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import * as loader from '../../libs/voicefocus/loader';
import { SEGMENTATION_MODEL, WORKER_MSG } from '../../src/videofx/VideoFxConstants';
/**
 * This is a mock for our engine worker which we will used to
 * test failed/succesful asset loading into the [[VideoFxProcessor]]
 * unit tests
 */
export default class MockEngineWorker {
  private commonsSandbox: sinon.SinonSandbox;

  // Sets the sandbox to the one being used in unit tests
  setSandbox(sandbox: sinon.SinonSandbox): void {
    this.commonsSandbox = sandbox;
  }

  // Force the internal processor to load all assets successfully
  stubAllAssetsLoad = (): Worker => {
    return this.configureWorker({
      buildEnginePayload: SEGMENTATION_MODEL.LOAD_SUCCESS,
      predictPayload: new ImageData(
        SEGMENTATION_MODEL.WIDTH_IN_PIXELS,
        SEGMENTATION_MODEL.HEIGHT_IN_PIXELS
      ),
    });
  };

  // Force the internal processor to load all assets successfully but fail in prediction
  stubAllAssetsLoadWithFailedPredict = (): Worker => {
    return this.configureWorker({
      buildEnginePayload: SEGMENTATION_MODEL.LOAD_SUCCESS,
      predictPayload: null,
    });
  };

  // Force the internal processor call to load the worker to fail
  stubFailedWorker = (): void => {
    const error: Error = new Error(`Failed worker load`);
    this.commonsSandbox.stub(loader, 'loadWorker').throws(error);
  };

  // Force the internal processor call to instantiate the engine to fail
  stubFailedBuildEngine = (): Worker => {
    return this.configureWorker({
      buildEnginePayload: 1,
    });
  };

  stubSendInvalidMessage = (): Worker => {
    return this.configureWorker({
      buildEnginePayload: SEGMENTATION_MODEL.LOAD_SUCCESS,
      callInvalidMessage: true,
    });
  };

  // Initialize the worker so that it emulates the interactions defined
  // by the conditions supplied to the options parameter
  private configureWorker = (
    // sandbox : sinon.SinonSandbox,
    options: {
      buildEnginePayload?: number;
      predictPayload?: ImageData;
      callInvalidMessage?: boolean;
    } = {
      buildEnginePayload: 1,
      predictPayload: new ImageData(
        SEGMENTATION_MODEL.WIDTH_IN_PIXELS,
        SEGMENTATION_MODEL.HEIGHT_IN_PIXELS
      ),
      callInvalidMessage: false,
    }
  ): Worker => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventListener: (evt: MessageEvent<any>) => any = () => {
      console.error('eventListener is not set');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handlePostMessage(evt: any): void {
      switch (evt.msg) {
        case WORKER_MSG.BUILD_ENGINE_REQUEST:
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: WORKER_MSG.BUILD_ENGINE_RESPONSE,
                payload: options.buildEnginePayload,
              },
            })
          );
          // send an invalid event to listener after the processor is fully inited in order to test an invalid message
          // being sent back from the worker.
          if (options.callInvalidMessage) {
            eventListener(
              new MessageEvent('message', {
                data: {
                  msg: 'invalidMessage',
                },
              })
            );
          }
          break;
        case WORKER_MSG.PERFORM_SEGMENTATION_REQUEST:
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: WORKER_MSG.PERFORM_SEGMENTATION_RESPONSE,
                payload: {
                  output: options.predictPayload,
                },
              },
            })
          );
          break;
        case WORKER_MSG.PERFORM_SEGMENTATION_SAB_REQUEST:
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: WORKER_MSG.PERFORM_SEGMENTATION_SAB_RESPONSE,
              },
            })
          );
          break;
        case WORKER_MSG.DESTROY_ASSETS_REQUEST:
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: WORKER_MSG.DESTROY_ASSETS_RESPONSE,
              },
            })
          );
          break;
      }
    }

    // Create the mock worker
    const workerObj = {
      postMessage: handlePostMessage,
      onmessage: () => {},
      onmessageerror: () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addEventListener: (type: string, listener: (evt: MessageEvent<any>) => any) => {
        eventListener = listener;
      },
      removeEventListener: () => {},
      terminate: () => {},
      dispatchEvent: () => true,
      onerror: () => {},
    };
    const workerPromise = new Promise<Worker>(resolve => {
      resolve(workerObj);
    });

    // Stub the call to load the worker so the worker created above gets used
    this.commonsSandbox.stub(loader, 'loadWorker').returns(workerPromise);
    return workerObj;
  };
}
