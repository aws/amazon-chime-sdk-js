// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Attendee from '../attendee/Attendee';
import ClientMetricReport from '../clientmetricreport/ClientMetricReport';
import Direction from '../clientmetricreport/ClientMetricReportDirection';
import MediaType from '../clientmetricreport/ClientMetricReportMediaType';
import ContentShareConstants from '../contentsharecontroller/ContentShareConstants';
import Logger from '../logger/Logger';
import { LogLevel } from '../logger/LogLevel';
import ServerSideNetworkAdaption, {
  serverSideNetworkAdaptionIsNoneOrDefault,
} from '../signalingclient/ServerSideNetworkAdaption';
import VideoSource from '../videosource/VideoSource';
import DefaultVideoStreamIdSet from '../videostreamidset/DefaultVideoStreamIdSet';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamDescription from '../videostreamindex/VideoStreamDescription';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import DefaultVideoTile from '../videotile/DefaultVideoTile';
import VideoTile from '../videotile/VideoTile';
import VideoTileController from '../videotilecontroller/VideoTileController';
import AllHighestVideoBandwidthPolicy from './AllHighestVideoBandwidthPolicy';
import TargetDisplaySize from './TargetDisplaySize';
import VideoDownlinkBandwidthPolicy from './VideoDownlinkBandwidthPolicy';
import VideoDownlinkObserver from './VideoDownlinkObserver';
import VideoPreference from './VideoPreference';
import { VideoPreferences } from './VideoPreferences';
import VideoPriorityBasedPolicyConfig from './VideoPriorityBasedPolicyConfig';
import VideoQualityAdaptationPreference from './VideoQualityAdaptationPreference';

/** @internal */
class LinkMediaStats {
  constructor() {}
  bandwidthEstimateKbps: number = 0;
  usedBandwidthKbps: number = 0;
  packetsLost: number = 0;
  nackCount: number = 0;
  rttMs: number = 0;
}

/** @internal */
interface PolicyRates {
  targetDownlinkBitrate: number;
  chosenTotalBitrate: number;
  deltaToNextUpgrade: number;
}

/** @internal */
const enum RateProbeState {
  NotProbing = 'Not Probing',
  ProbePending = 'Probe Pending',
  Probing = 'Probing',
}

/** @internal */
const enum UseReceiveSet {
  NewOptimal,
  PreviousOptimal,
  PreProbe,
}

export default class VideoPriorityBasedPolicy implements VideoDownlinkBandwidthPolicy {
  private static readonly DEFAULT_BANDWIDTH_KBPS = 2800;
  private static readonly STARTUP_PERIOD_MS = 6000;
  private static readonly LARGE_RATE_CHANGE_TRIGGER_PERCENT = 20;
  private static readonly TARGET_RATE_CHANGE_TRIGGER_PERCENT = 15;
  private static readonly LOW_BITRATE_THRESHOLD_KBPS = 300;
  private static readonly MIN_TIME_BETWEEN_PROBE_MS = 5000;
  private static readonly MIN_TIME_BETWEEN_SUBSCRIBE_MS = 2000;
  // We apply exponentional backoff to probe attempts if they do not
  // succeed, so we need to set a reasonable maximum.
  private static readonly MAX_HOLD_BEFORE_PROBE_MS = 30000;
  private static readonly MAX_ALLOWED_PROBE_TIME_MS = 60000;
  // Occasionally we see that on unpause or upgrade we see a single packet lost
  // or two, even in completely unconstrained scenarios. We should look into
  // why this occurs on the backend, but for now we require a non-trivial
  // amount of packets lost to fail the probe. These could also be from
  // other senders given we don't yet use TWCC.
  private static readonly SPURIOUS_PACKET_LOST_THRESHOLD = 2;
  // See usage
  private static readonly USED_BANDWIDTH_OVERRIDE_BUFFER_KBPS = 100;

  protected tileController: VideoTileController | undefined;
  protected videoPreferences: VideoPreferences | undefined;
  protected defaultVideoPreferences: VideoPreferences | undefined;
  protected shouldPauseTiles: boolean = true;
  protected videoIndex: VideoStreamIndex;
  protected videoPreferencesUpdated: boolean;
  protected observerQueue: Set<VideoDownlinkObserver> = new Set<VideoDownlinkObserver>();
  private logCount: number;
  private optimalNonPausedReceiveStreams: VideoStreamDescription[];
  private optimalReceiveStreams: VideoStreamDescription[];
  private optimalReceiveSet: VideoStreamIdSet;
  private subscribedReceiveSet: VideoStreamIdSet;
  private subscribedReceiveStreams: VideoStreamDescription[];
  private preProbeReceiveStreams: VideoStreamDescription[];
  private preProbeNonPausedReceiveStreams: VideoStreamDescription[];
  private pausedStreamIds: VideoStreamIdSet;
  private pausedBwAttendeeIds: Set<string> = new Set<string>();
  private downlinkStats: LinkMediaStats;
  private prevDownlinkStats: LinkMediaStats;
  // This list only contains the `VideoStreamDescription` for sources
  // from attendees that we actually have preferences for.
  private previousStreamsWithPreference: VideoStreamDescription[];
  private rateProbeState: RateProbeState;
  private startupPeriod: boolean;
  private usingPrevTargetRate: boolean;
  private prevTargetRateKbps: number;
  // A target rate baseline to use to avoid changing the subscriptions until we see
  // a `TARGET_RATE_CHANGE_TRIGGER_PERCENT` change between this and the current target rate
  private targetRateBaselineForDeltaCheckKbps: number;
  private lastUpgradeRateKbps: number;
  private firstEstimateTimestamp: number;
  private lastSubscribeTimestamp: number;
  private timeBeforeAllowSubscribeMs: number;
  private probePendingStartTimestamp: number;
  private timeBeforeAllowProbeMs: number;
  private lastProbeTimestamp: number;
  private probeFailed: boolean;
  // When server side video adaption is enabled, We simply use `AllHighestVideoBandwidthPolicy` to populate stream IDs which
  // are still needed for the subscribe. It does not imply that we are overriding
  // the server side logic, as it will immediately be overwritten by the
  // values provided by `getVideoPreferences`
  private allHighestPolicy: AllHighestVideoBandwidthPolicy;
  private serverSideNetworkAdaption: ServerSideNetworkAdaption;
  // After video preference is updated, track if we acted accordingly (resubscribe or pass perefernce to server).
  // Required if enabled server side bandwith probing (w/ or w/o quality adaption).
  private pendingActionAfterUpdatedPreferences: boolean;
  private wantsResubscribeObserver: (() => void) | undefined = undefined;

