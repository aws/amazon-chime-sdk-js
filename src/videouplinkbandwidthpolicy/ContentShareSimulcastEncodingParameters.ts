// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoEncodingParameters from './VideoEncodingParameters';

/**
 * @deprecated Simulcast is deprecated in favor of scalable video coding (SVC).
 */
type ContentShareSimulcastEncodingParameters = {
  low?: VideoEncodingParameters;
  high?: VideoEncodingParameters;
};

export default ContentShareSimulcastEncodingParameters;
