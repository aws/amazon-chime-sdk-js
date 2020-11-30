// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MeetingSessionTURNCredentials]] contains TURN credentials from the TURN server.
 */
export default class MeetingSessionTURNCredentials {
  username: string | null = null;
  password: string | null = null;
  ttl: number | null = null;
  uris: string[] | null = null;
}
