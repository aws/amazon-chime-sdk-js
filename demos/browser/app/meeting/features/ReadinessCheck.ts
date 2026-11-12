// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CheckAudioConnectivityFeedback,
  CheckAudioInputFeedback,
  CheckAudioOutputFeedback,
  CheckCameraResolutionFeedback,
  CheckContentShareConnectivityFeedback,
  CheckNetworkTCPConnectivityFeedback,
  CheckNetworkUDPConnectivityFeedback,
  CheckVideoConnectivityFeedback,
  CheckVideoInputFeedback,
  ConsoleLogger,
  DefaultBrowserBehavior,
  DefaultDeviceController,
  DefaultMeetingReadinessChecker,
  DefaultMeetingSession,
  LogLevel,
  MeetingReadinessChecker,
  MeetingReadinessCheckerConfiguration,
  MeetingSession,
  MeetingSessionConfiguration,
} from 'amazon-chime-sdk-js';
import { v4 as uuidv4 } from 'uuid';

import ApiClient from '../session/ApiClient';
import SessionLogging from '../session/SessionLogging';
import { STRINGS } from '../strings';
import { runAction } from '../ui/actions';
import Dialog from '../ui/Dialog';
import { byId, clear, el } from '../ui/dom';
import { iconElement } from '../ui/icons';

export interface ReadinessCheckContext {
  region(): string;
  regionName(region: string): string;
  developerMode(): boolean;
  logLevel(): LogLevel;
}

/** Silent-stream mic choice (developer mode); Firefox cannot make one. */
const NO_AUDIO = 'no-audio';

/** Re-test interval. The SDK default, 3 s, rounds each 0.3 s meeting start and stop up to 3 s. */
const POLL_MS = 250;

const RESOLUTIONS: [string, number, number][] = [
  ['camera-test1', 640, 480],
  ['camera-test2', 1280, 720],
  ['camera-test3', 1920, 1080],
];

/** Result elements; `integration/pages/MeetingReadinessCheckerPage.js` reads them by id. */
const RESULT_IDS = [
  'speaker-test',
  'mic-test',
  'video-test',
  ...RESOLUTIONS.map(([id]) => id),
  'networkudp-test',
  'networktcp-test',
  'audioconnectivity-test',
  'videoconnectivity-test',
  'contentshare-test',
];

interface Run {
  meeting: string;
  session: MeetingSession;
  checker: MeetingReadinessChecker;
  logging: SessionLogging;
  hear?: (heard: boolean) => void;
}

/** Runs the SDK readiness checker in a meeting of its own, so the meeting being joined is never touched. */
export default class ReadinessCheck {
  private readonly dialog = Dialog.byId('readiness-dialog');
  private readonly header = byId('readiness-header');
  private readonly results = byId('readiness-results');
  private readonly error = byId('readiness-error');
  private readonly summary = byId('readiness-summary');
  private readonly summaryText = byId('readiness-summary-text');
  private readonly meter = byId('readiness-meter');
  private readonly meterBar = byId('readiness-meter-bar');
  private readonly audioOutput = byId<HTMLSelectElement>('readiness-audio-output');
  private readonly audioInput = byId<HTMLSelectElement>('readiness-audio-input');
  private readonly videoInput = byId<HTMLSelectElement>('readiness-video-input');
  private readonly runAgainButton = byId<HTMLButtonElement>('readiness-run-again');
  private readonly speakerButton = byId<HTMLButtonElement>('speakertest-button');
  private readonly speakerFeedback = byId('speaker-user-feedback');
  private readonly contentShareButton = byId<HTMLButtonElement>('contentshare-button');
  private readonly speakerAudio = byId<HTMLAudioElement>('speaker-test-audio-element');
  private deviceController: DefaultDeviceController | undefined;
  private run: Run | undefined;
  private checking = false;

