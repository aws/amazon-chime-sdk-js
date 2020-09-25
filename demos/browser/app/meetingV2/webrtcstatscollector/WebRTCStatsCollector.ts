// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

type MetricsData = { [key: string]: number };

interface CurrentAndPreviousMetrics {
  current: MetricsData;
  previous: MetricsData;
}

enum StreamDirection {
  'Downstream' = 'Downstream',
  'Upstream' = 'Upstream',
};

type SSRCToMetricsData = { [key: string]: CurrentAndPreviousMetrics };

const getCurrentUpstreamMetrics = (report: any, timestamp: number): MetricsData => {
  const currentMetrics: { [key: string]: number } = {};
  const { frameHeight, frameWidth, bytesSent, packetsSent, framesEncoded } = report;
  currentMetrics['frameHeight'] = frameHeight;
  currentMetrics['frameWidth'] = frameWidth;
  currentMetrics['framesEncoded'] = framesEncoded;
  currentMetrics['bytesSent'] = bytesSent;
  currentMetrics['packetsSent'] = packetsSent;
  currentMetrics['timestamp'] = timestamp;
  return currentMetrics;
}

const getCurrentDownstreamMetrics = (report: any, timestamp: number): MetricsData => {
  const currentMetrics: { [key: string]: number } = {};
  const { bytesReceived, packetsLost, packetsReceived, framesDecoded } = report;
  currentMetrics['bytesReceived'] = bytesReceived;
  currentMetrics['packetsLost'] = packetsLost;
  currentMetrics['packetsReceived'] = packetsReceived;
  currentMetrics['framesDecoded'] = framesDecoded;
  const totalPackets = packetsReceived + packetsLost;
  currentMetrics['packetLossPercent'] = totalPackets ? Math.trunc(packetsLost * 100 / (packetsReceived + packetsLost)) : 0;
  currentMetrics['timestamp'] = timestamp;
  return currentMetrics;
}

const bitsPerSecond = (metricName: string, metricMap: CurrentAndPreviousMetrics): number => {
  const previousTimestamp = metricMap.previous.timestamp;
  if (!previousTimestamp) {
    return 0;
  }
  const currentTimestamp = metricMap.current.timestamp;
  let intervalSeconds = (currentTimestamp - previousTimestamp) / 1000;
  if (intervalSeconds <= 0) {
    return 0;
  }
  const diff =
    (metricMap.current[metricName] - (metricMap.previous[metricName] || 0)) *
    8;
  if (diff <= 0) {
    return 0;
  }
  return Math.trunc((diff / intervalSeconds) / 1000);
};

const countPerSecond = (metricName: string, metricMap: CurrentAndPreviousMetrics) => {
  const previousTimestamp = metricMap.previous.timestamp;
  if (!previousTimestamp) {
    return 0;
  }
  const currentTimestamp = metricMap.current.timestamp;
  let intervalSeconds = (currentTimestamp - previousTimestamp) / 1000;
  if (intervalSeconds <= 0) {
    return 0;
  }
  const diff = metricMap.current[metricName] - (metricMap.previous[metricName] || 0);
  if (diff <= 0) {
    return 0;
  }
  return Math.trunc(diff / intervalSeconds);
}

export default class WebRTCStatsCollector {
  static MAX_UPSTREAMS_COUNT = 2;
  static MAX_DOWNSTREAMS_COUNT = 1;
  static CLEANUP_INTERVAL = 1500; // In milliseconds.
  // Map SSRC to WebRTC metrics.
  upstreamMetrics: SSRCToMetricsData = {};
  static upstreamMetricsKeyStatsToShow: { [key: string]: string } = {
    'resolution': 'Resolution',
    'bitrate': 'Bitrate (kbps)',
    'packetsSent': 'Packets Sent',
    'framesEncodedPerSecond': 'Frame Rate',
  };

