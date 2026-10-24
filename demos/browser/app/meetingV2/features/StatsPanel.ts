// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Types only: this module stays free of the SDK so its tests can load it.
import type { BackgroundFailure, BackgroundStatus } from '../devices/BackgroundEffect';
import { STRINGS } from '../strings';
import { el } from '../ui/dom';
import LineChart from '../ui/LineChart';

/** The parts of `ClientMetricReport` the panel reads. */
export interface MetricSource {
  getObservableMetrics(): { [name: string]: number };
  getObservableVideoMetrics(): {
    [attendeeId: string]: { [ssrc: string]: { [name: string]: number } };
  };
}

/** One second of session health, in the units the charts show. */
export interface StatsSample {
  availableSendKbps?: number;
  availableReceiveKbps?: number;
  roundTripMs?: number;
  audioRoundTripMs?: number;
  nacksReceivedPerSecond?: number;
  audioSentLossPercent?: number;
  audioReceivedLossPercent?: number;
  audioConcealedPercent?: number;
  audioSentJitterMs?: number;
  audioReceivedJitterMs?: number;
  microphoneLevelPercent?: number;
  speakerLevelPercent?: number;
  speakerDelayMs?: number;
  videoSentKbps?: number;
  videoReceivedKbps?: number;
  framesCapturedPerSecond?: number;
  framesSentPerSecond?: number;
  framesReceivedPerSecond?: number;
  sentHeight?: number;
  receivedHeight?: number;
  encodeMsPerFrame?: number;
  cpuLimitedPercent?: number;
  videoSentLossPercent?: number;
  videoReceivedLossPercent?: number;
}

const finite = (value: number | undefined): number | undefined =>
  value !== undefined && Number.isFinite(value) ? value : undefined;

/**
 * Reduce a metric report to one sample. Video streams are summed (bitrate), averaged (loss,
 * received frame rate) or maxed (sent frame rate and resolution: the highest simulcast layer)
 * across attendees and layers.
 */
export function sampleFrom(report: MetricSource): StatsSample {
  const metrics = report.getObservableMetrics();
  const streams = Object.values(report.getObservableVideoMetrics()).flatMap(Object.values);
  const values = (name: string): number[] =>
    streams.map(stream => stream[name]).filter((v): v is number => finite(v) !== undefined);
  const sum = (name: string): number | undefined => {
    const all = values(name);
    return all.length > 0 ? all.reduce((a, b) => a + b, 0) : undefined;
  };
  const average = (name: string): number | undefined => {
    const all = values(name);
    return all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : undefined;
  };
  const max = (name: string): number | undefined => {
    const all = values(name);
    return all.length > 0 ? Math.max(...all) : undefined;
  };
  const kbps = (bps: number | undefined): number | undefined =>
    bps === undefined ? undefined : bps / 1000;
  const percent = (fraction: number | undefined): number | undefined =>
    fraction === undefined ? undefined : fraction * 100;
  // Milliseconds spent encoding per second over the frames encoded in it, across layers.
  const encodeMs = sum('videoUpstreamTotalEncodeTimePerSecond');
  const framesEncoded = sum('videoUpstreamFramesEncodedPerSecond');
  const cpuLimitedMs = max('videoUpstreamCpuQualityLimitationDurationPerSecond');
  return {
    availableSendKbps: kbps(finite(metrics.availableOutgoingBitrate)),
    availableReceiveKbps: kbps(finite(metrics.availableIncomingBitrate)),
    roundTripMs: finite(metrics.currentRoundTripTimeMs),
    audioRoundTripMs: finite(metrics.audioUpstreamRoundTripTimeMs),
    nacksReceivedPerSecond: finite(metrics.nackCountReceivedPerSecond),
    audioSentLossPercent: finite(metrics.audioPacketLossPercent),
    audioReceivedLossPercent: finite(metrics.audioPacketsReceivedFractionLoss),
    audioConcealedPercent: finite(metrics.audioDecoderLoss),
    audioSentJitterMs: finite(metrics.audioUpstreamJitterMs),
    audioReceivedJitterMs: finite(metrics.audioDownstreamJitterMs),
    microphoneLevelPercent: percent(finite(metrics.audioUpstreamLevel)),
    speakerLevelPercent: percent(finite(metrics.audioDownstreamLevel)),
    speakerDelayMs: finite(metrics.audioSpeakerDelayMs),
    videoSentKbps: kbps(sum('videoUpstreamBitrate')),
    videoReceivedKbps: kbps(sum('videoDownstreamBitrate')),
    framesCapturedPerSecond: max('videoUpstreamFramesInputPerSecond'),
    framesSentPerSecond: max('videoUpstreamFramesEncodedPerSecond'),
    framesReceivedPerSecond: average('videoDownstreamFramesDecodedPerSecond'),
    sentHeight: max('videoUpstreamFrameHeight'),
    receivedHeight: max('videoDownstreamFrameHeight'),
    encodeMsPerFrame:
      encodeMs !== undefined && framesEncoded ? encodeMs / framesEncoded : undefined,
    cpuLimitedPercent: cpuLimitedMs === undefined ? undefined : cpuLimitedMs / 10,
    videoSentLossPercent: average('videoUpstreamPacketLossPercent'),
    videoReceivedLossPercent: average('videoDownstreamPacketLossPercent'),
  };
}

