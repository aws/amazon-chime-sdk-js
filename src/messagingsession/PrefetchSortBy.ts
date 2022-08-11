// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Using an enum here to make sure we can expand on future features
enum PrefetchSortBy {
  unread = 'unread',
  lastMessageTimestamp = 'last-message-timestamp',
}

export default PrefetchSortBy;