  downstreamTileIndexToTrackId: { [key: string]: string } = {};
  // Map tile index to SSRC to WebRTC metrics.
  downstreamMetrics: { [key: string]: SSRCToMetricsData } = {};
  static downstreamMetricsKeyStatsToShow: { [key: string]: string } = {
    'resolution': 'Resolution',
    'bitrate': 'Bitrate (kbps)',
    'packetLossPercent': 'Packet Loss (%)',
    'framesDecodedPerSecond': 'Frame Rate',
  };

  cleanUpStaleUpstreamMetricsData = () => {
    const timestamp = Date.now();
    const ssrcsToRemove: string[] = [];
    for (const ssrc of Object.keys(this.upstreamMetrics)) {
      if ((timestamp - this.upstreamMetrics[ssrc].current.timestamp) >= WebRTCStatsCollector.CLEANUP_INTERVAL) {
        ssrcsToRemove.push(ssrc);
      }
    }
    ssrcsToRemove.forEach((ssrc) => delete this.upstreamMetrics[ssrc]);
  }

  processWebRTCStatReportForTileIndex = (rtcStatsReport: RTCStatsReport, tileIndex: number) => {
    this.cleanUpStaleUpstreamMetricsData();
    const timestamp = Date.now();
    let ssrcNum = 0;
    rtcStatsReport.forEach((report) => {
      if (report.ssrc) {
        ssrcNum = Number(report.ssrc);
      }

      if (report.kind && report.kind === 'video') {
        if (report.type === 'outbound-rtp' &&
            report.bytesSent &&
            report.frameHeight &&
            report.frameWidth
          ) { 
          // Collect and process upstream stats.
          if (!this.upstreamMetrics.hasOwnProperty(ssrcNum)) {
            if (Object.keys(this.upstreamMetrics).length === WebRTCStatsCollector.MAX_UPSTREAMS_COUNT) {
              this.upstreamMetrics = {};
            }
            this.upstreamMetrics[ssrcNum] = {
              current: {},
              previous: {}
            };
          } else {
            this.upstreamMetrics[ssrcNum].previous = this.upstreamMetrics[ssrcNum].current;
          }
          this.upstreamMetrics[ssrcNum].current = getCurrentUpstreamMetrics(report, timestamp);
          this.upstreamMetrics[ssrcNum].current['framesEncodedPerSecond'] = countPerSecond('framesEncoded', this.upstreamMetrics[ssrcNum]);
          this.upstreamMetrics[ssrcNum].current['bitrate'] = bitsPerSecond('bytesSent', this.upstreamMetrics[ssrcNum]);
        } else {
          if (report.type === 'inbound-rtp' && report.bytesReceived) { 
            // Collect and process downstream stats.
            const { trackId } = report;
            if (!this.downstreamMetrics.hasOwnProperty(tileIndex)) {
              this.downstreamMetrics[tileIndex] = {};
            }
            if (!this.downstreamMetrics[tileIndex].hasOwnProperty(ssrcNum)) {
              if (Object.keys(this.downstreamMetrics[tileIndex]).length === WebRTCStatsCollector.MAX_DOWNSTREAMS_COUNT) {
                this.downstreamMetrics[tileIndex] = {};
              }
              this.downstreamMetrics[tileIndex][ssrcNum] = {
                current: {},
                previous: {}
              };
              // Store trackId to later map frameHeight and frameWidth when WebRTC 'track' report is received for downstream videos.
              this.downstreamTileIndexToTrackId[tileIndex] = trackId;
            } else {
              this.downstreamMetrics[tileIndex][ssrcNum].previous = this.downstreamMetrics[tileIndex][ssrcNum].current;
            }
            this.downstreamMetrics[tileIndex][ssrcNum].current = getCurrentDownstreamMetrics(report, timestamp);
            this.downstreamMetrics[tileIndex][ssrcNum].current['bitrate'] = bitsPerSecond('bytesReceived', this.downstreamMetrics[tileIndex][ssrcNum]);
            this.downstreamMetrics[tileIndex][ssrcNum].current['framesDecodedPerSecond'] = countPerSecond('framesDecoded', this.downstreamMetrics[tileIndex][ssrcNum]);
          } else if (report.type === 'track' && this.downstreamTileIndexToTrackId[tileIndex] && this.downstreamTileIndexToTrackId[tileIndex] === report.id) {
            // Collect and process frame height and width stats for downstream.
            // Process frameHeight and frameWidth separately from track report as we do not have these stats in WebRTC 'inbound-rtp' report.
            const { frameHeight, frameWidth } = report;
            this.downstreamMetrics[tileIndex][ssrcNum].current.frameHeight = frameHeight;
            this.downstreamMetrics[tileIndex][ssrcNum].current.frameWidth = frameWidth;
          }
        }
      }
    });
  }

