// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A specifier for how to obtain a media stream from the browser. This
 * can be a `MediaStream` itself, a set of constraints, a device ID.
 */
type Device = string | MediaTrackConstraints | MediaStream;
export default Device;
