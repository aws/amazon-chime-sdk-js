// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default interface AudioMixControllerFacade {
  bindAudioElement(element: HTMLAudioElement): boolean;
  unbindAudioElement(): void;
}
