// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '../../style.scss';
import 'bootstrap';

export class MinimalApp {
  constructor() {
    console.log('starting app')
  }
}

window.addEventListener('load', () => {
  new MinimalApp();
});
