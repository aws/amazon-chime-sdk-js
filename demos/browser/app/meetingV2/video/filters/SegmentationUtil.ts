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

  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation@1.0.2/dist/body-segmentation.min.js',
    integrity: 'sha384-+Nfhv06p9s0N4jXs3zpNZ1UB0eCNMyjl5J10gmOGdPdVjxB3B2xfdZ1F2YINuWO/',
    crossOrigin: 'anonymous',
  },

  /*{
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation@1.0.2/dist/body-segmentation.js',
    integrity: 'sha384-0A3L9NwbWzCwUZsEe22mojzNTvKm2O+LKij9Cv1PRa3kMv8w1MYtwjfy93Cj/5oD',
    crossOrigin: 'anonymous',
  },*/
  
  {
    src: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.22.0/dist/tf-converter.min.js',
    integrity: 'sha384-sTQbAoegStaraHP3ijlE4F66mBcvLpX2zRxhhZqVsfVTGLsKLw6X3AMEyo18XygJ',
    crossOrigin: 'anonymous',
  },

  {
    src: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747/selfie_segmentation.min.js',
    integrity: 'sha384-YMriIdJi5bqCOhh4YoAKqRZBeHJVqHFu/bNwA1Mz1z+t93JHMomDEdujPgR0MQIk',
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