  constructor(
    private readonly api: ApiClient,
    private readonly context: ReadinessCheckContext
  ) {
    this.speakerButton.addEventListener('click', () =>
      runAction(() => this.checkSpeaker(), STRINGS.contextReadinessCheck)
    );
    byId('speaker-yes').addEventListener('click', () => this.run?.hear?.(true));
    byId('speaker-no').addEventListener('click', () => this.run?.hear?.(false));
    this.contentShareButton.addEventListener('click', () =>
      runAction(() => this.checkContentShare(), STRINGS.contextReadinessCheck)
    );
    this.runAgainButton.addEventListener('click', () =>
      runAction(() => this.rerun(), STRINGS.contextReadinessCheck)
    );
    this.audioInput.addEventListener('change', () =>
      runAction(() => this.rerun(), STRINGS.contextReadinessCheck)
    );
    this.videoInput.addEventListener('change', () =>
      runAction(() => this.rerun(), STRINGS.contextReadinessCheck)
    );
    this.audioOutput.addEventListener('change', () => this.resetSpeaker());
    this.dialog.onClose(() => void this.finish());
  }

  open(): void {
    this.reset();
    this.dialog.open();
    void this.listDevices().then(async listed => {
      if (listed) {
        await this.start();
      }
    });
  }

  private reset(): void {
    this.header.textContent = STRINGS.readinessTitle;
    this.error.hidden = true;
    this.runAgainButton.hidden = true;
    this.speakerButton.disabled = true;
    this.contentShareButton.disabled = true;
    this.setPickersEnabled(false);
    this.resetResults(RESULT_IDS);
    this.resetSpeaker();
    this.resetContentShare();
    const region = this.context.region();
    byId('readiness-region').textContent = STRINGS.readinessRegion(this.context.regionName(region));
  }

  private resetResults(ids: string[]): void {
    for (const id of ids) {
      const element = byId(id);
      element.dataset.state = 'idle';
      element.dataset.result = '';
      element.textContent = element.dataset.label ?? STRINGS.readinessWaiting;
      element.title = '';
    }
    this.updateSummary();
  }

  private resetSpeaker(): void {
    this.run?.hear?.(false);
    this.speakerFeedback.hidden = true;
    this.speakerButton.hidden = false;
    this.speakerButton.textContent = STRINGS.readinessPlayTone;
    byId('speaker-test').hidden = true;
    this.resetResults(['speaker-test']);
  }

  private resetContentShare(): void {
    this.contentShareButton.hidden = false;
    byId('contentshare-test').hidden = true;
    this.resetResults(['contentshare-test']);
  }

  private setPickersEnabled(enabled: boolean): void {
    for (const select of [this.audioOutput, this.audioInput, this.videoInput]) {
      select.disabled = !enabled;
    }
  }

  private async listDevices(): Promise<boolean> {
    const logger = new ConsoleLogger('SDK', this.context.logLevel());
    this.deviceController ??= new DefaultDeviceController(logger);
    const controller = this.deviceController;
    // One list at a time: the first unlocks the device names that the others then read.
    const inputs = await controller.listAudioInputDevices();
    const cameras = await controller.listVideoInputDevices();
    const outputs = await controller.listAudioOutputDevices();
    if (controller !== this.deviceController) {
      return false;
    }
    this.fill(this.audioInput, inputs, STRINGS.microphone);
    if (this.context.developerMode() && !new DefaultBrowserBehavior().hasFirefoxWebRTC()) {
      this.audioInput.append(el('option', { value: NO_AUDIO, text: STRINGS.readinessNoAudio }));
    }
    this.fill(this.videoInput, cameras, STRINGS.camera);
    this.fill(this.audioOutput, outputs, STRINGS.speaker);
    if (outputs.length === 0) {
      // Browsers that cannot pick an output list none; the default output still plays the tone.
      this.audioOutput.append(el('option', { value: '', text: STRINGS.defaultSpeaker }));
    }
    this.audioOutput.disabled = false;
    return true;
  }

  private fill(select: HTMLSelectElement, devices: MediaDeviceInfo[], generic: string): void {
    clear(select);
    devices.forEach((device, index) =>
      select.append(
        el('option', {
          value: device.deviceId,
          text: device.label || STRINGS.genericDevice(generic, index + 1),
        })
      )
    );
  }

