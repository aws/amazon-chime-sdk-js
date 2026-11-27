// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CitrixRTCRtpReceiver from './CitrixRTCRtpReceiver';
import CitrixRTCRtpSender from './CitrixRTCRtpSender';
import CitrixRTCRtpTransceiver from './CitrixRTCRtpTransceiver';
import CitrixVDIAdapter from './CitrixVDIAdapter';

type Listener = EventListenerOrEventListenerObject;
type Handler<E extends Event> = ((this: RTCPeerConnection, ev: E) => unknown) | null;

/** Returns the UCSDK object behind a wrapper, or the object itself. */
export function unwrap<T>(x: T): T {
  return (x as { inner?: T }).inner ?? x;
}

/**
 * @internal
 * The browser `RTCPeerConnection` API over the UCSDK peer connection. The transceivers, senders
 * and receivers it hands out are wrappers too, one per UCSDK object.
 */
export default class CitrixRTCPeerConnection implements RTCPeerConnection {
  private readonly wrappers = new WeakMap<object, object>();
  private readonly trackListeners = new Map<Listener, EventListener>();
  private ontrackHandler: Handler<RTCTrackEvent> = null;
  private onsignalingstatechangeHandler: Handler<Event> = null;

  constructor(
    public readonly inner: RTCPeerConnection,
    public readonly adapter: CitrixVDIAdapter
  ) {}

  // Citrix mappings: every path that hands out a transceiver, sender or receiver.

  addTransceiver(
    trackOrKind: MediaStreamTrack | string,
    init?: RTCRtpTransceiverInit
  ): RTCRtpTransceiver {
    return this.wrapTransceiver(this.inner.addTransceiver(trackOrKind, init));
  }

  getTransceivers(): RTCRtpTransceiver[] {
    return this.inner.getTransceivers().map(t => this.wrapTransceiver(t));
  }

  getSenders(): RTCRtpSender[] {
    return this.inner.getSenders().map(s => this.wrapSender(s));
  }

  getReceivers(): RTCRtpReceiver[] {
    return this.inner.getReceivers().map(r => this.wrapReceiver(r));
  }

  addTrack(track: MediaStreamTrack, ...streams: MediaStream[]): RTCRtpSender {
    return this.wrapSender(this.inner.addTrack(track, ...streams));
  }

  removeTrack(sender: RTCRtpSender): void {
    this.inner.removeTrack(unwrap(sender));
  }

  // The SDK's track listeners read event.transceiver and event.receiver, so they must get the
  // wrappers the SDK already holds.
  addEventListener(
    type: string,
    listener: Listener,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (type === 'track') {
      // A browser ignores a listener that is already added. The SDK adds its listener again
      // on every session update.
      if (!listener || this.trackListeners.has(listener)) {
        return;
      }
      const mapped = (event: Event): void =>
        this.callListener(listener, this.wrapTrackEvent(event as RTCTrackEvent));
      this.trackListeners.set(listener, mapped);
      this.inner.addEventListener(type, mapped, options);
      return;
    }
    this.inner.addEventListener(type, listener, options);
  }

  removeEventListener(
    type: string,
    listener: Listener,
    options?: boolean | EventListenerOptions
  ): void {
    const mapped = type === 'track' ? this.trackListeners.get(listener) : undefined;
    if (mapped) {
      this.trackListeners.delete(listener);
    }
    this.inner.removeEventListener(type, mapped ?? listener, options);
  }

  get ontrack(): Handler<RTCTrackEvent> {
    return this.ontrackHandler;
  }

  set ontrack(handler: Handler<RTCTrackEvent>) {
    this.ontrackHandler = handler;
    this.inner.ontrack = handler && (event => handler.call(this, this.wrapTrackEvent(event)));
  }

  get canTrickleIceCandidates(): boolean | null {
    return this.inner.canTrickleIceCandidates;
  }

  get connectionState(): RTCPeerConnectionState {
    return this.inner.connectionState;
  }

  get currentLocalDescription(): RTCSessionDescription | null {
    return this.inner.currentLocalDescription;
  }

  get currentRemoteDescription(): RTCSessionDescription | null {
    return this.inner.currentRemoteDescription;
  }

  get iceConnectionState(): RTCIceConnectionState {
    return this.inner.iceConnectionState;
  }

  get iceGatheringState(): RTCIceGatheringState {
    return this.inner.iceGatheringState;
  }

  get localDescription(): RTCSessionDescription | null {
    return this.inner.localDescription;
  }

  get pendingLocalDescription(): RTCSessionDescription | null {
    return this.inner.pendingLocalDescription;
  }

  get pendingRemoteDescription(): RTCSessionDescription | null {
    return this.inner.pendingRemoteDescription;
  }

  get remoteDescription(): RTCSessionDescription | null {
    return this.inner.remoteDescription;
  }

  get sctp(): RTCSctpTransport | null {
    return this.inner.sctp;
  }

  get signalingState(): RTCSignalingState {
    return this.inner.signalingState;
  }

  get onconnectionstatechange(): Handler<Event> {
    return this.inner.onconnectionstatechange;
  }

  set onconnectionstatechange(handler: Handler<Event>) {
    this.inner.onconnectionstatechange = handler;
  }

  get ondatachannel(): Handler<RTCDataChannelEvent> {
    return this.inner.ondatachannel;
  }

  set ondatachannel(handler: Handler<RTCDataChannelEvent>) {
    this.inner.ondatachannel = handler;
  }

  get onicecandidate(): Handler<RTCPeerConnectionIceEvent> {
    return this.inner.onicecandidate;
  }