  constructor(
    protected logger: Logger,
    private videoPriorityBasedPolicyConfig: VideoPriorityBasedPolicyConfig = VideoPriorityBasedPolicyConfig.Default
  ) {
    if (
      this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption ===
      ServerSideNetworkAdaption.Default
    ) {
      this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption =
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption;
    }
    this.reset();
  }

  reset(): void {
    // Self-attendee is not actually necessary in 'AllHighestVideoBandwidthPolicy' since it just passes it to
    // `highestQualityStreamFromEachGroupExcludingSelf` which itself doesn't need it as self attendees are not in the
    // index
    this.allHighestPolicy = new AllHighestVideoBandwidthPolicy('');
    this.optimalReceiveSet = new DefaultVideoStreamIdSet();
    this.optimalReceiveStreams = [];
    this.optimalNonPausedReceiveStreams = [];
    this.subscribedReceiveSet = new DefaultVideoStreamIdSet();
    this.subscribedReceiveStreams = [];
    this.videoPreferences = undefined;
    this.defaultVideoPreferences = undefined;
    this.shouldPauseTiles = true;
    this.pausedStreamIds = new DefaultVideoStreamIdSet();
    this.pausedBwAttendeeIds = new Set<string>();
    this.videoPreferencesUpdated = false;
    this.logCount = 0;
    this.startupPeriod = true;
    this.usingPrevTargetRate = false;
    this.rateProbeState = RateProbeState.NotProbing;
    this.firstEstimateTimestamp = 0;
    this.lastUpgradeRateKbps = 0;
    this.timeBeforeAllowSubscribeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS;
    this.lastProbeTimestamp = Date.now();
    this.timeBeforeAllowProbeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS;
    this.downlinkStats = new LinkMediaStats();
    this.prevDownlinkStats = new LinkMediaStats();
    this.probeFailed = false;
    this.serverSideNetworkAdaption = this.videoPriorityBasedPolicyConfig.serverSideNetworkAdaption;
    this.pendingActionAfterUpdatedPreferences = false;
  }

  bindToTileController(tileController: VideoTileController): void {
    this.tileController = tileController;
    this.logger.info('tileController bound');
  }

  setWantsResubscribeObserver?(observer: () => void): void {
    this.wantsResubscribeObserver = observer;
  }

  // This function allows setting preferences without the need to inherit from this class
  // which would require not using the internal keyword

  chooseRemoteVideoSources(preferences: VideoPreferences): void {
    if (this.videoPreferences?.equals(preferences)) {
      return;
    }
    this.videoPreferences = preferences?.clone();
    if (!serverSideNetworkAdaptionIsNoneOrDefault(this.serverSideNetworkAdaption)) {
      this.pendingActionAfterUpdatedPreferences = true;
      if (this.wantsResubscribeObserver !== undefined) {
        this.wantsResubscribeObserver();
        this.pendingActionAfterUpdatedPreferences = false;
      }
      if (
        this.serverSideNetworkAdaption ===
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      ) {
        const desiredVideoSources = new Array<VideoSource>();
        for (const preference of this.videoPreferences) {
          const source = new VideoSource();
          source.attendee = new Attendee();
          source.attendee.attendeeId = preference.attendeeId;
          desiredVideoSources.push(source);
        }
        this.allHighestPolicy.chooseRemoteVideoSources(desiredVideoSources);
        return;
      }
    }
    this.videoPreferencesUpdated = true;
    this.logger.info(
      `bwe: setVideoPreferences bwe: new preferences: ${JSON.stringify(preferences)}`
    );
    return;
  }

  updateIndex(videoIndex: VideoStreamIndex): void {
    this.videoIndex = videoIndex;
    if (
      this.serverSideNetworkAdaption ===
      ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
    ) {
      this.allHighestPolicy.updateIndex(videoIndex);
    }
    if (!this.videoPreferences) {
      this.updateDefaultVideoPreferences();
    }
  }

  private updateDefaultVideoPreferences(): void {
    const attendeeIds = new Set<string>();
    for (const stream of this.videoIndex.remoteStreamDescriptions()) {
      attendeeIds.add(stream.attendeeId);
    }

    const prefs = VideoPreferences.prepare();

    const numAttendees = attendeeIds.size;
    let targetDisplaySize = TargetDisplaySize.Maximum;

    if (numAttendees > 8) {
      targetDisplaySize = TargetDisplaySize.Low;
    } else if (numAttendees > 4) {
      targetDisplaySize = TargetDisplaySize.Medium;
    }

    for (const attendeeId of attendeeIds) {
      prefs.add(new VideoPreference(attendeeId, 1, targetDisplaySize));
    }
    this.defaultVideoPreferences = prefs.build();
  }

  updateMetrics(clientMetricReport: ClientMetricReport): void {
    if (!this.videoIndex || this.videoIndex.allStreams().empty()) {
      return;
    }
    this.prevDownlinkStats = this.downlinkStats;
    this.downlinkStats = new LinkMediaStats();
    const metricReport = clientMetricReport.getObservableMetrics();

    // availableIncomingBitrate is the standard stat but is not available in Firefox yet so only Safari for now.
    this.downlinkStats.bandwidthEstimateKbps = metricReport.availableIncomingBitrate / 1000;

    for (const ssrcStr in clientMetricReport.streamMetricReports) {
      const ssrc = Number.parseInt(ssrcStr, 10);
      const metrics = clientMetricReport.streamMetricReports[ssrc];
      if (metrics.direction === Direction.DOWNSTREAM && metrics.mediaType === MediaType.VIDEO) {
        // Only use video stream metrics
        if (metrics.currentMetrics.hasOwnProperty('nackCount')) {
          this.downlinkStats.nackCount += clientMetricReport.countPerSecond('nackCount', ssrc);
        }

        if (metrics.currentMetrics.hasOwnProperty('packetsLost')) {
          this.downlinkStats.packetsLost += clientMetricReport.countPerSecond('packetsLost', ssrc);
        }

        if (metrics.currentMetrics.hasOwnProperty('bytesReceived')) {
          this.downlinkStats.usedBandwidthKbps +=
            clientMetricReport.bitsPerSecond('bytesReceived', ssrc) / 1000;
        }
      }
    }
  }

  wantsResubscribe(): boolean {
    let wants = false;
    if (!serverSideNetworkAdaptionIsNoneOrDefault(this.serverSideNetworkAdaption)) {
      wants ||= this.pendingActionAfterUpdatedPreferences;
      if (
        this.serverSideNetworkAdaption ===
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      ) {
        return wants || this.allHighestPolicy.wantsResubscribe();
      }
    }
    this.calculateOptimalReceiveSet();
    wants ||= !this.subscribedReceiveSet.equal(this.optimalReceiveSet);
    return wants;
  }

