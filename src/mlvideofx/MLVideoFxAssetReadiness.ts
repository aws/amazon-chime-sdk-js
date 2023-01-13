// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MLVideoFxConfig]] describes the status of assets that are associated iwth the MLVideoFxDriver
 *  Note: for now this is quite empty as the MLVideoFx only is loading a worker
 */
export default interface MLVideoFxAssetReadiness {
  // Marker for whether the engine worker has been loaded
  engineWorkerAssetsReady: boolean;
}