  private async start(): Promise<void> {
    const controller = this.deviceController;
    if (!controller || this.run) {
      return;
    }
    this.error.hidden = true;
    this.runAgainButton.hidden = true;
    this.header.textContent = STRINGS.readinessRunning;
    const meeting = `READINESS_CHECKER-${uuidv4()}`;
    let run: Run;
    try {
      const { JoinInfo } = await this.api.join({
        meeting,
        name: `READINESS_CHECKER-${uuidv4()}`,
        region: this.context.region(),
        echoReduction: false,
        videoMaxResolution: 'HD',
        contentMaxResolution: 'FHD',
        maxAttendeeCount: null,
      });
      const configuration = new MeetingSessionConfiguration(JoinInfo.Meeting, JoinInfo.Attendee);
      configuration.attendeePresenceTimeoutMs = 15000;
      const logging = new SessionLogging(this.api, this.context.logLevel);
      const logger = await logging.createLogger(configuration);
      const session = new DefaultMeetingSession(configuration, logger, controller);
      run = {
        meeting,
        session,
        checker: new DefaultMeetingReadinessChecker(logger, session, checkerConfiguration()),
        logging,
      };
      byId('readiness-meeting-id').textContent = configuration.meetingId ?? '';
    } catch (error) {
      this.header.textContent = STRINGS.readinessTitle;
      this.error.textContent = (error as Error).message;
      this.error.hidden = false;
      this.runAgainButton.hidden = false;
      this.setPickersEnabled(true);
      return;
    }
    if (!this.dialog.element.open) {
      await this.endRun(run);
      return;
    }
    this.run = run;
    this.speakerButton.disabled = false;
    await this.runChecks(run);
  }

  private async rerun(): Promise<void> {
    const run = this.run;
    if (!run) {
      await this.start();
      return;
    }
    if (this.checking) {
      return;
    }
    this.resetResults(RESULT_IDS.filter(id => id !== 'speaker-test' && id !== 'contentshare-test'));
    this.header.textContent = STRINGS.readinessRunning;
    await this.runChecks(run);
  }

  private async runChecks(run: Run): Promise<void> {
    const { checker } = run;
    const camera = this.videoInput.value;
    this.checking = true;
    this.runAgainButton.hidden = true;
    this.contentShareButton.disabled = true;
    this.setPickersEnabled(false);
    this.audioOutput.disabled = false;
    const checks: [string, () => Promise<string>][] = [
      [
        'mic-test',
        async () => CheckAudioInputFeedback[await checker.checkAudioInput(this.microphone(run))],
      ],
      ['video-test', async () => CheckVideoInputFeedback[await checker.checkVideoInput(camera)]],
      ...RESOLUTIONS.map(([id, width, height]): [string, () => Promise<string>] => [
        id,
        async () =>
          CheckCameraResolutionFeedback[await checker.checkCameraResolution(camera, width, height)],
      ]),
      [
        'networkudp-test',
        async () =>
          CheckNetworkUDPConnectivityFeedback[await checker.checkNetworkUDPConnectivity()],
      ],
      [
        'networktcp-test',
        async () =>
          CheckNetworkTCPConnectivityFeedback[await checker.checkNetworkTCPConnectivity()],
      ],
      [
        'audioconnectivity-test',
        async () =>
          CheckAudioConnectivityFeedback[
            await checker.checkAudioConnectivity(this.microphone(run))
          ],
      ],
      [
        'videoconnectivity-test',
        async () => CheckVideoConnectivityFeedback[await checker.checkVideoConnectivity(camera)],
      ],
    ];
    try {
      for (const [id, check] of checks) {
        if (this.run !== run) {
          return;
        }
        this.show(id, null);
        const result = await check();
        if (this.run === run) {
          this.show(id, result);
        }
      }
    } finally {
      this.checking = false;
    }
    if (this.run === run) {
      this.setPickersEnabled(true);
      this.contentShareButton.disabled = false;
      this.runAgainButton.hidden = false;
      this.updateSummary();
    }
  }

  private microphone(run: Run): string | MediaStream {
    if (this.audioInput.value !== NO_AUDIO) {
      return this.audioInput.value;
    }
    // Presence waits for audio from the attendee, which a silent stream never sends.
    run.session.configuration.attendeePresenceTimeoutMs = 0;
    return DefaultDeviceController.getAudioContext().createMediaStreamDestination().stream;
  }

  private async checkSpeaker(): Promise<void> {
    const run = this.run;
    if (!run) {
      return;
    }
    this.speakerButton.hidden = true;
    byId('speaker-test').hidden = false;
    this.speakerFeedback.hidden = false;
    this.show('speaker-test', null);
    const result = await run.checker.checkAudioOutput(
      this.audioOutput.value,
      () => new Promise<boolean>(resolve => (run.hear = resolve)),
      this.speakerAudio
    );
    run.hear = undefined;
    if (this.run !== run || byId('speaker-test').hidden) {
      return;
    }
    this.speakerFeedback.hidden = true;
    this.show('speaker-test', CheckAudioOutputFeedback[result]);
    this.speakerButton.textContent = STRINGS.readinessPlayAgain;
    this.speakerButton.hidden = false;
  }