  resetStats = () => {
    this.upstreamMetrics = {};
    this.downstreamMetrics = {};
    this.downstreamTileIndexToTrackId = {};
  }

  showUpstreamStats(tileIndex: number) {
    this.showStats(
      tileIndex,
      StreamDirection.Upstream,
      WebRTCStatsCollector.upstreamMetricsKeyStatsToShow,
      this.upstreamMetrics
    );
  }

  showDownstreamStats(tileIndex: number) {
    this.showStats(
      tileIndex,
      StreamDirection.Downstream,
      WebRTCStatsCollector.downstreamMetricsKeyStatsToShow,
      this.downstreamMetrics[tileIndex]
    );
  }

  showStats = (
    tileIndex: number,
    streamDirection: StreamDirection,
    keyStatstoShow: { [key: string]: string },
    metricsData: SSRCToMetricsData
  ) => {
    const streams = Object.keys(metricsData);
    if (streams.length === 0) {
      return;
    }

    let statsInfo: HTMLDivElement = document.getElementById(`stats-info-${tileIndex}`) as HTMLDivElement;
    if (!statsInfo) {
      statsInfo = document.createElement('div');
      statsInfo.setAttribute('id', `stats-info-${tileIndex}`);
      statsInfo.setAttribute('class', `stats-info`);
    }

    const statsInfoTableId = `stats-table-${tileIndex}`;
    let statsInfoTable = document.getElementById(statsInfoTableId) as HTMLTableElement;
    if (statsInfoTable) {
      statsInfo.removeChild(statsInfoTable);
    }
    statsInfoTable = document.createElement('table') as HTMLTableElement;
    statsInfoTable.setAttribute('id', statsInfoTableId);
    statsInfoTable.setAttribute('class', 'stats-table');
    statsInfo.appendChild(statsInfoTable);

    const videoEl = document.getElementById(`video-${tileIndex}`) as HTMLVideoElement;
    videoEl.insertAdjacentElement('afterend', statsInfo);
    const header = statsInfoTable.insertRow(-1);
    let cell = header.insertCell(-1);
    cell.innerHTML = 'Video Metrics';
    for (let cnt = 0; cnt < streams.length; cnt++) {
      cell = header.insertCell(-1);
      cell.innerHTML = `${streamDirection} ${cnt + 1}`;
    }

    for (const [key, value] of Object.entries(keyStatstoShow)) {
      const row = statsInfoTable.insertRow(-1);
      row.setAttribute('id', `${streamDirection}-${key}-${tileIndex}`);
      cell = row.insertCell(-1);
      cell.innerHTML = value;
    }

    for (const ssrc of streams) {
      const { frameHeight, frameWidth, ...restStatsToShow } = metricsData[ssrc].current;
      if (frameHeight && frameWidth) {
        const row = document.getElementById(`${streamDirection}-resolution-${tileIndex}`) as HTMLTableRowElement;
        cell = row.insertCell(-1);
        cell.innerHTML = `${frameWidth} &#x2715; ${frameHeight}`;
      }
      for (const [metricName, value] of Object.entries(restStatsToShow)) {
        if (keyStatstoShow[metricName]) {
          const row = document.getElementById(`${streamDirection}-${metricName}-${tileIndex}`) as HTMLTableRowElement;
          cell = row.insertCell(-1);
          cell.innerHTML = `${value}`;
        }
      }
    }
  }
}
