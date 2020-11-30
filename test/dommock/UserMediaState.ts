// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum UserMediaState {
  Success,
  PermissionDeniedError,
  NotReadableError,
  TrackStartError,
  NotFoundError,
  DevicesNotFoundError,
  NotAllowedError,
  OverconstrainedError,
  ConstraintNotSatisfiedError,
  TypeError,
  AbortError,
  SecurityError,
  Failure,
  GetUserMediaError,
}

export default UserMediaState;
