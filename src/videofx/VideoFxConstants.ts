// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// These are constants relating to communication between the VideoFxProcessor
// and the VideoFxEngine
export const WORKER_MSG = {
  BUILD_ENGINE_REQUEST: 'BuildEngineRequest',
  BUILD_ENGINE_RESPONSE: 'BuildEngineResponse',

  PERFORM_SEGMENTATION_REQUEST: 'PerformSegmentationRequest',
  PERFORM_SEGMENTATION_RESPONSE: 'PerformSegmentationResponse',

  PERFORM_SEGMENTATION_SAB_REQUEST: 'PerformSegmentationSABRequest',
  PERFORM_SEGMENTATION_SAB_RESPONSE: 'PerformSegmentationSABResponse',

  DESTROY_ASSETS_REQUEST: 'DestroyAssetsRequest',
  DESTROY_ASSETS_RESPONSE: 'DestroyAssetsResponse',

  CLOSE_WORKER_REQUEST: 'CloseWorkerRequest',
};

// These are constants relating to the input stream/frames that are being used transformed
// by the VideoFxProcessor
interface DefaultStreamParametersType {
  FRAMES_PER_SECOND: number;
  WIDTH_IN_PIXEL: number;
  HEIGHT_IN_PIXEL: number;
  CHANNEL_COUNT: number;
}

export const DEFAULT_STREAM_PARAMETERS: DefaultStreamParametersType = {
  FRAMES_PER_SECOND: 15,
  WIDTH_IN_PIXEL: 960,
  HEIGHT_IN_PIXEL: 540,
  CHANNEL_COUNT: 4,
};

// These are constants relating to the status of different processes that get returned
// by the VideoFxEngine
export const SEGMENTATION_MODEL = {
  LOAD_SUCCESS: 2,
  WIDTH_IN_PIXELS: 176,
  HEIGHT_IN_PIXELS: 160,
};

// These are constants relating to resource constraints
export const RESOURCE_CONSTRAINTS = {
  DEFAULT_PROCESSING_BUDGET_PER_FRAME: 50,

  // Segmenation throttling constants
  SEGMENTATION_DEFAULT_FRAMES_PER_SEGMENTATION: 1,
  SEGMENTATION_SAMPLING_PERIOD_FRAME_COUNT: 500,

  // Blur throttling constants
  BLUR_DEFAULT_CYCLE_PERCENTAGE: 10,
  BLUR_SAMPLING_PERIOD_FRAME_COUNT: 1000,

  // General constants for throttling blur and segmentation
  MIN_PROCESSING_BUDGET: 0,
  MAX_PROCESSING_BUDGET: 100,
};

export const CDN_BASE_PATH: string = 'https://static.sdkassets.chime.aws';
const MFX_ASSET_PATH = '/ml_media_fx/otherassets';
export const WORKER_PATH: string = `${MFX_ASSET_PATH}/worker.js`;
export const FXLIB_PATH: string = `${MFX_ASSET_PATH}/fxlib.js`;
