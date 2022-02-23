// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import EventAttributes from '../eventcontroller/EventAttributes';
import EventName from '../eventcontroller/EventName';

export default interface EventObserver {
  /**
   * Called when specific events occur during the SDK session and includes attributes of the event.
   * For more info visit: https://aws.amazon.com/blogs/business-productivity/monitoring-and-troubleshooting-with-amazon-chime-sdk-meeting-events/
   */
  eventDidReceive(name: EventName, attributes: EventAttributes): void;
}