  chooseSubscriptions(): VideoStreamIdSet {
    if (!serverSideNetworkAdaptionIsNoneOrDefault(this.serverSideNetworkAdaption)) {
      this.pendingActionAfterUpdatedPreferences = false;
      if (
        this.serverSideNetworkAdaption ===
        ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption
      ) {
        return this.allHighestPolicy.chooseSubscriptions();
      }
    }
    if (!this.subscribedReceiveSet.equal(this.optimalReceiveSet)) {
      this.lastSubscribeTimestamp = Date.now();
    }
    this.subscribedReceiveSet = this.optimalReceiveSet.clone();
    this.subscribedReceiveStreams = this.optimalReceiveStreams.slice();
    return this.subscribedReceiveSet.clone();
  }

  addObserver(observer: VideoDownlinkObserver): void {
    this.observerQueue.add(observer);
  }

  removeObserver(observer: VideoDownlinkObserver): void {
    this.observerQueue.delete(observer);
  }

  forEachObserver(observerFunc: (observer: VideoDownlinkObserver) => void): void {
    for (const observer of this.observerQueue) {
      observerFunc(observer);
    }
  }

  setVideoPriorityBasedPolicyConfigs(config: VideoPriorityBasedPolicyConfig): void {
    this.videoPriorityBasedPolicyConfig = config;
  }

  protected calculateOptimalReceiveStreams(): void {
    const chosenStreams: VideoStreamDescription[] = [];
    const remoteInfos: VideoStreamDescription[] = this.videoIndex.remoteStreamDescriptions();
    if (remoteInfos.length === 0 || this.videoPreferences?.isEmpty()) {
      this.optimalReceiveStreams = [];
      return;
    }

    const lastProbeState = this.rateProbeState;
    this.cleanBwPausedTiles(remoteInfos);
    this.handleAppPausedStreams(chosenStreams, remoteInfos);

    const attendeeIdToPreference = new Map<string, VideoPreference>();
    for (const preference of this.getCurrentVideoPreferences()) {
      attendeeIdToPreference.set(preference.attendeeId, preference);
    }
    // We can pre-emptively filter to just remote stream descriptions for remote video sources we already
    // have configuration for. We do not care about streams we aren't going to subscribe to.
    const remoteInfosWithPreference = remoteInfos.filter((stream: VideoStreamDescription) => {
      return attendeeIdToPreference.has(stream.attendeeId);
    });

    const sameStreamChoices = !this.streamsWithPreferenceDidChange(remoteInfosWithPreference);
    const noMajorChange = !this.startupPeriod && sameStreamChoices;

    // If no major changes then don't allow subscribes for the allowed amount of time
    if (
      noMajorChange &&
      Date.now() - this.lastSubscribeTimestamp < this.timeBeforeAllowSubscribeMs
    ) {
      return;
    }

    // Sort streams by bitrate ascending.
    remoteInfosWithPreference.sort((a, b) => {
      if (a.maxBitrateKbps === b.maxBitrateKbps) {
        return a.streamId - b.streamId;
      }
      return a.maxBitrateKbps - b.maxBitrateKbps;
    });

    // Convert 0 avg bitrates to max, handle special cases, and remove upgrades that downgrade resolution or framerate
    for (const info of remoteInfosWithPreference) {
      if (info.avgBitrateKbps === 0 || info.avgBitrateKbps > info.maxBitrateKbps) {
        // Content can be a special case
        if (info.attendeeId.endsWith(ContentShareConstants.Modality) && info.maxBitrateKbps < 100) {
          info.maxBitrateKbps = info.avgBitrateKbps;
        } else {
          info.avgBitrateKbps = info.maxBitrateKbps;
        }
      }
    }

    const streamIdsToRemove = new Set<number>();
    for (const preference of this.getCurrentVideoPreferences()) {
      const streamsForAttendees = remoteInfosWithPreference.filter(
        (description: VideoStreamDescription) => {
          return description.attendeeId === preference.attendeeId;
        }
      );
      if (streamsForAttendees.length < 3) {
        // If `streamsForAttendees.length` is 0, they are stale preference for remote video that no longer exists
        // if 1 or 2, there is nothing to filter out
        continue;
      }
      let maxFrameRate = 15;
      let maxPixels = 320 * 480;
      streamsForAttendees.forEach((stream: VideoStreamDescription) => {
        maxFrameRate = Math.max(maxFrameRate, stream.maxFrameRate);
        maxPixels = Math.max(maxPixels, stream.totalPixels());
      });
      streamsForAttendees.sort((a: VideoStreamDescription, b: VideoStreamDescription) => {
        if (
          preference.degradationPreference === VideoQualityAdaptationPreference.MaintainResolution
        ) {
          // This may seem counter-intuitive but given we want to upgrade resolution first, and framerate
          // last, we want to sort by framerate first, and resolution only if framerate is close.
          //
          // That way, e.g. the first three streams will all contain increases in resolution. We will skip any down
          // grades in resolution (i.e. to hop to a higher framerate stream) in the section below
          if (Math.abs(a.maxFrameRate - b.maxFrameRate) < 2) {
            return a.totalPixels() - b.totalPixels();
          }
          return a.maxFrameRate - b.maxFrameRate;
        } else if (
          preference.degradationPreference === VideoQualityAdaptationPreference.MaintainFramerate
        ) {
          // See note above, but swap resolution for framerate
          if (a.totalPixels() === b.totalPixels()) {
            return a.maxFrameRate - b.maxFrameRate;
          }
          return a.totalPixels() - b.totalPixels();
        } else {
          // In 'balanced' mode, we want a slight preference towards upgrading resolution first
          // when moving up the bitrate ladder, so we weigh the bitrate by a framerate
          // and resolution derived value that is tuned to be reasonable in most cases. This attempts to
          // mimic the diagrams in the guide.
          //
          // A higher constant makes the policy prefer resolution to framerate more at lower values
          const framerateExponentConstant = 5;
          // A higher constant here makes the policy prefer framerate to resolution more at higher values
          const resolutionBaseConstant = 2;
          const weighByFramerate = (stream: VideoStreamDescription): number => {
            return (
              stream.avgBitrateKbps *
              Math.pow(
                2,
                ((framerateExponentConstant * stream.maxFrameRate) / maxFrameRate) *
                  Math.pow(resolutionBaseConstant * 2, stream.totalPixels() / maxPixels)
              )
            );
          };
          return weighByFramerate(a) - weighByFramerate(b);
        }
      });

      let lastInfo = undefined;
      // Downgrades during recovery are unusual and jarring. Here we will strip out any (these should result in paths that
      // match those in the priority downlink policy guide).
      for (const info of streamsForAttendees) {
        if (lastInfo !== undefined) {
          if (
            (info.maxFrameRate < lastInfo.maxFrameRate &&
              Math.abs(lastInfo.maxFrameRate - info.maxFrameRate) > 2) ||
            info.totalPixels() < lastInfo.totalPixels()
          ) {
            streamIdsToRemove.add(info.streamId);
            continue;
          }
        }
        lastInfo = info;
      }
    }
    const filteredRemoteAttendeesWithPreference = remoteInfosWithPreference.filter(
      (info: VideoStreamDescription) => {
        return !streamIdsToRemove.has(info.streamId);
      }
    );
    this.logger.info(`Filtered to ${JSON.stringify(filteredRemoteAttendeesWithPreference)}`);

    const rates: PolicyRates = {
      targetDownlinkBitrate: 0,
      chosenTotalBitrate: 0,
      deltaToNextUpgrade: 0,
    };
    rates.targetDownlinkBitrate = this.determineTargetRate();

    const numberOfParticipants = this.subscribedReceiveSet.size();
    const currentEstimated = this.downlinkStats.bandwidthEstimateKbps;

    // Use videoPriorityBasedPolicyConfig to add additional delays based on network conditions
    const dontAllowSubscribe = !this.videoPriorityBasedPolicyConfig.allowSubscribe(
      numberOfParticipants,
      currentEstimated
    );

    // `priorityPolicy` assumes that we have sorted `filteredRemoteAttendeesWithPreference` in order of quality
    if (this.probeFailed) {
      // When probe failed, we set timeBeforeAllowSubscribeMs to 3x longer
      // Since we have passed the subscribe interval now, we will try to probe again
      this.probeFailed = false;
      // For the same reason above, reset time before allow subscribe to default
      this.timeBeforeAllowSubscribeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS;

      if (noMajorChange && dontAllowSubscribe) return;
    }

    const upgradeStream: VideoStreamDescription = this.priorityPolicy(
      rates,
      filteredRemoteAttendeesWithPreference,
      chosenStreams
    );

    const skipProbe = !serverSideNetworkAdaptionIsNoneOrDefault(this.serverSideNetworkAdaption);
    let subscriptionChoice = UseReceiveSet.NewOptimal;
    // Look for probing or override opportunities
    if (!skipProbe && !this.startupPeriod && sameStreamChoices) {
      if (this.rateProbeState === RateProbeState.Probing) {
        subscriptionChoice = this.handleProbe(chosenStreams, rates.targetDownlinkBitrate);
      } else if (rates.deltaToNextUpgrade !== 0) {
        subscriptionChoice = this.maybeOverrideOrProbe(chosenStreams, rates, upgradeStream);
      }
    } else {
      // If there was a change in streams to choose from, then cancel any probing or upgrades
      this.setProbeState(RateProbeState.NotProbing);
      this.lastUpgradeRateKbps = 0;
    }

    this.previousStreamsWithPreference = remoteInfosWithPreference;
    this.videoPreferencesUpdated = false;

    if (subscriptionChoice === UseReceiveSet.PreviousOptimal) {
      this.logger.info(`bwe: keepSameSubscriptions stats:${JSON.stringify(this.downlinkStats)}`);
      this.prevTargetRateKbps = rates.targetDownlinkBitrate;
      return;
    }
    if (subscriptionChoice === UseReceiveSet.PreProbe) {
      const subscribedRate = this.calculateSubscribeRate(this.preProbeNonPausedReceiveStreams);
      this.optimalReceiveStreams = this.preProbeReceiveStreams.slice();
      this.processBwPausedStreams(remoteInfosWithPreference, this.preProbeNonPausedReceiveStreams);
      this.logger.info('bwe: Use Pre-Probe subscription subscribedRate:' + subscribedRate);
      return;
    }

    this.optimalNonPausedReceiveStreams = chosenStreams.slice();
    const lastNumberPaused = this.pausedBwAttendeeIds.size;
    this.processBwPausedStreams(remoteInfosWithPreference, chosenStreams);

    if (
      this.logger.getLogLevel() <= LogLevel.INFO &&
      (this.logCount % 15 === 0 ||
        this.rateProbeState !== lastProbeState ||
        this.optimalReceiveStreams.length !== chosenStreams.length ||
        lastNumberPaused !== this.pausedBwAttendeeIds.size)
    ) {
      this.logger.info(this.policyStateLogStr(remoteInfos, rates.targetDownlinkBitrate));
      this.logCount = 0;
    }
    this.logCount++;

    this.prevTargetRateKbps = rates.targetDownlinkBitrate;
    this.optimalReceiveStreams = chosenStreams.slice();
  }

