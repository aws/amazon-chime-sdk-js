// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sinon from 'sinon';

import * as loader from '../../libs/voicefocus/loader';
import * as support from '../../libs/voicefocus/support';

export default class BackgroundFilterCommon {
  private commonsSandbox: sinon.SinonSandbox;

  setSandbox(sandbox: sinon.SinonSandbox): void {
    this.commonsSandbox = sandbox;
  }

  stubInit = (
    // sandbox : sinon.SinonSandbox,
    options: {
      initPayload?: number;
      loadModelPayload?: number;
      predictPayload?: ImageData;
      callInvalidMessage?: boolean;
    } = {
      initPayload: 1,
      loadModelPayload: 1,
      predictPayload: null,
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
        case 'initialize':
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: 'initialize',
                payload: options.initPayload,
              },
            })
          );
          break;
        case 'loadModel':
          eventListener(
            new MessageEvent('message', {
              data: {
                msg: 'loadModel',
                payload: options.loadModelPayload,
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
        case 'predict':
          const predictEvent = new MessageEvent('message', {
            data: {
              msg: 'predict',
              payload: options.predictPayload ?? evt.payload,
            },
          });
          eventListener(predictEvent);
          break;
      }
    }
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

    this.commonsSandbox.stub(loader, 'loadWorker').returns(workerPromise);
    return workerObj;
  };

  stubFineGrainSupport = (options: {
    supportsWorker?: boolean;
    supportsWASM?: boolean;
    loadWorkerRejects?: boolean;
    workerTerminateThrows?: boolean;
  }): void => {
    const supportsWorker = options.supportsWorker ?? true;
    const supportsWASM = options.supportsWASM ?? true;
    const loadWorkerRejects = options.loadWorkerRejects ?? false;
    const workerTerminateThrows = options.workerTerminateThrows ?? false;

    const terminate = workerTerminateThrows
      ? () => {
          throw new Error('terminate throws');
        }
      : () => {};

    const workerPromise = new Promise<Worker>(resolve => {
      resolve({
        postMessage: () => {},
        onmessage: () => {},
        onmessageerror: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        terminate: terminate,
        dispatchEvent: () => true,
        onerror: () => {},
      });
    });

    if (loadWorkerRejects) {
      this.commonsSandbox.stub(loader, 'loadWorker').throws('worker threw');
    } else {
      this.commonsSandbox.stub(loader, 'loadWorker').returns(workerPromise);
    }

    this.commonsSandbox.stub(support, 'supportsWorker').returns(supportsWorker);
    this.commonsSandbox.stub(support, 'supportsWASM').returns(supportsWASM);
  };
}
