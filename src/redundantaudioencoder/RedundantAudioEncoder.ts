// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export default class RedundantAudioEncoder {
  // Each payload must be less than 1024 bytes to fit the 10 bit block length
  private readonly maxRedPacketSizeBytes = 1 << 10;

  // Limit payload to 1000 bytes to handle small MTU. 1000 is chosen because in Chromium-based browsers, writing audio
  // payloads larger than 1000 bytes using the WebRTC Insertable Streams API (which is used to enable dynamic audio
  // redundancy) will cause an error to be thrown and cause audio flow to permanently stop. See
  // https://crbug.com/1248479.
  private readonly maxAudioPayloadSizeBytes = 1000;

  // Each payload can encode a timestamp delta of 14 bits
  private readonly maxRedTimestampOffset = 1 << 14;

  // 4 byte RED header
  private readonly redHeaderSizeBytes = 4;

  // reduced size for last RED header
  private readonly redLastHeaderSizeBytes = 1;

  // P-Time for Opus 20 msec packets
  // We do not support other p-times or clock rates
  private readonly redPacketizationTime = 960;

  // distance between redundant payloads, Opus FEC handles a distance of 1
  // TODO(https://issues.amazon.com/issues/ChimeSDKAudio-55):
  // Consider making this dynamic
  private readonly redPacketDistance = 2;

  // maximum number of redundant payloads per RTP packet
  private readonly maxRedEncodings = 2;

  // Maximum number of encodings that can be recovered with a single RED packet, assuming the primary and redundant
  // payloads have FEC.
  private readonly redMaxRecoveryDistance = this.redPacketDistance * this.maxRedEncodings + 1;

  // maximum history of prior payloads to keep
  // generally we will expire old entries based on timestamp
  // this limit is in place just to make sure the history does not
  // grow too large in the case of erroneous timestamp inputs
  private readonly maxEncodingHistorySize = 10;

  // Holds the RED payload type obtained from the local SDP
  // This is updated when the transceiver controller sends
  // a message of type RedPayloadType
  private redPayloadType: number;

  // Holds the RED payload type obtained from the local SDP
  // This is updated when the transceiver controller sends
  // a message of type RedPayloadType
  private opusPayloadType: number;

  // Current number of encodings we want to send
  // to the remote end. This will be dynamically
  // updated through the setNumEncodingsFromPacketloss API
  private numRedundantEncodings: number = 0;

  // Holds a history of primary payloads in order
  // oldest to newest
  private encodingHistory: Array<RedundantAudioEncoder.Encoding>;

  // Used to enable or disable redundancy
  // in response to very high packet loss events
  private redundancyEnabled: boolean = true;

  // This is a workaround for unit testing due to issues with mocking `self`
  // which is a part of DedicatedWorker scope and is currently used to post
  // messages to the main thread
  static shouldLog: boolean = false;

  // This is a workaround for unit testing due to issues with mocking `self`
  // which is a part of DedicatedWorker scope and is currently used to post
  // messages to the main thread
  static shouldReportStats: boolean = false;

  constructor() {
    this.encodingHistory = new Array<RedundantAudioEncoder.Encoding>();
    this.opusPayloadType = 0;
    this.redPayloadType = 0;
    this.initializePacketLogs();
  }

  /**
   * Creates an instance of RedundantAudioEncoder and sets up callbacks.
   */
  static initializeWorker(): void {
    RedundantAudioEncoder.log('Initializing RedundantAudioEncoder');
    const encoder = new RedundantAudioEncoder();

    // RED encoding is done using WebRTC Encoded Transform
    // https://github.com/w3c/webrtc-encoded-transform/blob/main/explainer.md

    // Check the DedicatedWorkerGlobalScope for existence of
    // RTCRtpScriptTransformer interface. If exists, then
    // RTCRtpScriptTransform is supported by this browser.
    // @ts-ignore
    if (self.RTCRtpScriptTransformer) {
      // @ts-ignore
      self.onrtctransform = (event: RTCTransformEvent) => {
        if (event.transformer.options.type === 'SenderTransform') {
          encoder.setupSenderTransform(event.transformer.readable, event.transformer.writable);
        } else if (event.transformer.options.type === 'ReceiverTransform') {
          encoder.setupReceiverTransform(event.transformer.readable, event.transformer.writable);
        } else if (event.transformer.options.type === 'PassthroughTransform') {
          encoder.setupPassthroughTransform(event.transformer.readable, event.transformer.writable);
        }
      };
    }

    self.onmessage = (event: MessageEvent) => {
      if (event.data.msgType === 'StartRedWorker') {
        encoder.setupSenderTransform(event.data.send.readable, event.data.send.writable);
        encoder.setupReceiverTransform(event.data.receive.readable, event.data.receive.writable);
      } else if (event.data.msgType === 'PassthroughTransform') {
        encoder.setupPassthroughTransform(event.data.send.readable, event.data.send.writable);
        encoder.setupPassthroughTransform(event.data.receive.readable, event.data.receive.writable);
      } else if (event.data.msgType === 'RedPayloadType') {
        encoder.setRedPayloadType(event.data.payloadType);
      } else if (event.data.msgType === 'OpusPayloadType') {
        encoder.setOpusPayloadType(event.data.payloadType);
      } else if (event.data.msgType === 'UpdateNumRedundantEncodings') {
        encoder.setNumRedundantEncodings(event.data.numRedundantEncodings);
      } else if (event.data.msgType === 'Enable') {
        encoder.setRedundancyEnabled(true);
      } else if (event.data.msgType === 'Disable') {
        encoder.setRedundancyEnabled(false);
      }
    };
  }

  /**
   * Post logs to the main thread
   */
  static log(msg: string): void {
    if (RedundantAudioEncoder.shouldLog) {
      // @ts-ignore
      self.postMessage({
        type: 'REDWorkerLog',
        log: `[AudioRed] ${msg}`,
      });
    }
  }

  /**
   * Returns the number of encodings based on packetLoss value. This is used by `DefaultTransceiverController` to
   * determine when to alert the encoder to update the number of encodings. It also determines if we need to
   * turn off red in cases of very high packet loss to avoid congestion collapse.
   */
  static getNumRedundantEncodingsForPacketLoss(packetLoss: number): [number, boolean] {
    let recommendedRedundantEncodings = 0;
    let shouldTurnOffRed = false;
    if (packetLoss <= 8) {
      recommendedRedundantEncodings = 0;
    } else if (packetLoss <= 18) {
      recommendedRedundantEncodings = 1;
    } else if (packetLoss <= 75) {
      recommendedRedundantEncodings = 2;
    } else {
      recommendedRedundantEncodings = 0;
      shouldTurnOffRed = true;
    }
    return [recommendedRedundantEncodings, shouldTurnOffRed];
  }

  /**
   * Sets up a passthrough (no-op) transform for the given streams.
   */
  setupPassthroughTransform(readable: ReadableStream, writable: WritableStream): void {
    RedundantAudioEncoder.log('Setting up passthrough transform');
    readable.pipeTo(writable);
  }

  /**
   * Sets up the transform stream and pipes the outgoing encoded audio frames through the transform function.
   */
  setupSenderTransform(readable: ReadableStream, writable: WritableStream): void {
    RedundantAudioEncoder.log('Setting up sender RED transform');
    const transformStream = new TransformStream({
      transform: this.senderTransform.bind(this),
    });
    readable.pipeThrough(transformStream).pipeTo(writable);
    return;
  }

  /**
   * Sets up the transform stream and pipes the received encoded audio frames through the transform function.
   */
  setupReceiverTransform(readable: ReadableStream, writable: WritableStream): void {
    RedundantAudioEncoder.log('Setting up receiver RED transform');
    const transformStream = new TransformStream({
      transform: this.receivePacketLogTransform.bind(this),
    });
    readable.pipeThrough(transformStream).pipeTo(writable);
    return;
  }

  /**
   * Set the RED payload type ideally obtained from local offer.
   */
  setRedPayloadType(payloadType: number): void {
    this.redPayloadType = payloadType;
    RedundantAudioEncoder.log(`red payload type set to ${this.redPayloadType}`);
  }

  /**
   * Set the opus payload type ideally obtained from local offer.
   */
  setOpusPayloadType(payloadType: number): void {
    this.opusPayloadType = payloadType;
    RedundantAudioEncoder.log(`opus payload type set to ${this.opusPayloadType}`);
  }

  /**
   * Set the number of redundant encodings
   */
  setNumRedundantEncodings(numRedundantEncodings: number): void {
    this.numRedundantEncodings = numRedundantEncodings;
    if (this.numRedundantEncodings > this.maxRedEncodings) {
      this.numRedundantEncodings = this.maxRedEncodings;
    }
    RedundantAudioEncoder.log(`Updated numRedundantEncodings to ${this.numRedundantEncodings}`);
  }

  /**
   * Enable or disable redundancy in response to
   * high packet loss event.
   */
  setRedundancyEnabled(enabled: boolean): void {
    this.redundancyEnabled = enabled;
    RedundantAudioEncoder.log(`redundancy ${this.redundancyEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Helper function to only enqueue audio frames if they do not exceed the audio payload byte limit imposed by
   * Chromium-based browsers. Chromium will throw an error (https://crbug.com/1248479) if an audio payload larger than
   * 1000 bytes is enqueued. Any controller that attempts to enqueue an audio payload larger than 1000 bytes will
   * encounter this error and will permanently stop sending or receiving audio.
   */
  private enqueueAudioFrameIfPayloadSizeIsValid(
    // @ts-ignore
    frame: RTCEncodedAudioFrame,
    controller: TransformStreamDefaultController
  ): void {
    if (frame.data.byteLength > this.maxAudioPayloadSizeBytes) return;
    controller.enqueue(frame);
  }

  /**
   * Receives encoded frames and modifies as needed before sending to transport.
   */
  private senderTransform(
    // @ts-ignore
    frame: RTCEncodedAudioFrame,
    controller: TransformStreamDefaultController
  ): void {
    const frameMetadata = frame.getMetadata();
    // @ts-ignore
    if (frameMetadata.payloadType !== this.redPayloadType) {
      this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
      return;
    }
    const primaryPayloadBuffer = this.getPrimaryPayload(frame.timestamp, frame.data);
    if (!primaryPayloadBuffer) {
      this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
      return;
    }
    const encodedBuffer = this.encode(frame.timestamp, primaryPayloadBuffer);
    /* istanbul ignore next */
    if (!encodedBuffer) {
      this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
      return;
    }
    frame.data = encodedBuffer;
    this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
    return;
  }

  /**
   * Get the primary payload from encoding
   */
  private getPrimaryPayload(primaryTimestamp: number, frame: ArrayBuffer): ArrayBuffer | null {
    const encodings = this.splitEncodings(primaryTimestamp, frame);
    if (!encodings || encodings.length < 1) return null;
    return encodings[encodings.length - 1].payload;
  }

  /**
   * Split up the encoding received into primary and redundant encodings
   * These will be ordered oldest to newest which is the same ordering
   * in the RTP red payload.
   */
  private splitEncodings(
    primaryTimestamp: number,
    frame: ArrayBuffer,
    getFecInfo: boolean = false,
    primarySequenceNumber: number = undefined
  ): RedundantAudioEncoder.Encoding[] | null {
    // process RED headers (according to RFC 2198)
    //   0                   1                   2                   3
    //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    //  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    //  |F|   block PT  |  timestamp offset         |   block length    |
    //  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    //
    // last header
    //   0 1 2 3 4 5 6 7
    //  +-+-+-+-+-+-+-+-+
    //  |0|   Block PT  |
    //  +-+-+-+-+-+-+-+-+

    const payload = new DataView(frame);
    let payloadSizeBytes = payload.byteLength;
    let totalPayloadSizeBytes = 0;
    let totalHeaderSizeBytes = 0;
    let primaryPayloadSizeBytes = 0;
    let payloadOffset = 0;
    let gotLastBlock = false;
    const encodings = new Array<RedundantAudioEncoder.Encoding>();
    const redundantEncodingBlockLengths = new Array();
    const redundantEncodingTimestamps = new Array();

    while (payloadSizeBytes > 0) {
      gotLastBlock = (payload.getUint8(payloadOffset) & 0x80) === 0;
      if (gotLastBlock) {
        // Bits 1 through 7 are payload type
        const payloadType = payload.getUint8(payloadOffset) & 0x7f;

        // Unexpected payload type. This is a bad packet.
        if (payloadType !== this.opusPayloadType) {
          return null;
        }

        totalPayloadSizeBytes += this.redLastHeaderSizeBytes;
        totalHeaderSizeBytes += this.redLastHeaderSizeBytes;

        // Accumulated block lengths are equal to or larger than the buffer, which means there is no primary block. This
        // is a bad packet.
        if (totalPayloadSizeBytes >= payload.byteLength) {
          return null;
        }

        primaryPayloadSizeBytes = payload.byteLength - totalPayloadSizeBytes;
        break;
      } else {
        if (payloadSizeBytes < this.redHeaderSizeBytes) {
          return null;
        }

        // Bits 22 through 31 are payload length
        const blockLength =
          ((payload.getUint8(payloadOffset + 2) & 0x03) << 8) + payload.getUint8(payloadOffset + 3);
        redundantEncodingBlockLengths.push(blockLength);
        const timestampOffset = payload.getUint16(payloadOffset + 1) >> 2;
        const timestamp = primaryTimestamp - timestampOffset;
        redundantEncodingTimestamps.push(timestamp);
        totalPayloadSizeBytes += blockLength + this.redHeaderSizeBytes;
        totalHeaderSizeBytes += this.redHeaderSizeBytes;
        payloadOffset += this.redHeaderSizeBytes;
        payloadSizeBytes -= this.redHeaderSizeBytes;
      }
    }

    // The last block was never found. This is a bad packet.
    if (!gotLastBlock) {
      return null;
    }

    let redundantPayloadOffset = totalHeaderSizeBytes;
    for (let i = 0; i < redundantEncodingTimestamps.length; i++) {
      const redundantPayloadBuffer = new ArrayBuffer(redundantEncodingBlockLengths[i]);
      const redundantPayloadArray = new Uint8Array(redundantPayloadBuffer);
      redundantPayloadArray.set(
        new Uint8Array(payload.buffer, redundantPayloadOffset, redundantEncodingBlockLengths[i]),
        0
      );
      const encoding: RedundantAudioEncoder.Encoding = {
        timestamp: redundantEncodingTimestamps[i],
        payload: redundantPayloadBuffer,
        isRedundant: true,
      };
      if (getFecInfo) {
        encoding.hasFec = this.opusPacketHasFec(
          new DataView(redundantPayloadBuffer),
          redundantPayloadBuffer.byteLength
        );
      }
      encodings.push(encoding);
      redundantPayloadOffset += redundantEncodingBlockLengths[i];
    }

    const primaryPayloadOffset = payload.byteLength - primaryPayloadSizeBytes;
    const primaryPayloadBuffer = new ArrayBuffer(primaryPayloadSizeBytes);
    const primaryArray = new Uint8Array(primaryPayloadBuffer);
    primaryArray.set(
      new Uint8Array(payload.buffer, primaryPayloadOffset, primaryPayloadSizeBytes),
      0
    );
    const encoding: RedundantAudioEncoder.Encoding = {
      timestamp: primaryTimestamp,
      payload: primaryPayloadBuffer,
      isRedundant: false,
      seq: primarySequenceNumber,
    };
    if (getFecInfo) {
      encoding.hasFec = this.opusPacketHasFec(
        new DataView(primaryPayloadBuffer),
        primaryPayloadBuffer.byteLength
      );
    }
    encodings.push(encoding);
    return encodings;
  }

  /**
   * Create a new encoding with current primary payload and the older payloads of choice.
   */
  private encode(primaryTimestamp: number, primaryPayload: ArrayBuffer): ArrayBuffer | null {
    const primaryPayloadSize = primaryPayload.byteLength;

    // Payload size needs to be valid.
    if (
      primaryPayloadSize === 0 ||
      primaryPayloadSize >= this.maxRedPacketSizeBytes ||
      primaryPayloadSize >= this.maxAudioPayloadSizeBytes
    ) {
      return null;
    }

    const numRedundantEncodings = this.numRedundantEncodings;
    let headerSizeBytes = this.redLastHeaderSizeBytes;
    let payloadSizeBytes = primaryPayloadSize;
    let bytesAvailable = this.maxAudioPayloadSizeBytes - primaryPayloadSize - headerSizeBytes;
    const redundantEncodingTimestamps: Array<number> = new Array();
    const redundantEncodingPayloads: Array<ArrayBuffer> = new Array();

    // If redundancy is disabled then only send the primary payload
    if (this.redundancyEnabled) {
      // Determine how much redundancy we can fit into our packet
      let redundantTimestamp = this.uint32WrapAround(
        primaryTimestamp - this.redPacketizationTime * this.redPacketDistance
      );
      for (let i = 0; i < numRedundantEncodings; i++) {
        // Do not add redundant encodings that are beyond the maximum timestamp offset.
        if (
          this.uint32WrapAround(primaryTimestamp - redundantTimestamp) >= this.maxRedTimestampOffset
        ) {
          break;
        }

        let findTimestamp = redundantTimestamp;
        let encoding = this.encodingHistory.find(e => e.timestamp === findTimestamp);

        if (!encoding) {
          // If not found or not important then look for the previous packet.
          // The current packet may have included FEC for the previous, so just
          // use the previous packet instead provided that it has voice activity.
          findTimestamp = this.uint32WrapAround(redundantTimestamp - this.redPacketizationTime);
          encoding = this.encodingHistory.find(e => e.timestamp === findTimestamp);
        }

        if (encoding) {
          const redundantEncodingSizeBytes = encoding.payload.byteLength;

          // Only add redundancy if there are enough bytes available.
          if (bytesAvailable < this.redHeaderSizeBytes + redundantEncodingSizeBytes) break;

          bytesAvailable -= this.redHeaderSizeBytes + redundantEncodingSizeBytes;
          headerSizeBytes += this.redHeaderSizeBytes;
          payloadSizeBytes += redundantEncodingSizeBytes;
          redundantEncodingTimestamps.unshift(encoding.timestamp);
          redundantEncodingPayloads.unshift(encoding.payload);
        }
        redundantTimestamp -= this.redPacketizationTime * this.redPacketDistance;
        redundantTimestamp = this.uint32WrapAround(redundantTimestamp);
      }
    }

    const redPayloadBuffer = new ArrayBuffer(headerSizeBytes + payloadSizeBytes);
    const redPayloadView = new DataView(redPayloadBuffer);

    // Add redundant encoding header(s) to new buffer
    let redPayloadOffset = 0;
    for (let i = 0; i < redundantEncodingTimestamps.length; i++) {
      const timestampDelta = primaryTimestamp - redundantEncodingTimestamps[i];
      redPayloadView.setUint8(redPayloadOffset, this.opusPayloadType | 0x80);
      redPayloadView.setUint16(
        redPayloadOffset + 1,
        (timestampDelta << 2) | (redundantEncodingPayloads[i].byteLength >> 8)
      );
      redPayloadView.setUint8(redPayloadOffset + 3, redundantEncodingPayloads[i].byteLength & 0xff);
      redPayloadOffset += this.redHeaderSizeBytes;
    }

    // Add primary encoding header to new buffer
    redPayloadView.setUint8(redPayloadOffset, this.opusPayloadType);
    redPayloadOffset += this.redLastHeaderSizeBytes;

    // Add redundant payload(s) to new buffer
    const redPayloadArray = new Uint8Array(redPayloadBuffer);
    for (let i = 0; i < redundantEncodingPayloads.length; i++) {
      redPayloadArray.set(new Uint8Array(redundantEncodingPayloads[i]), redPayloadOffset);
      redPayloadOffset += redundantEncodingPayloads[i].byteLength;
    }

    // Add primary payload to new buffer
    redPayloadArray.set(new Uint8Array(primaryPayload), redPayloadOffset);
    redPayloadOffset += primaryPayload.byteLength;

    /* istanbul ignore next */
    // Sanity check that we got the expected total payload size.
    if (redPayloadOffset !== headerSizeBytes + payloadSizeBytes) return null;

    this.updateEncodingHistory(primaryTimestamp, primaryPayload);

    return redPayloadBuffer;
  }

  /**
   * Update the encoding history with the latest primary encoding
   */
  private updateEncodingHistory(primaryTimestamp: number, primaryPayload: ArrayBuffer): void {
    // Remove encodings from the history if they are too old.
    for (const encoding of this.encodingHistory) {
      const maxTimestampDelta = this.redPacketizationTime * this.redMaxRecoveryDistance;

      if (primaryTimestamp - encoding.timestamp >= maxTimestampDelta) {
        this.encodingHistory.shift();
      } else {
        break;
      }
    }

    // Only add an encoding to the history if the encoding is deemed to be important. An encoding is important if it is
    // a CELT-only packet or contains voice activity.
    const packet = new DataView(primaryPayload);
    if (
      this.opusPacketIsCeltOnly(packet) ||
      this.opusPacketHasVoiceActivity(packet, packet.byteLength) > 0
    ) {
      // Check if adding an encoding will cause the length of the encoding history to exceed the maximum history size.
      // This is not expected to happen but could occur if we get incorrect timestamps. We want to make sure our memory
      // usage is bounded. In this case, just clear the history and start over from empty.
      if (this.encodingHistory.length + 1 > this.maxEncodingHistorySize)
        this.encodingHistory.length = 0;

      this.encodingHistory.push({ timestamp: primaryTimestamp, payload: primaryPayload });
    }
  }

  // Keep track of timestamps of primary packets received
  // from the server
  private primaryPacketLog: RedundantAudioEncoder.PacketLog;

  // Keeps track of timestamps of payloads we recovered
  // through redundant payloads.
  private redRecoveryLog: RedundantAudioEncoder.PacketLog;

  // Keeps track of timestamps of payloads we recovered
  // through fec payloads.
  private fecRecoveryLog: RedundantAudioEncoder.PacketLog;

  // Most recent sequence number of a primary packet received
  // from the server
  private newestSequenceNumber: number;

  // Total number of packets we expected from the server.
  private totalAudioPacketsExpected: number;

  // Total number of packets from the server that were lost.
  private totalAudioPacketsLost: number;

  // Total number of packets we recovered by consuming
  // redundant payloads.
  private totalAudioPacketsRecoveredRed: number;

  // Total number of packets we recovered by consuming
  // payloads with FEC.
  private totalAudioPacketsRecoveredFec: number;

  // The timestamp at which we last reported loss stats
  // to the main thread.
  private lastLossReportTimestamp: number;

  // Loss stats are reported to the main thread every 5 seconds.
  // Since timestamp differences between 2 consecutive packets
  // give us the number of samples in each channel, 1 second
  // is equivalent to 48000 samples:
  // P-time * (1000ms/1s)
  // = (960 samples/20ms) * (1000ms/1s)
  // = 48000 samples/s
  private readonly lossReportInterval: number = 48000 * 5;

  // Maximum distance of a packet from the most recent packet timestamp
  // that we will consider for recovery.
  private readonly maxOutOfOrderPacketDistance = 16;

  /**
   * Initialize packet logs and metric values.
   */
  private initializePacketLogs(): void {
    // The extra space from the max RED recovery distance is to ensure that we do not incorrectly count recovery for
    // packets that have already been received but are outside of the max out-of-order distance.
    const packetLogSize = this.maxOutOfOrderPacketDistance + this.redMaxRecoveryDistance;

    this.primaryPacketLog = {
      window: new Array<number>(packetLogSize),
      index: 0,
      windowSize: packetLogSize,
    };
    this.redRecoveryLog = {
      window: new Array<number>(packetLogSize),
      index: 0,
      windowSize: packetLogSize,
    };
    this.fecRecoveryLog = {
      window: new Array<number>(packetLogSize),
      index: 0,
      windowSize: packetLogSize,
    };
    this.totalAudioPacketsExpected = 0;
    this.totalAudioPacketsLost = 0;
    this.totalAudioPacketsRecoveredRed = 0;
    this.totalAudioPacketsRecoveredFec = 0;
  }

  /**
   * Receives encoded frames from the server
   * and adds the timestamps to a packet log
   * to calculate an approximate recovery metric.
   */
  private receivePacketLogTransform(
    // @ts-ignore
    frame: RTCEncodedAudioFrame,
    controller: TransformStreamDefaultController
  ): void {
    const frameMetadata = frame.getMetadata();
    // @ts-ignore
    if (frameMetadata.payloadType !== this.redPayloadType) {
      this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
      return;
    }
    // @ts-ignore
    const encodings = this.splitEncodings(
      frame.timestamp,
      frame.data,
      /*getFecInfo*/ true,
      frameMetadata.sequenceNumber
    );
    if (!encodings) {
      this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
      return;
    }
    for (let i = encodings.length - 1; i >= 0; i--) {
      if (this.updateLossStats(encodings[i])) {
        this.updateRedStats(encodings[i]);
        this.updateFecStats(encodings[i]);
      }
    }
    this.maybeReportLossStats(
      encodings[encodings.length - 1].timestamp,
      frameMetadata.synchronizationSource
    );
    this.enqueueAudioFrameIfPayloadSizeIsValid(frame, controller);
  }

  /**
   * Adds a timestamp to the primary packet log.
   * This also updates totalAudioPacketsLost and totalAudioPacketsExpected by looking
   * at the difference between timestamps.
   *
   * @param encoding : The encoding to be analyzed
   * @returns false if sequence number was greater than max out of order distance
   *          true otherwise
   */
  private updateLossStats(encoding: RedundantAudioEncoder.Encoding): boolean {
    if (encoding.isRedundant) return true;

    const timestamp = encoding.timestamp;
    const seq = encoding.seq;

    if (this.totalAudioPacketsExpected === 0) {
      this.totalAudioPacketsExpected = 1;
      this.newestSequenceNumber = seq;
      this.addTimestamp(this.primaryPacketLog, timestamp);
      return true;
    }

    const diff = this.int16(seq - this.newestSequenceNumber);
    if (diff < -this.maxOutOfOrderPacketDistance) return false;

    if (diff < 0) {
      if (!this.hasTimestamp(this.primaryPacketLog, timestamp)) {
        if (this.totalAudioPacketsLost > 0) this.totalAudioPacketsLost--;
        this.addTimestamp(this.primaryPacketLog, timestamp);
        this.removeFromRecoveryWindows(timestamp);
      }
    } else if (diff > 1) {
      this.totalAudioPacketsLost += diff - 1;
    }

    if (diff > 0) {
      this.totalAudioPacketsExpected += diff;
      this.newestSequenceNumber = encoding.seq;
      this.addTimestamp(this.primaryPacketLog, timestamp);
    }
    return true;
  }

  /**
   * Adds a timestamp to the red recovery log if it is not present in
   * the primary packet log and if it's not too old.
   *
   * @param encoding : The encoding to be analyzed
   */
  private updateRedStats(encoding: RedundantAudioEncoder.Encoding): void {
    if (!encoding.isRedundant || this.totalAudioPacketsLost === 0) return;

    const timestamp = encoding.timestamp;

    if (!this.hasTimestamp(this.primaryPacketLog, timestamp)) {
      if (!this.hasTimestamp(this.redRecoveryLog, timestamp)) {
        this.totalAudioPacketsRecoveredRed++;
        this.addTimestamp(this.redRecoveryLog, timestamp);
      }
      if (this.removeTimestamp(this.fecRecoveryLog, timestamp)) {
        /* istanbul ignore else */
        if (this.totalAudioPacketsRecoveredFec > 0) this.totalAudioPacketsRecoveredFec--;
      }
    }
  }

  /**
   * Adds a timestamp to the fec recovery log if it is not present in
   * the primary packet log and red recovery log and if it is not too old.
   *
   * @param encoding : The encoding to be analyzed
   */
  private updateFecStats(encoding: RedundantAudioEncoder.Encoding): void {
    if (!encoding.hasFec || this.totalAudioPacketsLost === 0) return;

    const fecTimestamp = encoding.timestamp - this.redPacketizationTime;

    if (
      this.hasTimestamp(this.primaryPacketLog, fecTimestamp) ||
      this.hasTimestamp(this.redRecoveryLog, fecTimestamp) ||
      this.hasTimestamp(this.fecRecoveryLog, fecTimestamp)
    ) {
      return;
    }

    this.totalAudioPacketsRecoveredFec++;
    this.addTimestamp(this.fecRecoveryLog, fecTimestamp);
  }

  /**
   * Reports loss metrics to DefaultTransceiverController
   *
   * @param timestamp : Timestamp of most recent primary packet
   */
  private maybeReportLossStats(timestamp: number, ssrc: number): void {
    if (timestamp - this.lastLossReportTimestamp < this.lossReportInterval) return;

    /* istanbul ignore next */
    if (RedundantAudioEncoder.shouldReportStats) {
      // @ts-ignore
      self.postMessage({
        type: 'RedundantAudioEncoderStats',
        ssrc,
        totalAudioPacketsLost: this.totalAudioPacketsLost,
        totalAudioPacketsExpected: this.totalAudioPacketsExpected,
        totalAudioPacketsRecoveredRed: this.totalAudioPacketsRecoveredRed,
        totalAudioPacketsRecoveredFec: this.totalAudioPacketsRecoveredFec,
      });
    }

    this.lastLossReportTimestamp = timestamp;
  }

  /**
   * Adds a timestamp to a packet log
   *
   * @param packetLog : The packetlog to add the timestamp to
   * @param timestamp : The timestamp that should be added
   */
  private addTimestamp(packetLog: RedundantAudioEncoder.PacketLog, timestamp: number): void {
    packetLog.window[packetLog.index] = timestamp;
    packetLog.index = (packetLog.index + 1) % packetLog.windowSize;
  }

  /**
   * Checks if a timestamp is in a packetlog
   *
   * @param packetLog : The packetlog to search
   * @param timestamp : The timestamp to search for
   * @returns true if timestamp is present, false otherwise
   */
  private hasTimestamp(packetLog: RedundantAudioEncoder.PacketLog, timestamp: number): boolean {
    const element = packetLog.window.find(t => t === timestamp);
    return !!element;
  }

  /**
   * Removes a timestamp from a packet log
   *
   * @param packetLog : The packetlog from which the timestamp should be removed
   * @param timestamp : The timestamp to be removed
   * @returns true if timestamp was present in the log and removed, false otherwise
   */
  private removeTimestamp(packetLog: RedundantAudioEncoder.PacketLog, timestamp: number): boolean {
    const index = packetLog.window.indexOf(timestamp);
    if (index >= 0) {
      packetLog.window[index] = undefined;
      return true;
    }
    return false;
  }

  /**
   * Removes a timestamp from red and fec recovery windows.
   *
   * @param timestamp : The timestamp to be removed
   */
  private removeFromRecoveryWindows(timestamp: number): void {
    let removed = this.removeTimestamp(this.redRecoveryLog, timestamp);
    if (removed) {
      if (this.totalAudioPacketsRecoveredRed > 0) this.totalAudioPacketsRecoveredRed--;
    }
    removed = this.removeTimestamp(this.fecRecoveryLog, timestamp);
    if (removed) {
      if (this.totalAudioPacketsRecoveredFec > 0) this.totalAudioPacketsRecoveredFec--;
    }
  }

  /**
   * Converts the supplied argument to 32-bit unsigned integer
   */
  private uint32WrapAround(num: number): number {
    const mod = 4294967296; // 2^32
    let res: number = num;
    if (num >= mod) {
      res = num - mod;
    } else if (num < 0) {
      res = mod + num;
    }
    return res;
  }

  /**
   * Converts the supplied argument to 16-bit signed integer
   */
  private int16(num: number): number {
    return (num << 16) >> 16;
  }

  /**
   * Below are Opus helper methods and constants.
   */

  private readonly OPUS_BAD_ARG = -1;
  private readonly OPUS_INVALID_PACKET = -4;

  // Max number of Opus frames in an Opus packet is 48 (https://www.rfc-editor.org/rfc/rfc6716#section-3.2.5).
  private readonly OPUS_MAX_OPUS_FRAMES = 48;

  // Max number of bytes that any individual Opus frame can have.
  private readonly OPUS_MAX_FRAME_SIZE_BYTES = 1275;

  /**
   * Determines if an Opus packet is in CELT-only mode.
   *
   * @param packet Opus packet.
   * @returns `true` if the packet is in CELT-only mode.
   */
  private opusPacketIsCeltOnly(packet: DataView): boolean {
    // TOC byte format (https://www.rfc-editor.org/rfc/rfc6716#section-3.1):
    //  0
    //  0 1 2 3 4 5 6 7
    // +-+-+-+-+-+-+-+-+
    // | config  |s| c |
    // +-+-+-+-+-+-+-+-+

    // Since CELT-only packets are represented using configurations 16 to 31, the highest 'config' bit will always be 1
    // for CELT-only packets.
    return !!(packet.getUint8(0) & 0x80);
  }

  /**
   * Gets the number of samples per frame from an Opus packet.
   *
   * @param packet Opus packet. This must contain at least one byte of data.
   * @param sampleRateHz 32-bit integer sampling rate in Hz. This must be a multiple of 400 or inaccurate results will
   *                     be returned.
   * @returns Number of samples per frame.
   */
  private opusPacketGetSamplesPerFrame(packet: DataView, sampleRateHz: number): number {
    // Sample rate must be a 32-bit integer.
    sampleRateHz = Math.round(sampleRateHz);
    sampleRateHz = Math.min(Math.max(sampleRateHz, -(2 ** 32)), 2 ** 32 - 1);

    // TOC byte format (https://www.rfc-editor.org/rfc/rfc6716#section-3.1):
    //  0
    //  0 1 2 3 4 5 6 7
    // +-+-+-+-+-+-+-+-+
    // | config  |s| c |
    // +-+-+-+-+-+-+-+-+

    let numSamples: number;
    let frameSizeOption: number;

    // Case for CELT-only packet.
    if (this.opusPacketIsCeltOnly(packet)) {
      // The lower 3 'config' bits indicate the frame size option.
      frameSizeOption = (packet.getUint8(0) >> 3) & 0x3;

      // The frame size options 0, 1, 2, 3 correspond to frame sizes of 2.5, 5, 10, 20 ms. Notice that the frame sizes
      // can be represented as (2.5 * 2^0), (2.5 * 2^1), (2.5 * 2^2), (2.5 * 2^3) ms. So, the number of samples can be
      // calculated as follows:
      // (sample/s) * (1s/1000ms) * (2.5ms) * 2^(frameSizeOption)
      // = (sample/s) * (1s/400) * 2^(frameSizeOption)
      // = (sample/s) * 2^(frameSizeOption) * (1s/400)
      numSamples = (sampleRateHz << frameSizeOption) / 400;
    }
    // Case for Hybrid packet. Since Hybrid packets are represented using configurations 12 to 15, bits 1 and 2 in the
    // above TOC byte diagram will both be 1.
    else if ((packet.getUint8(0) & 0x60) === 0x60) {
      // In the case of configuration 13 or 15, bit 4 in the above TOC byte diagram will be 1. Configurations 13 and 15
      // correspond to a 20ms frame size, so the number of samples is calculated as follows:
      // (sample/s) * (1s/1000ms) * (20ms)
      // = (sample/s) * (1s/50)
      //
      // In the case of configuration 12 or 14, bit 4 in the above TOC byte diagram will be 0. Configurations 12 and 14
      // correspond to a 10ms frame size, so the number of samples is calculated as follows:
      // (sample/s) * (1s/1000ms) * (10ms)
      // = (sample/s) * (1s/100)
      numSamples = packet.getUint8(0) & 0x08 ? sampleRateHz / 50 : sampleRateHz / 100;
    }
    // Case for SILK-only packet.
    else {
      // The lower 3 'config' bits indicate the frame size option for SILK-only packets.
      frameSizeOption = (packet.getUint8(0) >> 3) & 0x3;

      if (frameSizeOption === 3) {
        // Frame size option 3 corresponds to a frame size of 60ms, so the number of samples is calculated as follows:
        // (sample/s) * (1s/1000ms) * (60ms)
        // = (sample/s) * (60ms) * (1s/1000ms)
        numSamples = (sampleRateHz * 60) / 1000;
      } else {
        // The frame size options 0, 1, 2 correspond to frame sizes of 10, 20, 40 ms. Notice that the frame sizes can be
        // represented as (10 * 2^0), (10 * 2^1), (10 * 2^2) ms. So, the number of samples can be calculated as follows:
        // (sample/s) * (1s/1000ms) * (10ms) * 2^(frameSizeOption)
        // = (sample/s) * (1s/100) * 2^(frameSizeOption)
        // = (sample/s) * 2^(frameSizeOption) * (1s/100)
        numSamples = (sampleRateHz << frameSizeOption) / 100;
      }
    }

    return numSamples;
  }

  /**
   * Gets the number of SILK frames per Opus frame.
   *
   * @param packet Opus packet.
   * @returns Number of SILK frames per Opus frame.
   */
  private opusNumSilkFrames(packet: DataView): number {
    // For computing the frame length in ms, the sample rate is not important since it cancels out. We use 48 kHz, but
    // any valid sample rate would work.
    //
    // To calculate the length of a frame (with a 48kHz sample rate) in ms:
    // (samples/frame) * (1s/48000 samples) * (1000ms/s)
    // = (samples/frame) * (1000ms/48000 samples)
    // = (samples/frame) * (1ms/48 samples)
    let frameLengthMs = this.opusPacketGetSamplesPerFrame(packet, 48000) / 48;

    if (frameLengthMs < 10) frameLengthMs = 10;

    // The number of SILK frames per Opus frame is described in https://www.rfc-editor.org/rfc/rfc6716#section-4.2.2.
    switch (frameLengthMs) {
      case 10:
      case 20:
        return 1;
      case 40:
        return 2;
      case 60:
        return 3;
      // It is not possible to reach the default case since an Opus packet can only encode sizes of 2.5, 5, 10, 20, 40,
      // or 60 ms, so we ignore the default case for test coverage.
      /* istanbul ignore next */
      default:
        return 0;
    }
  }

  /**
   * Gets the number of channels from an Opus packet.
   *
   * @param packet Opus packet.
   * @returns Number of channels.
   */
  private opusPacketGetNumChannels(packet: DataView): number {
    // TOC byte format (https://www.rfc-editor.org/rfc/rfc6716#section-3.1):
    //  0
    //  0 1 2 3 4 5 6 7
    // +-+-+-+-+-+-+-+-+
    // | config  |s| c |
    // +-+-+-+-+-+-+-+-+

    // The 's' bit indicates mono or stereo audio, with 0 indicating mono and 1 indicating stereo.
    return packet.getUint8(0) & 0x4 ? 2 : 1;
  }

  /**
   * Determine the size (in bytes) of an Opus frame.
   *
   * @param packet Opus packet.
   * @param byteOffset Offset (from the start of the packet) to the byte containing the size information.
   * @param remainingBytes Remaining number of bytes to parse from the Opus packet.
   * @param sizeBytes Variable to store the parsed frame size (in bytes).
   * @returns Number of bytes that were parsed to determine the frame size.
   */
  private opusParseSize(
    packet: DataView,
    byteOffset: number,
    remainingBytes: number,
    sizeBytes: [number]
  ): number {
    // See https://www.rfc-editor.org/rfc/rfc6716#section-3.2.1 for an explanation of how frame size is represented.

    // If there are no remaining bytes to parse the size from, then the size cannot be determined.
    if (remainingBytes < 1) {
      sizeBytes[0] = -1;
      return -1;
    }
    // If the first byte is in the range 0...251, then this value is the size of the frame.
    else if (packet.getUint8(byteOffset) < 252) {
      sizeBytes[0] = packet.getUint8(byteOffset);
      return 1;
    }
    // If the first byte is in the range 252...255, a second byte is needed. If there is no second byte, then the size
    // cannot be determined.
    else if (remainingBytes < 2) {
      sizeBytes[0] = -1;
      return -1;
    }
    // The total size of the frame given two size bytes is:
    // (4 * secondSizeByte) + firstSizeByte
    else {
      sizeBytes[0] = 4 * packet.getUint8(byteOffset + 1) + packet.getUint8(byteOffset);
      return 2;
    }
  }

  /**
   * Parse binary data containing an Opus packet into one or more Opus frames.
   *
   * @param data Binary data containing an Opus packet to be parsed. The data should begin with the first byte (i.e the
   *             TOC byte) of an Opus packet. Note that the size of the data does not have to equal the size of the
   *             contained Opus packet.
   * @param lenBytes Size of the data (in bytes).
   * @param selfDelimited Indicates if the Opus packet is self-delimiting
   *                      (https://www.rfc-editor.org/rfc/rfc6716#appendix-B).
   * @param tocByte Optional variable to store the TOC (table of contents) byte.
   * @param frameOffsets Optional variable to store the offsets (from the start of the data) to the first bytes of each
   *                     Opus frame.
   * @param frameSizes Required variable to store the sizes (in bytes) of each Opus frame.
   * @param payloadOffset Optional variable to store the offset (from the start of the data) to the first byte of the
   *                      payload.
   * @param packetLenBytes Optional variable to store the length of the Opus packet (in bytes).
   * @returns Number of Opus frames.
   */
  private opusPacketParseImpl(
    data: DataView,
    lenBytes: number,
    selfDelimited: boolean,
    tocByte: [number],
    frameOffsets: Array<[number]>,
    frameSizes: Array<[number]>,
    payloadOffset: [number],
    packetLenBytes: [number]
  ): number {
    if (!frameSizes || lenBytes < 0) return this.OPUS_BAD_ARG;
    if (lenBytes === 0) return this.OPUS_INVALID_PACKET;

    // The number of Opus frames in the packet.
    let numFrames: number;

    // Intermediate storage for the number of bytes parsed to determine the size of a frame.
    let numBytesParsed: number;

    // The number of the padding bytes (excluding the padding count bytes) in the packet.
    let paddingBytes = 0;

    // Indicates whether CBR (constant bitrate) framing is used.
    let cbr = false;

    // The TOC (table of contents) byte (https://www.rfc-editor.org/rfc/rfc6716#section-3.1).
    const toc = data.getUint8(0);

    // Store the TOC byte.
    if (tocByte) tocByte[0] = toc;

    // The remaining number of bytes to parse from the packet. Note that the TOC byte has already been parsed, hence the
    // minus 1.
    let remainingBytes = lenBytes - 1;

    // This keeps track of where we are in the packet. This starts at 1 since the TOC byte has already been read.
    let byteOffset = 1;

    // The size of the last Opus frame in bytes.
    let lastSizeBytes = remainingBytes;

    // Read the `c` bits (i.e. code bits) from the TOC byte.
    switch (toc & 0x3) {
      // A code 0 packet (https://www.rfc-editor.org/rfc/rfc6716#section-3.2.2) has one frame.
      case 0:
        numFrames = 1;
        break;
      // A code 1 packet (https://www.rfc-editor.org/rfc/rfc6716#section-3.2.3) has two CBR (constant bitrate) frames.
      case 1:
        numFrames = 2;
        cbr = true;

        if (!selfDelimited) {
          // Undelimited code 1 packets must be an even number of data bytes, otherwise the packet is invalid.
          if (remainingBytes & 0x1) return this.OPUS_INVALID_PACKET;

          // The sizes of both frames are equal (i.e. half of the number of data bytes).
          lastSizeBytes = remainingBytes / 2;

          // If `lastSizeBytes` is too large, we will catch it later.
          frameSizes[0][0] = lastSizeBytes;
        }
        break;
      // A code 2 packet (https://www.rfc-editor.org/rfc/rfc6716#section-3.2.4) has two VBR (variable bitrate) frames.
      case 2:
        numFrames = 2;

        numBytesParsed = this.opusParseSize(data, byteOffset, remainingBytes, frameSizes[0]);
        remainingBytes -= numBytesParsed;

        // The parsed size of the first frame cannot be larger than the number of remaining bytes in the packet.
        if (frameSizes[0][0] < 0 || frameSizes[0][0] > remainingBytes) {
          return this.OPUS_INVALID_PACKET;
        }

        byteOffset += numBytesParsed;

        // The size of the second frame is the remaining number of bytes after the first frame.
        lastSizeBytes = remainingBytes - frameSizes[0][0];
        break;
      // A code 3 packet (https://www.rfc-editor.org/rfc/rfc6716#section-3.2.5) has multiple CBR/VBR frames (from 0 to
      // 120 ms).
      default:
        // Code 3 packets must have at least 2 bytes (i.e. at least 1 byte after the TOC byte).
        if (remainingBytes < 1) return this.OPUS_INVALID_PACKET;

        // Frame count byte format:
        //  0
        //  0 1 2 3 4 5 6 7
        // +-+-+-+-+-+-+-+-+
        // |v|p|     M     |
        // +-+-+-+-+-+-+-+-+
        //
        // Read the frame count byte, which immediately follows the TOC byte.
        const frameCountByte = data.getUint8(byteOffset++);
        --remainingBytes;

        // Read the 'M' bits of the frame count byte, which encode the number of frames.
        numFrames = frameCountByte & 0x3f;

        // The number of frames in a code 3 packet must not be 0.
        if (numFrames <= 0) return this.OPUS_INVALID_PACKET;

        const samplesPerFrame = this.opusPacketGetSamplesPerFrame(data, 48000);

        // A single frame can have at most 2880 samples, which happens in the case where 60ms of 48kHz audio is encoded
        // per frame. A code 3 packet cannot contain more than 120ms of audio, so the total number of samples cannot
        // exceed 2880 * 2 = 5760.
        if (samplesPerFrame * numFrames > 5760) return this.OPUS_INVALID_PACKET;

        // Parse padding bytes if the 'p' bit is 1.
        if (frameCountByte & 0x40) {
          let paddingCountByte: number;
          let numPaddingBytes: number;

          // Remove padding bytes (including padding count bytes) from the remaining byte count.
          do {
            // Sanity check that there are enough bytes to parse and remove the padding.
            if (remainingBytes <= 0) return this.OPUS_INVALID_PACKET;

            // Get the next padding count byte.
            paddingCountByte = data.getUint8(byteOffset++);
            --remainingBytes;

            // If the padding count byte has a value in the range 0...254, then the total size of the padding is the
            // value in the padding count byte.
            //
            // If the padding count byte has value 255, then the total size of the padding is 254 plus the value in the
            // next padding count byte. Therefore, keep reading padding count bytes while the value is 255.
            numPaddingBytes = paddingCountByte === 255 ? 254 : paddingCountByte;
            remainingBytes -= numPaddingBytes;
            paddingBytes += numPaddingBytes;
          } while (paddingCountByte === 255);
        }

        // Sanity check that the remaining number of bytes is not negative after removing the padding.
        if (remainingBytes < 0) return this.OPUS_INVALID_PACKET;

        // Read the 'v' bit (i.e. VBR bit).
        cbr = !(frameCountByte & 0x80);

        // VBR case
        if (!cbr) {
          lastSizeBytes = remainingBytes;

          // Let M be the number of frames. There will be M - 1 frame length indicators (which can be 1 or 2 bytes)
          // corresponding to the lengths of frames 0 to M - 2. The size of the last frame (i.e. frame M - 1) is the
          // number of data bytes after the end of frame M - 2 and before the start of the padding bytes.
          for (let i = 0; i < numFrames - 1; ++i) {
            numBytesParsed = this.opusParseSize(data, byteOffset, remainingBytes, frameSizes[i]);
            remainingBytes -= numBytesParsed;

            // The remaining number of data bytes must be enough to contain each frame.
            if (frameSizes[i][0] < 0 || frameSizes[i][0] > remainingBytes) {
              return this.OPUS_INVALID_PACKET;
            }

            byteOffset += numBytesParsed;

            lastSizeBytes -= numBytesParsed + frameSizes[i][0];
          }

          // Sanity check that the size of the last frame is not negative.
          if (lastSizeBytes < 0) return this.OPUS_INVALID_PACKET;
        }
        // CBR case
        else if (!selfDelimited) {
          // The size of each frame is the number of data bytes divided by the number of frames.
          lastSizeBytes = Math.trunc(remainingBytes / numFrames);

          // The number of data bytes must be a non-negative integer multiple of the number of frames.
          if (lastSizeBytes * numFrames !== remainingBytes) return this.OPUS_INVALID_PACKET;

          // All frames have equal size in the undelimited CBR case.
          for (let i = 0; i < numFrames - 1; ++i) {
            frameSizes[i][0] = lastSizeBytes;
          }
        }
    }

    // Self-delimited framing uses an extra 1 or 2 bytes, immediately preceding the data bytes, to indicate either the
    // size of the last frame (for code 0, code 2, and VBR code 3 packets) or the size of all the frames (for code 1 and
    // CBR code 3 packets). See https://www.rfc-editor.org/rfc/rfc6716#appendix-B.
    if (selfDelimited) {
      // The extra frame size byte(s) will always indicate the size of the last frame.
      numBytesParsed = this.opusParseSize(
        data,
        byteOffset,
        remainingBytes,
        frameSizes[numFrames - 1]
      );
      remainingBytes -= numBytesParsed;

      // There must be enough data bytes for the last frame.
      if (frameSizes[numFrames - 1][0] < 0 || frameSizes[numFrames - 1][0] > remainingBytes) {
        return this.OPUS_INVALID_PACKET;
      }

      byteOffset += numBytesParsed;

      // For CBR packets, the sizes of all the frames are equal.
      if (cbr) {
        // There must be enough data bytes for all the frames.
        if (frameSizes[numFrames - 1][0] * numFrames > remainingBytes) {
          return this.OPUS_INVALID_PACKET;
        }

        for (let i = 0; i < numFrames - 1; ++i) {
          frameSizes[i][0] = frameSizes[numFrames - 1][0];
        }
      }
      // At this point, `lastSizeBytes` contains the size of the last frame plus the size of the extra frame size
      // byte(s), so sanity check that `lastSizeBytes` is the upper bound for the size of the last frame.
      else if (!(numBytesParsed + frameSizes[numFrames - 1][0] <= lastSizeBytes)) {
        return this.OPUS_INVALID_PACKET;
      }
    }
    // Undelimited case
    else {
      // Because the size of the last packet is not encoded explicitly, it is possible that the size of the last packet
      // (or of all the packets, for the CBR case) is larger than maximum frame size.
      if (lastSizeBytes > this.OPUS_MAX_FRAME_SIZE_BYTES) return this.OPUS_INVALID_PACKET;

      frameSizes[numFrames - 1][0] = lastSizeBytes;
    }

    // Store the offset to the start of the payload.
    if (payloadOffset) payloadOffset[0] = byteOffset;

    // Store the offsets to the start of each frame.
    for (let i = 0; i < numFrames; ++i) {
      if (frameOffsets) frameOffsets[i][0] = byteOffset;

      byteOffset += frameSizes[i][0];
    }

    // Store the length of the Opus packet.
    if (packetLenBytes) packetLenBytes[0] = byteOffset + paddingBytes;

    return numFrames;
  }

  /**
   * Parse a single undelimited Opus packet into one or more Opus frames.
   *
   * @param packet Opus packet to be parsed.
   * @param lenBytes Size of the packet (in bytes).
   * @param tocByte Optional variable to store the TOC (table of contents) byte.
   * @param frameOffsets Optional variable to store the offsets (from the start of the packet) to the first bytes of
   *                     each Opus frame.
   * @param frameSizes Required variable to store the sizes (in bytes) of each Opus frame.
   * @param payloadOffset Optional variable to store the offset (from the start of the packet) to the first byte of the
   *                      payload.
   * @returns Number of Opus frames.
   */
  private opusPacketParse(
    packet: DataView,
    lenBytes: number,
    tocByte: [number],
    frameOffsets: Array<[number]>,
    frameSizes: Array<[number]>,
    payloadOffset: [number]
  ): number {
    return this.opusPacketParseImpl(
      packet,
      lenBytes,
      /* selfDelimited */ false,
      tocByte,
      frameOffsets,
      frameSizes,
      payloadOffset,
      null
    );
  }

  /**
   * This function returns the SILK VAD (voice activity detection) information encoded in the Opus packet. For CELT-only
   * packets that do not have VAD information, it returns -1.
   *
   * @param packet Opus packet.
   * @param lenBytes Size of the packet (in bytes).
   * @returns  0: no frame had the VAD flag set.
   *           1: at least one frame had the VAD flag set.
   *          -1: VAD status could not be determined.
   */
  private opusPacketHasVoiceActivity(packet: DataView, lenBytes: number): number {
    if (!packet || lenBytes <= 0) return 0;

    // In CELT-only mode, we can not determine whether there is VAD.
    if (this.opusPacketIsCeltOnly(packet)) return -1;

    const numSilkFrames = this.opusNumSilkFrames(packet);

    // It is not possible for `opusNumSilkFrames()` to return 0, so we ignore the next sanity check for test coverage.
    /* istanbul ignore next */
    if (numSilkFrames === 0) return -1;

    const opusFrameOffsets = new Array<[number]>(this.OPUS_MAX_OPUS_FRAMES);
    const opusFrameSizes = new Array<[number]>(this.OPUS_MAX_OPUS_FRAMES);
    for (let i = 0; i < this.OPUS_MAX_OPUS_FRAMES; ++i) {
      opusFrameOffsets[i] = [undefined];
      opusFrameSizes[i] = [undefined];
    }

    // Parse packet to get the Opus frames.
    const numOpusFrames = this.opusPacketParse(
      packet,
      lenBytes,
      null,
      opusFrameOffsets,
      opusFrameSizes,
      null
    );

    // VAD status cannot be determined for invalid packets.
    if (numOpusFrames < 0) return -1;

    // Iterate over all Opus frames, which may contain multiple SILK frames, to determine the VAD status.
    for (let i = 0; i < numOpusFrames; ++i) {
      if (opusFrameSizes[i][0] < 1) continue;

      // LP layer header bits format (https://www.rfc-editor.org/rfc/rfc6716#section-4.2.3):
      //
      // Mono case:
      // +-----------------+----------+
      // | 1 to 3 VAD bits | LBRR bit |
      // +-----------------+----------+
      //
      // Stereo case:
      // +---------------------+--------------+----------------------+---------------+
      // | 1 to 3 mid VAD bits | mid LBRR bit | 1 to 3 side VAD bits | side LBRR bit |
      // +---------------------+--------------+----------------------+---------------+

      // The upper 1 to 3 bits (dependent on the number of SILK frames) of the LP layer contain VAD bits. If any of
      // these VAD bits are 1, then voice activity is present.
      if (packet.getUint8(opusFrameOffsets[i][0]) >> (8 - numSilkFrames)) return 1;

      // In the stereo case, there is a second set of 1 to 3 VAD bits, so also check these VAD bits.
      const channels = this.opusPacketGetNumChannels(packet);
      if (
        channels === 2 &&
        (packet.getUint8(opusFrameOffsets[i][0]) << (numSilkFrames + 1)) >> (8 - numSilkFrames)
      ) {
        return 1;
      }
    }
    // No voice activity was detected.
    return 0;
  }

  /**
   * This method is based on Definition of the Opus Audio Codec
   * (https://tools.ietf.org/html/rfc6716). Basically, this method is based on
   * parsing the LP layer of an Opus packet, particularly the LBRR flag.
   *
   * @param packet Opus packet.
   * @param lenBytes Size of the packet (in bytes).
   * @returns  true: packet has fec encoding about previous packet.
   *           false: no fec encoding present.
   */
  private opusPacketHasFec(packet: DataView, lenBytes: number): boolean {
    if (!packet || lenBytes <= 0) return false;

    // In CELT-only mode, packets should not have FEC.
    if (this.opusPacketIsCeltOnly(packet)) return false;

    const opusFrameOffsets = new Array<[number]>(this.OPUS_MAX_OPUS_FRAMES);
    const opusFrameSizes = new Array<[number]>(this.OPUS_MAX_OPUS_FRAMES);
    for (let i = 0; i < this.OPUS_MAX_OPUS_FRAMES; ++i) {
      opusFrameOffsets[i] = [undefined];
      opusFrameSizes[i] = [undefined];
    }

    // Parse packet to get the Opus frames.
    const numOpusFrames = this.opusPacketParse(
      packet,
      lenBytes,
      null,
      opusFrameOffsets,
      opusFrameSizes,
      null
    );

    if (numOpusFrames < 0) return false;

    /* istanbul ignore next */
    if (opusFrameSizes[0][0] <= 1) return false;

    const numSilkFrames = this.opusNumSilkFrames(packet);
    /* istanbul ignore next */
    if (numSilkFrames === 0) return false;

    const channels = this.opusPacketGetNumChannels(packet);
    /* istanbul ignore next */
    if (channels !== 1 && channels !== 2) return false;

    // A frame starts with the LP layer. The LP layer begins with two to eight
    // header bits.These consist of one VAD bit per SILK frame (up to 3),
    // followed by a single flag indicating the presence of LBRR frames.
    // For a stereo packet, these first flags correspond to the mid channel, and
    // a second set of flags is included for the side channel. Because these are
    // the first symbols decoded by the range coder and because they are coded
    // as binary values with uniform probability, they can be extracted directly
    // from the most significant bits of the first byte of compressed data.
    for (let i = 0; i < channels; i++) {
      if (packet.getUint8(opusFrameOffsets[0][0]) & (0x80 >> ((i + 1) * (numSilkFrames + 1) - 1)))
        return true;
    }
    return false;
  }
}

namespace RedundantAudioEncoder {
  export interface Encoding {
    timestamp: number;
    seq?: number;
    payload: ArrayBuffer;
    isRedundant?: boolean;
    hasFec?: boolean;
  }

  export interface PacketLog {
    window: Array<number>;
    index: number;
    windowSize: number;
  }
}