  protected calculateOptimalReceiveSet(): void {
    const streamSelectionSet = new DefaultVideoStreamIdSet();
    this.calculateOptimalReceiveStreams();
    for (const stream of this.optimalReceiveStreams) {
      streamSelectionSet.add(stream.streamId);
    }
    if (!this.optimalReceiveSet.equal(streamSelectionSet)) {
      const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
      this.logger.info(
        `bwe: new streamSelection: ${JSON.stringify(
          streamSelectionSet
        )} subscribedRate:${subscribedRate}`
      );
    }
    this.optimalReceiveSet = streamSelectionSet;
  }

  private determineTargetRate(): number {
    let targetBitrate = 0;

    const now = Date.now();
    // Startup phase handling.  During this period the estimate can be 0 or
    // could still be slowly hunting for a steady state.  This startup ramp up
    // can cause a series of subscribes which can be distracting. During this
    // time just use our configured default value
    if (this.downlinkStats.bandwidthEstimateKbps !== 0) {
      if (this.firstEstimateTimestamp === 0) {
        this.firstEstimateTimestamp = now;
      }

      // handle startup state where estimator is still converging.
      if (this.startupPeriod) {
        // Drop out of startup period if
        // - estimate is above default
        // - get packet loss and have a valid estimate
        // - startup period has expired and rate is not still increasing
        if (
          this.downlinkStats.bandwidthEstimateKbps >
            VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS ||
          this.downlinkStats.packetsLost > 0 ||
          (now - this.firstEstimateTimestamp > VideoPriorityBasedPolicy.STARTUP_PERIOD_MS &&
            this.downlinkStats.bandwidthEstimateKbps <=
              this.prevDownlinkStats.bandwidthEstimateKbps)
        ) {
          this.startupPeriod = false;
          this.prevTargetRateKbps = this.downlinkStats.bandwidthEstimateKbps;
        }
      }
      // If we are in the startup period and we haven't detected any packet loss, then
      // keep it at the default to let the estimation get to a steady state
      if (this.startupPeriod) {
        targetBitrate = VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS;
      } else {
        // We rely on our target bitrate being above what we are receiving to mark a probe as complete,
        // however in browsers, the estimate can heavily lag behind the actual receive rate, especially when low.
        //
        // To mitigate this we override with the actual estimate plus some buffer if we aren't seeing packet loss.
        if (
          this.rateProbeState === RateProbeState.Probing &&
          this.downlinkStats.usedBandwidthKbps > this.downlinkStats.bandwidthEstimateKbps &&
          this.downlinkStats.packetsLost < VideoPriorityBasedPolicy.SPURIOUS_PACKET_LOST_THRESHOLD
        ) {
          this.logger.info(
            `bwe: In probe state, overriding estimate ${this.downlinkStats.bandwidthEstimateKbps} with actual receive bitrate ${this.downlinkStats.usedBandwidthKbps}`
          );
          targetBitrate =
            this.downlinkStats.usedBandwidthKbps +
            VideoPriorityBasedPolicy.USED_BANDWIDTH_OVERRIDE_BUFFER_KBPS;
        } else {
          targetBitrate = this.downlinkStats.bandwidthEstimateKbps;
        }
      }
    } else {
      if (this.firstEstimateTimestamp === 0) {
        targetBitrate = VideoPriorityBasedPolicy.DEFAULT_BANDWIDTH_KBPS;
      } else {
        targetBitrate = this.prevTargetRateKbps;
      }
    }

    // Estimated downlink rate can follow actual bandwidth or fall for a short period of time
    // due to the absolute send time estimator incorrectly thinking that a delay in packets is
    // a precursor to packet loss.  We have seen too many false positives on this, so we
    // will ignore largish drops in the estimate if there is no packet loss
    if (
      !this.startupPeriod &&
      ((this.usingPrevTargetRate &&
        this.downlinkStats.bandwidthEstimateKbps < this.prevTargetRateKbps) ||
        this.downlinkStats.bandwidthEstimateKbps <
          (this.prevTargetRateKbps *
            (100 - VideoPriorityBasedPolicy.LARGE_RATE_CHANGE_TRIGGER_PERCENT)) /
            100 ||
        this.downlinkStats.bandwidthEstimateKbps <
          (this.downlinkStats.usedBandwidthKbps *
            VideoPriorityBasedPolicy.LARGE_RATE_CHANGE_TRIGGER_PERCENT) /
            100) &&
      this.downlinkStats.packetsLost === 0
    ) {
      // Set target to be the same as last
      this.logger.debug(() => {
        return 'bwe: ValidateRate: Using Previous rate ' + this.prevTargetRateKbps;
      });
      this.usingPrevTargetRate = true;
      targetBitrate = this.prevTargetRateKbps;
    } else {
      this.usingPrevTargetRate = false;
    }

    // Cap total receive bitrate at 15000 kbps
    if (targetBitrate > 15000) {
      this.logger.warn(
        'bwe: ' +
          targetBitrate +
          ' exceeds maximum limit (15000). Limit TargetDisplaySize with VideoPreferences to avoid this.'
      );
    }
    return Math.min(targetBitrate, 15000);
  }