/** One second of the background effect, from the segmentation processor's last report. */
export interface BackgroundSample {
  segmentationMs?: number;
  renderMs?: number;
  cpuPercent?: number;
  framesSubmittedPerSecond?: number;
  framesSegmentedPerSecond?: number;
  framesPerSegmentation?: number;
}

export function backgroundSampleFrom(status: BackgroundStatus | undefined): BackgroundSample {
  const metrics = status?.processor;
  if (!metrics) {
    return {};
  }
  return {
    segmentationMs: finite(metrics.segmentationDurationMs),
    renderMs: finite(metrics.effectRenderDurationMs),
    cpuPercent: finite(metrics.estimatedCPUUsagePercentage),
    framesSubmittedPerSecond: finite(metrics.framesSubmitted),
    framesSegmentedPerSecond: finite(metrics.framesSegmented),
    framesPerSegmentation: finite(metrics.framesPerSegmentation),
  };
}

export type StatsPageId = 'network' | 'audio' | 'video' | 'background';

export interface StatsElements {
  tabs: HTMLElement;
  pages: Record<StatsPageId, HTMLElement>;
  tileStats: HTMLInputElement;
  uplink: HTMLElement;
  downlink: HTMLElement;
  redRecovery: HTMLElement;
  relayProtocol: HTMLElement;
  simulcastLayers: HTMLElement;
  backgroundIdle: HTMLElement;
  backgroundEffect: HTMLElement;
  backgroundModel: HTMLElement;
  backgroundDelegate: HTMLElement;
  backgroundStartup: HTMLElement;
  backgroundErrors: HTMLElement;
}

interface ChartSpec<S> {
  chart: LineChart;
  read: (sample: S) => (number | undefined)[];
}

const FAILURE_TEXT: Record<BackgroundFailure, string> = {
  assets: STRINGS.stats.assetsFailed,
  compatibility: STRINGS.stats.notCompatible,
  processor: STRINGS.stats.processorFailed,
};

/**
 * Media metrics in the side panel, one page at a time: Network, Audio, Video and the background
 * effect. Each page has live line charts of the last minute and the facts that go with them; the
 * switch for per-tile WebRTC stats sits above the pages. Hidden pages keep collecting.
 */
export default class StatsPanel {
  private readonly session: Record<Exclude<StatsPageId, 'background'>, ChartSpec<StatsSample>[]>;
  private readonly background: ChartSpec<BackgroundSample>[];
  private readonly tabs = new Map<StatsPageId, HTMLButtonElement>();
  private page: StatsPageId = 'network';
  private readonly onTileStatsChange = (): void =>
    this.callbacks.onTileStatsChange(this.elements.tileStats.checked);

