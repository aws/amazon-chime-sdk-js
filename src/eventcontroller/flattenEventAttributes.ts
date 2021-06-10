// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';

/**
 *
 * @param attributes Event attributes to flatten.
 * @returns flattened event attributes.
 * Note: This function needs to be extended to support 'Array', 'object'
 * as value types within the event attributes if added later.
 */
const flattenEventAttributes = (
  attributes: AudioVideoEventAttributes | DeviceEventAttributes
): { [key: string]: string | number } => {
  const flattenedAttributes: { [key: string]: string | number } = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === '') {
      continue;
    } else if (typeof value === 'number' || typeof value === 'string') {
      flattenedAttributes[key] = value;
    } else {
      throw new TypeError('Unhandled type received while flattening attributes.');
    }
  }
  return flattenedAttributes;
};

export default flattenEventAttributes;