  private async checkContentShare(): Promise<void> {
    const run = this.run;
    if (!run) {
      return;
    }
    this.contentShareButton.hidden = true;
    byId('contentshare-test').hidden = false;
    this.show('contentshare-test', null);
    const result = await run.checker.checkContentShareConnectivity();
    if (this.run === run) {
      this.show('contentshare-test', CheckContentShareConnectivityFeedback[result]);
    }
  }

  /** A null result marks the check as running. */
  private show(id: string, result: string | null): void {
    const element = byId(id);
    const passed = result === 'Succeeded';
    const label = element.dataset.label;
    const state = result === null ? 'running' : passed ? 'passed' : 'failed';
    element.dataset.state = state;
    element.dataset.result = result ?? '';
    const text =
      result === null
        ? (label ?? STRINGS.readinessChecking)
        : passed
          ? (label ?? STRINGS.readinessPassed)
          : [label, result].filter(Boolean).join(' ');
    element.replaceChildren(
      ...(state === 'running' ? [] : [iconElement(passed ? 'check' : 'triangleAlert')]),
      text
    );
    element.title = result ?? '';
    this.updateSummary();
  }

  private updateSummary(): void {
    const rows = [...this.results.querySelectorAll('.readiness-row')].map(row => [
      ...row.querySelectorAll<HTMLElement>('.readiness-result'),
    ]);
    const isDone = (results: HTMLElement[]): boolean =>
      results.every(
        element => !element.hidden && ['passed', 'failed'].includes(element.dataset.state ?? '')
      );
    const done = rows.filter(isDone);
    const failed = done.filter(results =>
      results.some(element => element.dataset.state === 'failed')
    ).length;
    const finished = done.length === rows.length;
    const yourTurn = !finished && !this.checking && !!this.run;
    const state = !finished ? 'running' : failed > 0 ? 'failed' : 'passed';
    this.summary.dataset.state = state;
    this.summaryText.replaceChildren(
      ...(state === 'running' ? [] : [iconElement(failed > 0 ? 'triangleAlert' : 'circleCheck')]),
      finished
        ? failed > 0
          ? STRINGS.readinessNeedAttention(failed)
          : STRINGS.readinessAllPassed(done.length)
        : yourTurn
          ? STRINGS.readinessYourTurn(done.length, rows.length, this.pendingSteps())
          : STRINGS.readinessProgress(done.length, rows.length)
    );
    this.meter.setAttribute('aria-valuemax', String(rows.length));
    this.meter.setAttribute('aria-valuenow', String(done.length));
    this.meterBar.style.width = `${(100 * done.length) / rows.length}%`;
    if (finished || yourTurn) {
      this.header.textContent = finished ? STRINGS.readinessDone : STRINGS.readinessTitle;
    }
  }

  private pendingSteps(): string[] {
    const pending = (id: string): boolean =>
      !['passed', 'failed'].includes(byId(id).dataset.state ?? '');
    return [
      ...(pending('speaker-test') ? [STRINGS.readinessPlayToneStep] : []),
      ...(pending('contentshare-test') ? [STRINGS.readinessShareStep] : []),
    ];
  }

  private async finish(): Promise<void> {
    const run = this.run;
    this.run = undefined;
    const controller = this.deviceController;
    this.deviceController = undefined;
    this.speakerButton.textContent = STRINGS.readinessPlayTone;
    if (run) {
      run.hear?.(false);
      await this.endRun(run);
    }
    await controller?.destroy();
  }

  private async endRun(run: Run): Promise<void> {
    run.session.audioVideo.stop();
    try {
      await this.api.endMeeting(run.meeting);
    } catch {
      // The test meeting also ends on its own once nobody is in it.
    }
    run.logging.teardown();
  }
}

function checkerConfiguration(): MeetingReadinessCheckerConfiguration {
  const configuration = new MeetingReadinessCheckerConfiguration();
  configuration.waitDurationMs = POLL_MS;
  return configuration;
}
