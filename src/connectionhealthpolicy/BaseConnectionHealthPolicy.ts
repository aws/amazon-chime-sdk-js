// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ConnectionHealthData from './ConnectionHealthData';
import ConnectionHealthPolicy from './ConnectionHealthPolicy';
import ConnectionHealthPolicyConfiguration from './ConnectionHealthPolicyConfiguration';

export default class BaseConnectionHealthPolicy implements ConnectionHealthPolicy {
  protected currentData: ConnectionHealthData;
  protected minHealth: number;
  protected maxHealth: number;
  protected currentHealth: number;

  constructor(configuration: ConnectionHealthPolicyConfiguration, data: ConnectionHealthData) {
    this.minHealth = configuration.minHealth;
    this.maxHealth = configuration.maxHealth;
    this.currentHealth = configuration.initialHealth;
    this.currentData = data.clone();
  }

  minimumHealth(): number {
    return this.minHealth;
  }

  maximumHealth(): number {
    return this.maxHealth;
  }

  health(): number {
    return this.maximumHealth();
  }

  update(connectionHealthData: ConnectionHealthData): void {
    this.currentData = connectionHealthData;
  }

  getConnectionHealthData(): ConnectionHealthData {
    return this.currentData.clone();
  }

  healthy(): boolean {
    return this.health() > this.minimumHealth();
  }

  healthIfChanged(): number | null {
    const newHealth = this.health();
    if (newHealth !== this.currentHealth) {
      this.currentHealth = newHealth;
      return newHealth;
    }
    return null;
  }
}
