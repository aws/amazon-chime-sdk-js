// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * [[MediaStreamProvider]] is a simple wrapper around a `MediaStream` that exposes additional API
 * to manage any underlying resources. Implementations may wrap or transform internal [[MediaStreamProvider]]
 */
export default interface MediaStreamProvider {
    /**
     * Return a media stream.
     */
    getMediaStream(): Promise<MediaStream>;

    /**
     * Pause underlying media, e.g. a file playing back.
     */
    pause(): void;
    
    /**
     * Resume paused underlying media.
     */
    resume(): void;
}