  private setProbeState(newState: RateProbeState): boolean {
    if (this.rateProbeState === newState) {
      return false;
    }

    const now = Date.now();
    switch (newState) {
      case RateProbeState.NotProbing:
        this.probePendingStartTimestamp = 0;
        break;

      case RateProbeState.ProbePending:
        if (
          this.lastProbeTimestamp === 0 ||
          now - this.lastProbeTimestamp > VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS
        ) {
          this.probePendingStartTimestamp = now;
        } else {
          // Too soon to do a probe again
          return false;
        }
        break;

      case RateProbeState.Probing:
        if (now - this.probePendingStartTimestamp > this.timeBeforeAllowProbeMs) {
          this.lastProbeTimestamp = now;
          this.preProbeReceiveStreams = this.subscribedReceiveStreams.slice();
          this.preProbeNonPausedReceiveStreams = this.optimalNonPausedReceiveStreams;
          // Increase the time allowed until the next probe
          this.timeBeforeAllowProbeMs = Math.min(
            this.timeBeforeAllowProbeMs * 2,
            VideoPriorityBasedPolicy.MAX_HOLD_BEFORE_PROBE_MS
          );
        } else {
          // Too soon to do probe
          return false;
        }
        break;
    }

    this.logger.info('bwe: setProbeState to ' + newState + ' from ' + this.rateProbeState);
    this.rateProbeState = newState;
    return true;
  }

  // Upgrade the stream id from the appropriate group or add it if it wasn't already in the list.
  // Return the added amount of bandwidth
  private upgradeToStream(
    chosenStreams: VideoStreamDescription[],
    upgradeStream: VideoStreamDescription
  ): number {
    for (let i = 0; i < chosenStreams.length; i++) {
      if (chosenStreams[i].groupId === upgradeStream.groupId) {
        const diffRate = upgradeStream.avgBitrateKbps - chosenStreams[i].avgBitrateKbps;
        this.logger.info(
          'bwe: upgradeStream from ' + JSON.stringify(chosenStreams[i]) + ' to ' + upgradeStream
        );
        this.lastUpgradeRateKbps = diffRate;
        chosenStreams[i] = upgradeStream;
        return diffRate;
      }
    }

    // We are adding a stream and not upgrading.
    chosenStreams.push(upgradeStream);
    this.lastUpgradeRateKbps = upgradeStream.avgBitrateKbps;
    return this.lastUpgradeRateKbps;
  }

