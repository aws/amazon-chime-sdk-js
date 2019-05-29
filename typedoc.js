// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  out: './doc/api/',
  readme: 'README.md',
  includes: './src',
  exclude: [
    'src/signalingprotocol/SignalingProtocol.js',
    'src/signalingprotocol/SignalingProtocol.d.ts',
    'src/signalingprotocol/ScreenSignalingProtocol.js',
    'src/signalingprotocol/ScreenSignalingProtocol.d.ts',
  ],
  mode: 'file',
};
