// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// UNCOMMENT THE FOLLOWING
/*
const sdk = require('amazon-chime-sdk-js');
const url_without_slash = window.location.href.replace(/\/$/, '');
const create_tickets_endpoint = `${url_without_slash}/tickets`;
var ticket, observer, session;

window.addEventListener('load', () => {
  domElement('help-desk-banner').addEventListener('click', () => {
    domToggle('help-desk-body');
  });

  domElement('help-desk-call').addEventListener('click', async () => {
    domHide('help-desk-customer-name');
    domHide('help-desk-call');
    domElement('help-desk-instructions').innerHTML = 'Connecting...';
    const fetchResult = await window.fetch(
      encodeURI(`${create_tickets_endpoint}?CustomerName=${domElement('help-desk-customer-name').value}`),
      { method: 'POST' },
    );
    const ticket = await fetchResult.json();
    console.log(`Created Ticket: ${JSON.stringify(ticket, '', 2)}`);

    const logger = new sdk.ConsoleLogger('SDK', sdk.LogLevel.INFO);
    session = new sdk.DefaultMeetingSession(
      new sdk.MeetingSessionConfiguration(
        ticket.Meeting,
        ticket.CustomerAttendee,
      ),
      logger,
      new sdk.DefaultDeviceController(logger),
    );

    session.audioVideo.addObserver(observer);

    const firstAudioDeviceId = (await session.audioVideo.listAudioInputDevices())[0].deviceId;
    await session.audioVideo.chooseAudioInputDevice(firstAudioDeviceId);

    const firstVideoDeviceId = (await session.audioVideo.listVideoInputDevices())[0].deviceId;
    await session.audioVideo.chooseVideoInputDevice(firstVideoDeviceId);

    session.audioVideo.bindAudioElement(domElement('help-desk-audio'));

    session.audioVideo.start();
  });
});

observer = {
  audioVideoDidStart: () => {
    domElement('help-desk-instructions').innerHTML = 'Connected...Please hold for the next help desk staff member.';
    session.audioVideo.startLocalVideoTile();
  },
  videoTileDidUpdate: tileState => {
    const videoElement = tileState.localTile ? 'help-desk-local-video' : 'help-desk-remote-video';
    session.audioVideo.bindVideoElement(tileState.tileId, domElement(videoElement));
    domShow(videoElement);
  }
};

function domElement(className) {
  return document.getElementsByClassName(className)[0];
}

function domShow(className) {
  const element = domElement(className);
  element.style.display = 'block';
  element.setAttribute('show', 'true');
}

function domHide(className) {
  const element = domElement(className);
  element.style.display = 'none';
  element.setAttribute('show', 'false');
}

function domToggle(className) {
  const element = domElement(className);
  if (element.getAttribute('show') === 'true') {
    domHide(className);
  } else {
    domShow(className);
  }
}
//*/