  constructor(
    private readonly elements: StatsElements,
    private readonly callbacks: { onTileStatsChange: (on: boolean) => void }
  ) {
    const { stats } = STRINGS;
    const chart = <S>(
      title: string,
      unit: string,
      labels: string[],
      floor: number,
      read: (sample: S) => (number | undefined)[]
    ): ChartSpec<S> => ({
      chart: new LineChart(
        title,
        unit,
        labels.map(label => ({ label })),
        floor
      ),
      read,
    });
    this.session = {
      network: [
        chart<StatsSample>(stats.bandwidth, 'kbps', [stats.send, stats.receive], 100, s => [
          s.availableSendKbps,
          s.availableReceiveKbps,
        ]),
        chart<StatsSample>(stats.roundTrip, 'ms', [stats.connection, stats.audio], 50, s => [
          s.roundTripMs,
          s.audioRoundTripMs,
        ]),
        chart<StatsSample>(stats.retransmissions, '/s', [stats.nacksReceived], 5, s => [
          s.nacksReceivedPerSecond,
        ]),
      ],
      audio: [
        chart<StatsSample>(
          stats.packetLoss,
          '%',
          [stats.sent, stats.received, stats.concealed],
          2,
          s => [s.audioSentLossPercent, s.audioReceivedLossPercent, s.audioConcealedPercent]
        ),
        chart<StatsSample>(stats.jitter, 'ms', [stats.sent, stats.received], 20, s => [
          s.audioSentJitterMs,
          s.audioReceivedJitterMs,
        ]),
        chart<StatsSample>(stats.level, '%', [stats.microphone, stats.speaker], 10, s => [
          s.microphoneLevelPercent,
          s.speakerLevelPercent,
        ]),
        chart<StatsSample>(stats.playoutDelay, 'ms', [stats.speaker], 50, s => [s.speakerDelayMs]),
      ],
      video: [
        chart<StatsSample>(stats.bitrate, 'kbps', [stats.sent, stats.received], 100, s => [
          s.videoSentKbps,
          s.videoReceivedKbps,
        ]),
        chart<StatsSample>(
          stats.frameRate,
          'fps',
          [stats.captured, stats.sent, stats.received],
          15,
          s => [s.framesCapturedPerSecond, s.framesSentPerSecond, s.framesReceivedPerSecond]
        ),
        chart<StatsSample>(stats.resolution, 'px high', [stats.sent, stats.received], 360, s => [
          s.sentHeight,
          s.receivedHeight,
        ]),
        chart<StatsSample>(stats.encodeTime, 'ms per frame', [stats.encode], 10, s => [
          s.encodeMsPerFrame,
        ]),
        chart<StatsSample>(stats.cpuLimited, '%', [stats.ofTheTime], 10, s => [
          s.cpuLimitedPercent,
        ]),
        chart<StatsSample>(stats.packetLoss, '%', [stats.sent, stats.received], 2, s => [
          s.videoSentLossPercent,
          s.videoReceivedLossPercent,
        ]),
      ],
    };
    this.background = [
      chart<BackgroundSample>(
        stats.processingTime,
        'ms',
        [stats.segmentation, stats.render],
        20,
        s => [s.segmentationMs, s.renderMs]
      ),
      chart<BackgroundSample>(stats.estimatedCpu, '%', [stats.processor], 20, s => [s.cpuPercent]),
      chart<BackgroundSample>(stats.frames, '/s', [stats.submitted, stats.segmented], 15, s => [
        s.framesSubmittedPerSecond,
        s.framesSegmentedPerSecond,
      ]),
      chart<BackgroundSample>(stats.segmentationInterval, 'frames', [stats.frames], 2, s => [
        s.framesPerSegmentation,
      ]),
    ];
    for (const id of Object.keys(elements.pages) as StatsPageId[]) {
      elements.pages[id]
        .querySelector('.stats-charts')!
        .replaceChildren(...this.charts(id).map(chart => chart.element));
    }
    this.renderTabs();
    elements.tileStats.addEventListener('change', this.onTileStatsChange);
  }