  // Do specific behavior while we are currently in probing state and metrics
  // indicate environment is still valid to do probing.
  // Return true if the caller should not change from the previous subscriptions.
  private handleProbe(
    chosenStreams: VideoStreamDescription[],
    targetDownlinkBitrate: number
  ): UseReceiveSet {
    // Don't allow probe to happen indefinitely
    if (Date.now() - this.lastProbeTimestamp > VideoPriorityBasedPolicy.MAX_ALLOWED_PROBE_TIME_MS) {
      this.logger.info(`bwe: Canceling probe due to timeout`);
      this.setProbeState(RateProbeState.NotProbing);
      return UseReceiveSet.NewOptimal;
    }

    if (this.downlinkStats.packetsLost > 0) {
      this.logger.info(`bwe: Probe encountering packets lost:${this.downlinkStats.packetsLost}`);
      // See comment above `VideoPriorityBasedPolicy.SPURIOUS_PACKET_LOST_THRESHOLD`
      if (
        this.downlinkStats.packetsLost > VideoPriorityBasedPolicy.SPURIOUS_PACKET_LOST_THRESHOLD
      ) {
        this.setProbeState(RateProbeState.NotProbing);
        this.logger.info(
          `bwe: Canceling probe due to packets lost:${this.downlinkStats.packetsLost}`
        );
        this.probeFailed = true;
        this.timeBeforeAllowSubscribeMs =
          Math.max(
            VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_SUBSCRIBE_MS,
            this.timeBeforeAllowSubscribeMs
          ) * 3;
        // packet lost indicates bad network and thus slowing down subscribing by extend delay by 3 times
        return UseReceiveSet.PreProbe;
      }
    }
    const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
    if (this.chosenStreamsSameAsLast(chosenStreams) || targetDownlinkBitrate > subscribedRate) {
      this.logger.info(`bwe: Probe successful`);
      // If target bitrate can sustain probe rate, then probe was successful.
      this.setProbeState(RateProbeState.NotProbing);
      // Reset the time allowed between probes since this was successful
      this.timeBeforeAllowProbeMs = VideoPriorityBasedPolicy.MIN_TIME_BETWEEN_PROBE_MS;
      return UseReceiveSet.NewOptimal;
    }

    return UseReceiveSet.PreviousOptimal;
  }

  private maybeOverrideOrProbe(
    chosenStreams: VideoStreamDescription[],
    rates: PolicyRates,
    upgradeStream: VideoStreamDescription
  ): UseReceiveSet {
    const sameSubscriptions = this.chosenStreamsSameAsLast(chosenStreams);
    let useLastSubscriptions = UseReceiveSet.NewOptimal;

    // We want to minimize thrashing between between low res and high res of different
    // participants due to avg bitrate fluctuations. If there hasn't been much of a change in estimated bandwidth
    // and the number of streams and their max rates are the same, then reuse the previous subscription
    const triggerPercent =
      rates.targetDownlinkBitrate > VideoPriorityBasedPolicy.LOW_BITRATE_THRESHOLD_KBPS
        ? VideoPriorityBasedPolicy.TARGET_RATE_CHANGE_TRIGGER_PERCENT
        : VideoPriorityBasedPolicy.TARGET_RATE_CHANGE_TRIGGER_PERCENT * 2;
    const minTargetBitrateDelta = (rates.targetDownlinkBitrate * triggerPercent) / 100;
    this.targetRateBaselineForDeltaCheckKbps =
      this.targetRateBaselineForDeltaCheckKbps !== undefined
        ? this.targetRateBaselineForDeltaCheckKbps
        : this.prevTargetRateKbps;
    if (
      !sameSubscriptions &&
      Math.abs(rates.targetDownlinkBitrate - this.targetRateBaselineForDeltaCheckKbps) <
        minTargetBitrateDelta
    ) {
      this.logger.info(
        'bwe: MaybeOverrideOrProbe: Reuse last decision based on delta rate. {' +
          JSON.stringify(this.subscribedReceiveSet) +
          `}`
      );
      useLastSubscriptions = UseReceiveSet.PreviousOptimal;
    } else {
      this.targetRateBaselineForDeltaCheckKbps = rates.targetDownlinkBitrate;
    }

    // If there has been packet loss, then reset to no probing state
    if (this.downlinkStats.packetsLost > this.prevDownlinkStats.packetsLost) {
      this.setProbeState(RateProbeState.NotProbing);
      this.lastUpgradeRateKbps = 0;
      return useLastSubscriptions;
    }

    if (sameSubscriptions || useLastSubscriptions === UseReceiveSet.PreviousOptimal) {
      // If planned subscriptions are same as last, then either move to probe pending state
      // or move to probing state if enough time has passed.
      switch (this.rateProbeState) {
        case RateProbeState.NotProbing:
          this.setProbeState(RateProbeState.ProbePending);
          break;

        case RateProbeState.ProbePending:
          if (this.setProbeState(RateProbeState.Probing)) {
            this.upgradeToStream(chosenStreams, upgradeStream);
            useLastSubscriptions = UseReceiveSet.NewOptimal;
          }
          break;
      }
    } else {
      this.setProbeState(RateProbeState.NotProbing);
    }

    return useLastSubscriptions;
  }

  // Utility function to find max rate of streams in current decision
  private calculateSubscribeRate(streams: VideoStreamDescription[]): number {
    let subscribeRate = 0;

    for (const stream of streams) {
      if (
        !this.pausedStreamIds.contain(stream.streamId) &&
        !this.pausedBwAttendeeIds.has(stream.attendeeId)
      ) {
        subscribeRate += stream.maxBitrateKbps;
      }
    }

    return subscribeRate;
  }

  private handleAppPausedStreams(
    chosenStreams: VideoStreamDescription[],
    remoteInfos: VideoStreamDescription[]
  ): void {
    if (!this.tileController) {
      this.logger.warn('tileController not found!');
      return;
    }
    this.pausedStreamIds = new DefaultVideoStreamIdSet();
    const remoteTiles = this.tileController.getAllRemoteVideoTiles();
    for (const tile of remoteTiles) {
      const state = tile.state();
      if (state.paused && !this.pausedBwAttendeeIds.has(state.boundAttendeeId)) {
        let j = remoteInfos.length;
        while (j--) {
          if (remoteInfos[j].attendeeId === state.boundAttendeeId) {
            this.logger.info(
              'bwe: removed paused attendee ' +
                state.boundAttendeeId +
                ' streamId: ' +
                remoteInfos[j].streamId
            );
            this.pausedStreamIds.add(remoteInfos[j].streamId);
            // Add the stream to the selection set to keep the tile around
            if (this.subscribedReceiveSet.contain(remoteInfos[j].streamId)) {
              chosenStreams.push(remoteInfos[j]);
            }
            remoteInfos.splice(j, 1);
          }
        }
      }
    }
  }

