// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { detect } from 'detect-browser';

const SEGMENTATION_DEPENDENCIES = [
  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.7.0/dist/tf.min.js',
    integrity: 'sha384-uI1PW0SEa/QzAUuRQ6Bz5teBONsa9D0ZbVxMcM8mu4IjJ5msHyM7RRtZtL8LnSf3',
    crossOrigin: 'anonymous',
  },

  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@2.7.0/dist/tf-core.min.js',
    integrity: 'sha384-DlI/SVdTGUBY5hi4h0p+nmC6V8i0FW5Nya/gYElz0L68HrSiXsBh+rqWcoZx3SXY',
    crossOrigin: 'anonymous',
  },

  {
    src:
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@2.7.0/dist/tf-backend-webgl.min.js',
    integrity: 'sha384-21TV9Kpzn8SF68G1U6nYN3qPZnb97F06JuW4v0FDDBzW+CUwv8GcKMR+BjnE7Vmm',
    crossOrigin: 'anonymous',
  },

  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.0.5/dist/body-pix.min.js',
    integrity: 'sha384-dPJ/sICXCqdh39bsuGLVFcOiRyeL/XcFrwiFrJq9oh7k1TCtsUKhX6UV2X4UuKU4',
    crossOrigin: 'anonymous',
  },
];


export async function loadBodyPixDependency(timeoutMs: number): Promise<void> {
  // the tf library loading order must be followed
  for (const { src, integrity, crossOrigin } of SEGMENTATION_DEPENDENCIES) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        reject(new Error(`Loading script ${src} takes longer than ${timeoutMs}`));
      }, timeoutMs);
      script.onload = function(_ev) {
        clearTimeout(timer);
        resolve();
      };
      script.onerror = function(_ev) {
        clearTimeout(timer);
        reject(new Error(`Failed to load ${src}`));
      };
      script.integrity = integrity;
      script.crossOrigin = crossOrigin;
      script.src = src;
      document.body.appendChild(script);
    });
  }
}

export function platformCanSupportBodyPixWithoutDegradation(): boolean {
  // https://blog.tensorflow.org/2019/11/updated-bodypix-2.html for more detail on performance
  // https://github.com/tensorflow/tfjs/issues/3319 which results in firefox memory leak
  const browser = detect();
  return browser.name === 'chrome' && /(android)/i.test(navigator.userAgent) === false;
}
