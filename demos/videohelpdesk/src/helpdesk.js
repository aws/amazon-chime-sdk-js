// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// UNCOMMENT THE FOLLOWING
/*
const sdk = require('amazon-chime-sdk-js');
const url_without_slash = window.location.href.replace(/\/helpdesk\/?$/, '');
const tickets_endpoint = `${url_without_slash}/tickets`;
const ticket_endpoint = `${url_without_slash}/ticket`;
var tickets, currentTicket, observer, session;

window.addEventListener('load', async () => {
  refreshQueue();

  window.setInterval(async () => {
    refreshQueue();
  }, 5000);

  domElement('help-desk-join-next').addEventListener('click', async () => {
    await stopCurrentCall();

    if (tickets.length === 0) {
      domElement('help-desk-speaking-with').innerHTML = 'You are not speaking with anyone right now.';
      return;
    }

    const fetchResult = await window.fetch(
      window.encodeURI(`${ticket_endpoint}?TicketId=${tickets[0].TicketId}`),
      { method: 'GET' },
    );
    currentTicket = await fetchResult.json();

    if (currentTicket.Error) {
      domElement('help-desk-speaking-with').innerText = `${tickets[0].CustomerName} hung up already.`;
      refreshQueue();
      return;
    }

    domElement('help-desk-speaking-with').innerText = `Connecting to ${currentTicket.CustomerName}...`;

    console.log(`Current Ticket: ${JSON.stringify(currentTicket, '', 2)}`);

    const logger = new sdk.ConsoleLogger('SDK', sdk.LogLevel.INFO);
    session = new sdk.DefaultMeetingSession(
      new sdk.MeetingSessionConfiguration(
        currentTicket.Meeting,
        currentTicket.HelpDeskAttendee,
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

async function stopCurrentCall() {
  if (!session) {
    return;
  }
  session.audioVideo.stop();
  await window.fetch(
    window.encodeURI(`${ticket_endpoint}?TicketId=${currentTicket.TicketId}`),
    { method: 'DELETE' },
  );
  currentTicket = null;
  session = null;
  refreshQueue();
}

async function refreshQueue() {
  const fetchResult = await window.fetch(
    tickets_endpoint,
    { method: 'GET' },
  );
  const ticketsResponse = await fetchResult.json();
  const queue = domElement('help-desk-queue');
  queue.innerHTML = '';
  const activelyWaitingTickets = []
  for (const ticket of ticketsResponse) {
    if (currentTicket && ticket.TicketId === currentTicket.TicketId) {
      continue;
    }
    activelyWaitingTickets.push(ticket);
    const waitTimeTotal = Math.floor((Date.now() - Date.parse(ticket.CreatedOnDate)) / 1000);
    const waitTimeMinutes = Math.floor(waitTimeTotal / 60);
    const waitTimeSeconds = waitTimeTotal - waitTimeMinutes * 60;
    const waitTime = `${waitTimeMinutes} min ${waitTimeSeconds} sec`;
    queue.innerHTML += `<div>${ticket.CustomerName} (waiting ${waitTime})</div>`;
  }
  if (activelyWaitingTickets.length === 0) {
    queue.innerHTML = 'No one is waiting right now.';
  }
  tickets = activelyWaitingTickets;
}

observer = {
  audioVideoDidStart: () => {
    domElement('help-desk-speaking-with').innerText = `Speaking with ${currentTicket.CustomerName} right now.`;
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