  private processBwPausedStreams(
    remoteInfos: VideoStreamDescription[],
    chosenStreams: VideoStreamDescription[]
  ): void {
    if (!this.tileController) {
      this.logger.warn('tileController not found!');
      return;
    }
    const preferences = this.getCurrentVideoPreferences();
    if (preferences && this.shouldPauseTiles) {
      const videoTiles = this.tileController.getAllVideoTiles();
      for (const preference of preferences) {
        const videoTile = this.getVideoTileForAttendeeId(
          preference.attendeeId,
          videoTiles
        ) as DefaultVideoTile;
        const paused = videoTile?.state().paused || false;
        if (!chosenStreams.some(stream => stream.attendeeId === preference.attendeeId)) {
          // We cannot rely on the existance of video tile to indicate that the source exists in the call
          // because tiles will not be added or removed until after a full renegotiation (i.e. it will
          // be behind the state provided by the index)
          const streamExists = remoteInfos.some(
            stream => stream.attendeeId === preference.attendeeId
          );
          if (videoTile && streamExists) {
            const info = this.optimalReceiveStreams.find(
              stream => stream.attendeeId === preference.attendeeId
            );
            if (info !== undefined) {
              if (!paused) {
                this.logger.info(
                  `bwe: pausing streamId ${info.streamId} attendee ${preference.attendeeId} due to bandwidth`
                );
                this.forEachObserver(observer => {
                  observer.tileWillBePausedByDownlinkPolicy(videoTile.id());
                });
                this.tileController.pauseVideoTile(videoTile.id());
              }
              chosenStreams.push(info);
            }
            this.pausedBwAttendeeIds.add(preference.attendeeId);
          } else if (streamExists) {
            // Create a tile for this participant if one doesn't already exist and mark it as paused
            // Don't include it in the chosen streams because we don't want to subscribe for it then have to pause it.
            const newTile = this.tileController.addVideoTile();
            newTile.bindVideoStream(preference.attendeeId, false, null, 0, 0, 0, null);
            this.forEachObserver(observer => {
              observer.tileWillBePausedByDownlinkPolicy(newTile.id());
            });
            newTile.pause();
            this.logger.info(
              `bwe: Created video tile ${newTile.id()} for bw paused attendee ${
                preference.attendeeId
              }`
            );
            this.pausedBwAttendeeIds.add(preference.attendeeId);
          }
        } else if (paused && this.pausedBwAttendeeIds.has(preference.attendeeId)) {
          this.logger.info(`bwe: unpausing attendee ${preference.attendeeId} due to bandwidth`);
          this.forEachObserver(observer => {
            observer.tileWillBeUnpausedByDownlinkPolicy(videoTile.id());
          });
          this.tileController.unpauseVideoTile(videoTile.id());
          this.pausedBwAttendeeIds.delete(preference.attendeeId);
        }
      }
    }
  }

  private cleanBwPausedTiles(remoteInfos: VideoStreamDescription[]): void {
    if (!this.tileController) {
      this.logger.warn('tileController not found!');
      return;
    }
    const tiles = this.tileController.getAllRemoteVideoTiles();
    const preferences = this.getCurrentVideoPreferences();
    for (const tile of tiles) {
      const state = tile.state();
      if (!state.boundVideoStream) {
        if (!remoteInfos.some(stream => stream.attendeeId === state.boundAttendeeId)) {
          this.tileController.removeVideoTile(state.tileId);
          this.logger.info(
            `bwe: Removed video tile ${state.tileId} for bw paused attendee ${state.boundAttendeeId}`
          );
        } else if (
          preferences !== undefined &&
          !preferences.some(pref => pref.attendeeId === state.boundAttendeeId)
        ) {
          this.tileController.removeVideoTile(state.tileId);
        }
      }
    }
  }

  // `remoteInfos` is assumed to be provided in order of increasing quality
  private priorityPolicy(
    rates: PolicyRates,
    remoteInfos: VideoStreamDescription[],
    chosenStreams: VideoStreamDescription[]
  ): VideoStreamDescription {
    let upgradeStream: VideoStreamDescription;
    const videoPreferences: VideoPreferences = this.getCurrentVideoPreferences();

    const highestPriority = videoPreferences.highestPriority();
    let nextPriority;
    let priority = highestPriority;
    while (priority !== -1) {
      nextPriority = -1;
      for (const preference of videoPreferences) {
        if (preference.priority === priority) {
          // First subscribe to at least low rate
          for (const info of remoteInfos) {
            if (info.attendeeId === preference.attendeeId) {
              if (!chosenStreams.some(stream => stream.groupId === info.groupId)) {
                if (rates.chosenTotalBitrate + info.avgBitrateKbps <= rates.targetDownlinkBitrate) {
                  chosenStreams.push(info);
                  rates.chosenTotalBitrate += info.avgBitrateKbps;
                } else if (rates.deltaToNextUpgrade === 0) {
                  // Keep track of step to next upgrade
                  rates.deltaToNextUpgrade = info.avgBitrateKbps;
                  upgradeStream = info;
                }
              }
            }
          }
        } else {
          if (preference.priority > priority) {
            nextPriority = preference.priority;
            break;
          }
        }
      }

      // Now try to upgrade all attendee's with this priority
      for (const preference of videoPreferences) {
        if (preference.priority === priority) {
          for (const info of remoteInfos) {
            if (info.attendeeId === preference.attendeeId) {
              const index = chosenStreams.findIndex(
                stream =>
                  stream.groupId === info.groupId &&
                  stream.maxBitrateKbps <= info.maxBitrateKbps &&
                  stream.avgBitrateKbps < info.avgBitrateKbps
              );
              if (index !== -1) {
                const increaseKbps = info.avgBitrateKbps - chosenStreams[index].avgBitrateKbps;
                if (
                  this.hasSimulcastStreams(remoteInfos, info.attendeeId, info.groupId) &&
                  this.canUpgrade(
                    info.avgBitrateKbps,
                    preference.targetSize,
                    preference.targetSizeToBitrateKbps(preference.targetSize),
                    info.attendeeId.endsWith(ContentShareConstants.Modality)
                  )
                ) {
                  this.logger.info(
                    `bwe: attendee: ${info.attendeeId} group: ${
                      info.groupId
                    } has simulcast and can upgrade avgBitrate: ${
                      info.avgBitrateKbps
                    } target: ${preference.targetSizeToBitrateKbps(
                      preference.targetSize
                    )} targetTotalBitrate: ${rates.targetDownlinkBitrate}`
                  );
                  if (rates.chosenTotalBitrate + increaseKbps <= rates.targetDownlinkBitrate) {
                    rates.chosenTotalBitrate += increaseKbps;
                    chosenStreams[index] = info;
                  } else if (rates.deltaToNextUpgrade === 0) {
                    // Keep track of step to next upgrade
                    rates.deltaToNextUpgrade = increaseKbps;
                    upgradeStream = info;
                  }
                } else {
                  this.logger.info('bwe: cannot upgrade stream quality beyond target size');
                }
              }
            }
          }
        } else {
          if (preference.priority > priority) {
            break;
          }
        }
      }

      // If we haven't subscribed to the highest rate of the top priority videos then
      // do not subscribe to any other sources
      if (priority === highestPriority && rates.deltaToNextUpgrade !== 0) {
        break;
      }
      priority = nextPriority;
    }
    return upgradeStream;
  }

