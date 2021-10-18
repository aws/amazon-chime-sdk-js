// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ModelShape from '../modelspec/ModelShape';
import ModelSpec from '../modelspec/ModelSpec';

/**
 * A builder class to instantiate a model spec.
 */
export default class ModelSpecBuilder {
  private path: string = null;
  private input: ModelShape = null;
  private output: ModelShape = null;
  static builder(): ModelSpecBuilder {
    return new ModelSpecBuilder();
  }

  /**
   * Set up the builder to use the default model implementation.
   *
   * Members of this interface can change without a major version bump to accommodate new browser
   * bugs and capabilities. If you extend this type, you might need to rework your code for new minor
   * versions of this library.
   * @returns a reference to the current builder.
   */
  withDefaultModel(): ModelSpecBuilder {
    return this.withSelfieSegmentationDefaults();
  }

  /**
   * Set up the builder to use the defaults for selfie segmentation model.
   * @returns the builder to allow for fluent API (e.g., ModelSpecBuilder.withSelfieSegmentationDefaults().build()).
   */
  withSelfieSegmentationDefaults(): ModelSpecBuilder {
    const SELFIE_MODEL_INPUT_SHAPE: ModelShape = {
      height: 144,
      width: 256,
      range: [0, 1],
      channels: 3,
    };

    const SELFIE_MODEL_OUTPUT_SHAPE: ModelShape = {
      height: 144,
      width: 256,
      range: [0, 1],
      channels: 1,
    };

    const DEFAULT_SELFIE_MODEL_PATH =
      'https://static.sdkassets.chime.aws/bgblur/models/selfie_segmentation_landscape.tflite';

    this.path = DEFAULT_SELFIE_MODEL_PATH;
    this.input = SELFIE_MODEL_INPUT_SHAPE;
    this.output = SELFIE_MODEL_OUTPUT_SHAPE;
    return this;
  }

  /**
   * A method to override the path to the segmentation model.
   * @param path A function that returns the path to the segmentation model.
   * @returns the builder to allow for fluent API (e.g., ModelSpecBuilder.builder().withPath("some path").build()).
   */
  withPath(path: string): ModelSpecBuilder {
    this.path = path;
    return this;
  }

  /**
   * A method to override the input shape to the segmentation model.
   * @param input An object that defines input shape of the segmentation model.
   * @returns the builder to allow for fluent API (e.g., ModelSpecBuilder.builder().withInput({}).build()).
   */
  withInput(input: ModelShape): ModelSpecBuilder {
    this.input = input;
    return this;
  }

  /**
   * A method to override the output shape to the segmentation model.
   * @param input An object that defines input shape of the segmentation model.
   * @returns the builder to allow for fluent API (e.g., ModelSpecBuilder.builder().withOutput({}).build()).
   */
  withOutput(output: ModelShape): ModelSpecBuilder {
    this.output = output;
    return this;
  }

  /**
   * Validate that inputs to the model spec are valid.
   */
  private validate(): void {
    if (!this.path) {
      throw new Error('model spec path is not set');
    }

    if (!this.input) {
      throw new Error('model spec input is not set');
    }

    if (!this.output) {
      throw new Error('model spec output is not set');
    }
  }

  /**
   * A method that returns an instantiated object that implements the ModelSpec interface with values set for
   * the use of the selfie segmentation model.
   * @returns an object that implements the ModelSpec interface.
   */
  build(): ModelSpec {
    this.validate();
    return {
      path: this.path,
      input: this.input,
      output: this.output,
    };
  }
}
