// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CitrixVDIAdapter from './CitrixVDIAdapter';

/** Opens and lists the devices on the Citrix endpoint through the UCSDK. */
export default class CitrixMediaDevices implements Pick<
  MediaDevices,
  'getUserMedia' | 'enumerateDevices'
> {
  constructor(private adapter: CitrixVDIAdapter) {}

  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    this.adapter.logger?.info('CitrixVDIAdapter: media captured on the endpoint');
    return this.adapter.ucsdk.getUserMedia(constraints);
  }

  enumerateDevices(): Promise<MediaDeviceInfo[]> {
    return this.adapter.ucsdk.enumerateDevices();
  }
}
