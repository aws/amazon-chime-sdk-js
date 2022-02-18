// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import BackgroundFilterVideoFrameProcessorObserver from '../backgroundfilter/BackgroundFilterVideoFrameProcessorObserver';

/**
 * An observer for the background blur video frame processor.
 *
 * Use {@link BackgroundBlurVideoFrameProcessor.addObserver} to register an
 * observer with the processor.
 */
export default interface BackgroundBlurVideoFrameProcessorObserver
  extends BackgroundFilterVideoFrameProcessorObserver {}