  private renderTabs(): void {
    const labels: Record<StatsPageId, string> = {
      network: STRINGS.stats.network,
      audio: STRINGS.stats.audio,
      video: STRINGS.stats.video,
      background: STRINGS.stats.background,
    };
    this.elements.tabs.replaceChildren(
      ...(Object.keys(labels) as StatsPageId[]).map(id => {
        const tab = el('button', {
          type: 'button',
          role: 'tab',
          class: 'segment',
          id: `stats-tab-${id}`,
          'aria-controls': this.elements.pages[id].id,
          text: labels[id],
          onclick: () => this.showPage(id),
        });
        this.tabs.set(id, tab);
        return tab;
      })
    );
    this.showPage(this.page);
  }

  showPage(id: StatsPageId): void {
    this.page = id;
    for (const [candidate, tab] of this.tabs) {
      tab.setAttribute('aria-selected', String(candidate === id));
      tab.tabIndex = candidate === id ? 0 : -1;
      this.elements.pages[candidate].hidden = candidate !== id;
    }
    this.render();
  }

  update(report: MetricSource, redRecovery: string, background?: BackgroundStatus): void {
    const sample = sampleFrom(report);
    for (const specs of Object.values(this.session)) {
      for (const { chart, read } of specs) {
        chart.push(read(sample));
      }
    }
    const backgroundSample = backgroundSampleFrom(background);
    for (const { chart, read } of this.background) {
      chart.push(read(backgroundSample));
    }
    this.elements.uplink.textContent = StatsPanel.bandwidth(sample.availableSendKbps);
    this.elements.downlink.textContent = StatsPanel.bandwidth(sample.availableReceiveKbps);
    this.elements.redRecovery.textContent = redRecovery || STRINGS.notAvailable;
    this.showBackgroundFacts(background);
  }

  private showBackgroundFacts(status: BackgroundStatus | undefined): void {
    const e = this.elements;
    const metrics = status?.processor;
    const effect = status?.effect ?? 'none';
    e.backgroundIdle.hidden = effect !== 'none';
    e.backgroundEffect.textContent = STRINGS.stats.effectNames[effect];
    e.backgroundModel.textContent = !metrics
      ? STRINGS.notAvailable
      : status?.selectedModel && metrics.modelType !== status.selectedModel
        ? STRINGS.stats.modelDowngraded(metrics.modelType, status.selectedModel)
        : metrics.modelType;
    e.backgroundDelegate.textContent = metrics?.delegateType ?? STRINGS.notAvailable;
    e.backgroundStartup.textContent = status?.failure
      ? FAILURE_TEXT[status.failure]
      : metrics?.initializationDurationMs !== undefined
        ? STRINGS.stats.startup(metrics.initializationDurationMs, status?.assetLoadingTimeMs)
        : STRINGS.notAvailable;
    e.backgroundErrors.textContent =
      metrics === undefined ? STRINGS.notAvailable : String(metrics.errorCount);
  }

  private charts(page: StatsPageId): LineChart[] {
    const specs = page === 'background' ? this.background : this.session[page];
    return specs.map(({ chart }) => chart);
  }

  /** Draw what was collected while the panel or the page was hidden. */
  render(): void {
    for (const chart of this.charts(this.page)) {
      chart.render();
    }
  }

  /** Developer mode went off: the per-tile overlay goes with it. */
  turnOffTileStats(): void {
    if (this.elements.tileStats.checked) {
      this.elements.tileStats.checked = false;
      this.onTileStatsChange();
    }
  }

  setRelayProtocol(protocol: string): void {
    this.elements.relayProtocol.textContent = protocol;
  }

  setSimulcastLayers(description: string): void {
    this.elements.simulcastLayers.textContent = description;
  }

  destroy(): void {
    this.elements.tileStats.removeEventListener('change', this.onTileStatsChange);
    this.elements.relayProtocol.textContent = '';
    this.elements.simulcastLayers.textContent = '';
  }

  static bandwidth(kbps: number | undefined): string {
    return kbps === undefined
      ? STRINGS.bandwidthUnknown
      : kbps >= 1000
        ? `${(kbps / 1000).toFixed(1)} Mbps`
        : `${Math.round(kbps)} kbps`;
  }
}
