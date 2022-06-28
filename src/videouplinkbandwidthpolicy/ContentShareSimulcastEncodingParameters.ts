// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import VideoEncodingParameters from './VideoEncodingParameters';

type ContentShareSimulcastEncodingParameters = {
  low?: VideoEncodingParameters;
  high?: VideoEncodingParameters;
};

export default ContentShareSimulcastEncodingParameters;