  private getVideoTileForAttendeeId(attendeeId: string, videoTiles: VideoTile[]): VideoTile {
    for (const tile of videoTiles) {
      const state = tile.state();
      if (state.boundAttendeeId === attendeeId) {
        return tile;
      }
    }
    return null;
  }

  private canUpgrade(
    bitrateKbps: number,
    targetResolution: TargetDisplaySize,
    targetBitrateKbps: number,
    isContent: boolean
  ): boolean {
    let canUpgrade = false;
    // For both video and content, we want to interpret `TargetDisplaySize.High` as a request for the best quality
    // video, and should ignore the value of the target bitrate.
    if (targetResolution === TargetDisplaySize.High) {
      // For both video and content, we want to interpret `TargetDisplaySize.High` as a request for the best quality
      // video, and should ignore the value of the target bitrate.
      canUpgrade = true;
    } else if (!isContent && bitrateKbps <= targetBitrateKbps) {
      // For content share, even if the higher quality stream has a high max bitrate of 1200 kbps for example
      // the avg bitrate can be way lower so have to make sure that we do not update to a higher bitrate than the
      // target value (i.e. if `targetResolution === TargetDisplaySize.Low`).
      //
      // This does not apply to video as video uplink bandwidth could change the max bitrate value without resubscribing
      // so the max bitrate value might not be up-to-date on the downlink side. Also in the case of video, the avg
      // bitrate is close to the actual max bitrate.
      canUpgrade = true;
    } else if (
      isContent &&
      targetResolution === TargetDisplaySize.Medium &&
      bitrateKbps <= targetBitrateKbps
    ) {
      // If the target resolution is medium then fall back to use avg bitrate as video.
      canUpgrade = true;
    }
    if (canUpgrade) {
      this.logger.info(
        `bwe: canUpgrade: bitrateKbps: ${bitrateKbps} targetBitrateKbps: ${targetBitrateKbps}`
      );
      return true;
    }
    this.logger.info(
      `bwe: cannot Upgrade: bitrateKbps: ${bitrateKbps} targetBitrateKbps: ${targetBitrateKbps}`
    );
    return false;
  }

  private hasSimulcastStreams(
    remoteInfos: VideoStreamDescription[],
    attendeeId: string,
    groupId: number
  ): boolean {
    let streamCount = 0;
    for (const info of remoteInfos) {
      if (info.attendeeId === attendeeId && info.groupId === groupId) {
        streamCount++;
      }
    }
    this.logger.info(
      `bwe: attendeeId: ${attendeeId} groupId: ${groupId} hasSimulcastStreams: streamCount: ${streamCount}`
    );
    return streamCount > 1;
  }

  private streamsWithPreferenceDidChange(remoteInfos: VideoStreamDescription[]): boolean {
    if (
      this.previousStreamsWithPreference === undefined ||
      remoteInfos.length !== this.previousStreamsWithPreference.length ||
      this.videoPreferencesUpdated === true
    ) {
      return true;
    }

    for (const info of remoteInfos) {
      const infoMatch = this.previousStreamsWithPreference.find(
        prevInfo =>
          prevInfo.groupId === info.groupId &&
          prevInfo.streamId === info.streamId &&
          prevInfo.maxBitrateKbps === info.maxBitrateKbps
      );
      if (infoMatch === undefined) {
        return true;
      }
    }

    return false;
  }

  private chosenStreamsSameAsLast(chosenStreams: VideoStreamDescription[]): boolean {
    if (this.optimalNonPausedReceiveStreams.length !== chosenStreams.length) {
      return false;
    }
    for (const lastStream of this.optimalNonPausedReceiveStreams) {
      if (!chosenStreams.some(stream => stream.streamId === lastStream.streamId)) {
        return false;
      }
    }

    return true;
  }

  private policyStateLogStr(
    remoteInfos: VideoStreamDescription[],
    targetDownlinkBitrate: number
  ): string {
    const subscribedRate = this.calculateSubscribeRate(this.optimalReceiveStreams);
    const optimalReceiveSet = {
      targetBitrate: targetDownlinkBitrate,
      subscribedRate: subscribedRate,
      probeState: this.rateProbeState,
      startupPeriod: this.startupPeriod,
    };

    // Reduced remote info logging:
    let remoteInfoStr = `remoteInfos: [`;
    for (const info of remoteInfos) {
      remoteInfoStr += `{grpId:${info.groupId} strId:${info.streamId} maxBr:${info.maxBitrateKbps} avgBr:${info.avgBitrateKbps}}, `;
    }
    remoteInfoStr += `]`;

    let logString =
      `bwe: optimalReceiveSet ${JSON.stringify(optimalReceiveSet)}\n` +
      `bwe:   prev ${JSON.stringify(this.prevDownlinkStats)}\n` +
      `bwe:   now  ${JSON.stringify(this.downlinkStats)}\n` +
      `bwe:   ${remoteInfoStr}\n`;

    if (this.pausedStreamIds.size() > 0 || this.pausedBwAttendeeIds.size > 0) {
      logString += `bwe:   paused: app stream ids ${JSON.stringify(
        this.pausedStreamIds
      )}  bw attendees { ${Array.from(this.pausedBwAttendeeIds).join(' ')} }\n`;
    }

    if (this.videoPreferences) {
      logString += `bwe:   preferences: ${JSON.stringify(this.videoPreferences)}`;
    } else {
      logString += `bwe:   default preferences: ${JSON.stringify(this.defaultVideoPreferences)}`;
    }
    return logString;
  }

  protected getCurrentVideoPreferences(): VideoPreferences {
    return this.videoPreferences || this.defaultVideoPreferences;
  }

  getServerSideNetworkAdaption(): ServerSideNetworkAdaption {
    return this.serverSideNetworkAdaption;
  }

  setServerSideNetworkAdaption(adaption: ServerSideNetworkAdaption): void {
    this.serverSideNetworkAdaption = adaption;
    this.setProbeState(RateProbeState.NotProbing); // In case we were probing
  }

  supportedServerSideNetworkAdaptions(): ServerSideNetworkAdaption[] {
    return [
      ServerSideNetworkAdaption.None,
      ServerSideNetworkAdaption.BandwidthProbing,
      ServerSideNetworkAdaption.BandwidthProbingAndRemoteVideoQualityAdaption,
    ];
  }

  getVideoPreferences(): VideoPreferences {
    let preferences = this.getCurrentVideoPreferences();
    if (!preferences) {
      const dummyPreferences = VideoPreferences.prepare();
      // Can't be undefined, occasionally the audio video controller
      // will call this function before the first index is received
      preferences = dummyPreferences.build();
    }
    return preferences;
  }

  wantsAllTemporalLayersInIndex(): boolean {
    return true;
  }
}
