// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventBufferConfiguration from '../eventbufferconfiguration/EventBufferConfiguration';
import EventsClientConfiguration from '../eventsclientconfiguration/EventsClientConfiguration';

/**
 * [[EventIngestionConfiguration]] contains necessary information to
 * report events to the ingestion service.
 */
export default class EventIngestionConfiguration {
  /**
   * Client specific configuration.
   */
  eventsClientConfiguration: EventsClientConfiguration;

  /**
   * Ingestion service endpoint to send the events.
   */
  ingestionURL: string;

  /**
   * Buffer configuration to use when buffering and sending events
   * to the ingestion service endpoint.
   * This is optional and we use default values to create EventBufferConfiguration.
   */
  eventBufferConfiguration: EventBufferConfiguration;

  constructor(
    eventsClientConfiguration: EventsClientConfiguration,
    ingestionURL: string,
    eventBufferConfiguration = new EventBufferConfiguration()
  ) {
    this.eventsClientConfiguration = eventsClientConfiguration;
    this.ingestionURL = ingestionURL;
    this.eventBufferConfiguration = eventBufferConfiguration;
  }
}
