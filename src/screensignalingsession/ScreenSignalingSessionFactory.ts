// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSignalingSession from './ScreenSignalingSession';

export default interface ScreenSignalingSessionFactory {
  create(url: string, sessionToken: string): ScreenSignalingSession;
}
