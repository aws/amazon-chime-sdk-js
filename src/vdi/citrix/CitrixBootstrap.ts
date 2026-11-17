// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/** The Citrix Bootstrap (`CitrixBootstrap`) calls used here. The application supplies the object. */
export default interface CitrixBootstrap {
  initBootstrap(vendor: string): void;
  isBootstrapInitialized(): boolean;
  getWindowHandle(): Promise<string>;
}