  set onicecandidate(handler: Handler<RTCPeerConnectionIceEvent>) {
    this.inner.onicecandidate = handler;
  }

  get onicecandidateerror(): Handler<RTCPeerConnectionIceErrorEvent> {
    return this.inner.onicecandidateerror;
  }

  set onicecandidateerror(handler: Handler<RTCPeerConnectionIceErrorEvent>) {
    this.inner.onicecandidateerror = handler;
  }

  get oniceconnectionstatechange(): Handler<Event> {
    return this.inner.oniceconnectionstatechange;
  }

  set oniceconnectionstatechange(handler: Handler<Event>) {
    this.inner.oniceconnectionstatechange = handler;
  }

  get onicegatheringstatechange(): Handler<Event> {
    return this.inner.onicegatheringstatechange;
  }

  set onicegatheringstatechange(handler: Handler<Event>) {
    this.inner.onicegatheringstatechange = handler;
  }

  get onnegotiationneeded(): Handler<Event> {
    return this.inner.onnegotiationneeded;
  }

  set onnegotiationneeded(handler: Handler<Event>) {
    this.inner.onnegotiationneeded = handler;
  }

  // The UCSDK defines the getter as onsignalingstatechanged, so this one would return undefined.
  get onsignalingstatechange(): Handler<Event> {
    return this.onsignalingstatechangeHandler;
  }

  set onsignalingstatechange(handler: Handler<Event>) {
    this.onsignalingstatechangeHandler = handler;
    this.inner.onsignalingstatechange = handler;
  }

  close(): void {
    this.inner.close();
  }

  createDataChannel(label: string, init?: RTCDataChannelInit): RTCDataChannel {
    return this.inner.createDataChannel(label, init);
  }

  dispatchEvent(event: Event): boolean {
    return this.inner.dispatchEvent(event);
  }

  getConfiguration(): RTCConfiguration {
    return this.inner.getConfiguration();
  }

  getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport> {
    return this.inner.getStats(selector);
  }

  // The UCSDK returns a Promise from these two where a browser returns nothing, and rejects it
  // where a browser throws.
  restartIce(): void {
    this.logRejection('restartIce', this.inner.restartIce());
  }

  setConfiguration(configuration?: RTCConfiguration): void {
    this.logRejection('setConfiguration', this.inner.setConfiguration(configuration));
  }

  // These keep lib.dom's legacy callback overloads, so they forward their arguments unchanged.
  addIceCandidate(...args: unknown[]): Promise<void> {
    return (this.inner.addIceCandidate as Forward<void>).apply(this.inner, args);
  }

  createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
  createAnswer(
    successCallback: RTCSessionDescriptionCallback,
    failureCallback: RTCPeerConnectionErrorCallback
  ): Promise<void>;
  createAnswer(...args: unknown[]): Promise<RTCSessionDescriptionInit | void> {
    return (this.inner.createAnswer as Forward<RTCSessionDescriptionInit | void>).apply(
      this.inner,
      args
    );
  }

  createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
  createOffer(
    successCallback: RTCSessionDescriptionCallback,
    failureCallback: RTCPeerConnectionErrorCallback,
    options?: RTCOfferOptions
  ): Promise<void>;
  createOffer(...args: unknown[]): Promise<RTCSessionDescriptionInit | void> {
    return (this.inner.createOffer as Forward<RTCSessionDescriptionInit | void>).apply(
      this.inner,
      args
    );
  }

  setLocalDescription(...args: unknown[]): Promise<void> {
    return (this.inner.setLocalDescription as Forward<void>).apply(this.inner, args);
  }

  setRemoteDescription(...args: unknown[]): Promise<void> {
    return (this.inner.setRemoteDescription as Forward<void>).apply(this.inner, args);
  }

  // One wrapper per UCSDK object, so that `===` in the SDK holds: it compares transceivers with
  // the ones it stored and keeps them as Map values.
  wrapTransceiver(transceiver: RTCRtpTransceiver): RTCRtpTransceiver {
    return this.cached(transceiver, () => new CitrixRTCRtpTransceiver(transceiver, this));
  }

  wrapSender(sender: RTCRtpSender): RTCRtpSender {
    return this.cached(sender, () => new CitrixRTCRtpSender(sender));
  }

  wrapReceiver(receiver: RTCRtpReceiver): RTCRtpReceiver {
    return this.cached(receiver, () => new CitrixRTCRtpReceiver(receiver));
  }

  private cached<T extends object>(inner: T, make: () => T): T {
    if (!inner) {
      return inner;
    }
    let wrapper = this.wrappers.get(inner) as T | undefined;
    if (!wrapper) {
      wrapper = make();
      this.wrappers.set(inner, wrapper);
    }
    return wrapper;
  }

  // Only the members the SDK reads.
  private wrapTrackEvent(event: RTCTrackEvent): RTCTrackEvent {
    const mapped: Pick<RTCTrackEvent, 'type' | 'track' | 'streams' | 'receiver' | 'transceiver'> = {
      type: event.type,
      track: event.track,
      streams: event.streams,
      receiver: this.wrapReceiver(event.receiver),
      transceiver: this.wrapTransceiver(event.transceiver),
    };
    return mapped as RTCTrackEvent;
  }

  private logRejection(method: string, result: unknown): void {
    if (result instanceof Promise) {
      result.catch(error =>
        this.adapter.logger?.warn(`CitrixVDIAdapter: ${method} failed: ${error}`)
      );
    }
  }

  private callListener(listener: Listener, event: Event): void {
    if (typeof listener === 'function') {
      listener.call(this, event);
    } else {
      listener.handleEvent(event);
    }
  }
}

type Forward<R> = (...args: unknown[]) => Promise<R>;
