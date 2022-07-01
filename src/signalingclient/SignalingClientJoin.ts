// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';
import ServerSideNetworkAdaption from './ServerSideNetworkAdaption';

/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
export default class SignalingClientJoin {
  serverSideNetworkAdaption: ServerSideNetworkAdaption = ServerSideNetworkAdaption.Default;
  supportedServerSideNetworkAdaptions: ServerSideNetworkAdaption[] = [];

  /**
   * Initializes a SignalingClientJoin with the given properties.
   * @param applicationMetadata [[ApplicationMetadata]].
   */
  constructor(public readonly applicationMetadata?: ApplicationMetadata) {}
}
