// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Message from '../message/Message';

export default interface MessagingSessionObserver {
  messagingSessionDidStart?(): void;
  messagingSessionDidStartConnecting?(reconnecting: boolean): void;
  messagingSessionDidStop?(event: CloseEvent): void;
  messagingSessionDidReceiveMessage?(message: Message): void;
}
