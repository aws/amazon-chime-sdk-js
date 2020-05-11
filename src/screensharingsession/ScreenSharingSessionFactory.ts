// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ScreenSharingSession from './ScreenSharingSession';

export default interface ScreenSharingSessionFactory {
  create(url: string, sessionToken: string): ScreenSharingSession;
}
