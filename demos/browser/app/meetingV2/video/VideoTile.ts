// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class DemoVideoTile extends HTMLElement {
  innerHTMLToInject = `
  <video class="video-tile-video"></video>
  <div class="video-tile-attendee-id"></div>
  <div class="video-tile-nameplate"></div>
  <div class="video-tile-pause-state"></div>
  <div class="button-video-tile-config" role="group">
    <button type="button" class="btn btn-success dropdown-toggle button-video-tile-config-drop" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Video Tile Settings"><%= require('../../../node_modules/open-iconic/svg/cog.svg') %></button>
    <div class="dropdown-menu dropdown-menu-right dropdown-video-tile-config" aria-labelledby="button-video-tile-config-drop" style="position: absolute; transform: translate3d(0px, 38px, 0px); top: 0px; left: 0px; will-change: transform;">
      <a class="dropdown-item video-tile-pause">Pause</a>
      <div class="dropdown-divider"></div>
      <h6 class="dropdown-header target-resolution-header">Target Resolution</h6>
      <form class="btn-group btn-group-toggle video-tile-config-toggle target-resolution-toggle" data-toggle="buttons">
        <label class="btn btn-secondary">
          <input type="radio" name="level" value="low" autocomplete="off">Low
        </label>
        <label class="btn btn-secondary">
          <input type="radio" name="level" value="medium" autocomplete="off">Medium
        </label>
        <label class="btn btn-secondary active">
          <input type="radio" name="level" value="high" autocomplete="off" checked>High
        </label>
      </form>
      <h6 class="dropdown-header video-priority-header">Video Priority</h6>
      <form class="btn-group btn-group-toggle video-tile-config-toggle video-priority-toggle" data-toggle="buttons">
        <label class="btn btn-secondary">
          <input type="radio" name="level" value="low" autocomplete="off">Low
        </label>
        <label class="btn btn-secondary active">
          <input type="radio" name="level" value="medium" autocomplete="off" checked>Medium
        </label>
        <label class="btn btn-secondary">
            <input type="radio" name="level" value="high" autocomplete="off">High
        </label>
      </form>
      <h6 class="dropdown-header video-priority-disable-pause-header">Pause for poor netowrk</h6>
      <form class="btn-group btn-group-toggle video-tile-config-toggle video-priority-disable-pause-toggle" data-toggle="buttons">
        <label class="btn btn-secondary">
          <input type="radio" name="level" value="off" autocomplete="off">Off
        </label>
        <label class="btn btn-secondary active">
          <input type="radio" name="level" value="medium" autocomplete="off" checked>On
        </label>
      </form>
    </div>
  </div>
`;

  rootDiv: HTMLElement | undefined = undefined;

  public set tileIndex(tileIndex: number) {
    // Update IDs for integration tests which need them
    this.querySelector('.video-tile-nameplate').id = `nameplate-${tileIndex}`;
    this.querySelector('.video-tile-video').id = `video-${tileIndex}`;
  }

  public set showConfigDropdown(shouldShow: boolean) {
    const display: string = shouldShow ? 'block' : 'none';
    (this.querySelector('.button-video-tile-config-drop') as HTMLElement).style.display = display;
    (this.querySelector('.video-tile-pause') as HTMLElement).style.display = display;
  }

  public set showRemoteVideoPreferences(shouldShow: boolean) {
    const display: string = shouldShow ? 'block' : 'none';
    (this.querySelector('.target-resolution-header') as HTMLElement).style.display = display;
    (this.querySelector('.target-resolution-toggle') as HTMLElement).style.display = display;
    (this.querySelector('.video-priority-header') as HTMLElement).style.display = display;
    (this.querySelector('.video-priority-toggle') as HTMLElement).style.display = display;
    (this.querySelector('.video-priority-disable-pause-header') as HTMLElement).style.display = display;
    (this.querySelector('.video-priority-disable-pause-toggle') as HTMLElement).style.display = display;
  }

  show(isContent: boolean) {
    this.classList.add('active');
    if (isContent) {
      this.classList.add('content');
    }
  }

  public set featured(featured: boolean) {
    if (featured) {
      this.classList.add('featured');
    } else {
      this.classList.remove('featured');
    }
  }

  hide() {
    this.classList.remove('active', 'featured', 'content');
  }

  showVideoStats(
    keyStatstoShow: { [key: string]: string },
    metricsData: { [id: string]: { [key: string]: number } },
    streamDirection: string,
  ): void {
    const streams = metricsData ? Object.keys(metricsData) : [];
    if (streams.length === 0) {
      return;
    }

    let statsInfo: HTMLDivElement = this.querySelector('#stats-info') as HTMLDivElement;
    if (!statsInfo) {
      statsInfo = document.createElement('div');
      statsInfo.setAttribute('id', 'stats-info');
      statsInfo.setAttribute('class', 'stats-info');
    }

    let statsInfoTable = this.querySelector('#stats-table') as HTMLTableElement;
    if (statsInfoTable) {
      statsInfo.removeChild(statsInfoTable);
    }
    statsInfoTable = document.createElement('table') as HTMLTableElement;
    statsInfoTable.setAttribute('id', 'stats-table');
    statsInfoTable.setAttribute('class', 'stats-table');
    statsInfo.appendChild(statsInfoTable);

    this.videoElement.insertAdjacentElement('afterend', statsInfo);
    const header = statsInfoTable.insertRow(-1);
    let cell = header.insertCell(-1);
    cell.innerHTML = 'Video statistics';
    for (let cnt = 0; cnt < streams.length; cnt++) {
      cell = header.insertCell(-1);
      cell.innerHTML = `${streamDirection} ${cnt + 1}`;
    }

    for (const ssrc of streams) {
      for (const [metricName, value] of Object.entries(metricsData[ssrc])) {
        if (keyStatstoShow[metricName]) {
          const row = statsInfoTable.insertRow(-1);
          row.setAttribute('id', `${metricName}`);
          cell = row.insertCell(-1);
          cell.innerHTML = keyStatstoShow[metricName];
          cell = row.insertCell(-1);
          cell.innerHTML = `${value}`;
        }
      }
    }
  };

  public get videoElement(): HTMLVideoElement {
    return this.querySelector('.video-tile-video');
  }

  public set nameplate(nameplate: string) {
    const nameplateElement = this.querySelector('.video-tile-nameplate');
    console.log(`setting nameplate to ${nameplate}`);
    nameplateElement.innerHTML = nameplate;
  }

  public set attendeeId(attendeeId: string) {
    const attendeeIdElement = this.querySelector('.video-tile-attendee-id');
    console.log(`setting attendeeId to ${attendeeId}`);
    attendeeIdElement.innerHTML = attendeeId;
  }

  public set pauseState(state: string) {
    const pauseState = this.querySelector('.video-tile-pause-state');
    pauseState.innerHTML = state;
  }

  public get pauseButtonElement(): HTMLButtonElement {
    return this.querySelector('.video-tile-pause');
  }

  public get targetResolutionRadioElement(): HTMLFormElement {
    return this.querySelector('.target-resolution-toggle');
  }

  public get videoPriorityRadioElement(): HTMLFormElement {
    return this.querySelector('.video-priority-toggle');
  }

  public get videoPriorityPauseEnabledRadioElement(): HTMLFormElement {
    return this.querySelector('.video-priority-disable-pause-toggle');
  }

  async connectedCallback() {
    this.innerHTML = this.innerHTMLToInject;
    (this.querySelector('.button-video-tile-config-drop') as HTMLElement).innerHTML = require('../../../node_modules/open-iconic/svg/cog.svg');
    this.className = 'video-tile';
  }
}

customElements.define('video-tile', DemoVideoTile);
