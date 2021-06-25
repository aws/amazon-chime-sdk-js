// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventsIngestionMetadata from '../eventreporter/EventsIngestionMetadata';
import JSONIngestionEvent from './JSONIngestionEvent';

export default interface JSONIngestionRecord {
  metadata: EventsIngestionMetadata;
  events: JSONIngestionEvent[];
  authorization?: string;
}
