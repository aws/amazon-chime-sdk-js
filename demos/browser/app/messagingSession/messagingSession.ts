// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// @ts-nocheck

import '../../style.scss';
import 'bootstrap';

import {
  ConsoleLogger,
  DefaultMessagingSession,
  Logger,
  LogLevel,
  Message,
  MessagingSessionObserver,
  MessagingSession,
  MessagingSessionConfiguration,
  Versioning,
} from 'amazon-chime-sdk-js';

import * as AWS from 'aws-sdk/global';
import * as Chime from 'aws-sdk/clients/chime';

export class DemoMessagingSessionApp implements MessagingSessionObserver {
  static readonly BASE_URL: string = [
    location.protocol,
    '//',
    location.host,
    location.pathname.replace(/\/*$/, '/'),
  ].join('');

  userArn: string;
  logger: Logger;
  configuration: MessagingSessionConfiguration;
  session: MessagingSession;
  sessionId: string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).app = this;
    (document.getElementById('sdk-version') as HTMLSpanElement).innerText =
      'amazon-chime-sdk-js@' + Versioning.sdkVersion;
    (document.getElementById('userArn') as HTMLInputElement).focus();
    this.initEventListeners();
    this.initParameters();
    this.switchToFlow('flow-connect');
  }

  initParameters(): void {
    this.logger = new ConsoleLogger('SDK', LogLevel.INFO);
  }

  initEventListeners(): void {
    document.getElementById('connect').addEventListener('click', async () => {
      const response = await this.fetchCredentials();
      AWS.config.credentials = new AWS.Credentials(response.accessKeyId, response.secretAccessKey, response.sessionToken);
      AWS.config.credentials.get(async () => {
        this.userArn = (document.getElementById('userArn') as HTMLInputElement).value;
        this.sessionId = (document.getElementById('sessionId') as HTMLInputElement).value;
        try {
          const chime = new Chime({ region: 'us-east-1' });
          const endpoint = await chime.getMessagingSessionEndpoint().promise();
          this.configuration = new MessagingSessionConfiguration(this.userArn, this.sessionId, endpoint.Endpoint.Url, chime, AWS);
          this.session = new DefaultMessagingSession(this.configuration, this.logger);
          this.session.addObserver(this);
          this.session.start();
        } catch (error) {
          console.error(`Failed to retrieve messaging session endpoint: ${error.message}`);
        }
      });
    });
    document.getElementById('disconnect').addEventListener('click', () => {
      this.session?.stop();
    });
    document.getElementById('clear').addEventListener('click', () => {
      this.clearMessages();
    });
  }

  messagingSessionDidStart(): void {
    console.log('Session started');
    this.switchToFlow('flow-message');
  }

  messagingSessionDidStartConnecting(reconnecting: boolean): void {
    if (reconnecting) {
      console.log('Start reconnecting');
    } else {
      console.log('Start connecting');
    }
  }

  messagingSessionDidStop(event: CloseEvent): void {
    console.log(`Closed: ${event.code} ${event.reason}`);
    // @ts-ignore
    window.location = window.location.pathname;
    this.clearMessages();
    this.switchToFlow('flow-connect');
  }

  messagingSessionDidReceiveMessage(message: Message): void {
    const messagesDiv = document.getElementById('messages') as HTMLDivElement;
    const messageTypeDiv = document.createElement('div') as HTMLDivElement;
    messageTypeDiv.classList.add('font-weight-bold');
    messageTypeDiv.innerText = message.type;
    messagesDiv.appendChild(messageTypeDiv);
    if (message.headers) {
      this.appendMessage('headers:', message.headers);
    }
    if (message.payload) {
      this.appendMessage('payload:', message.payload);
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  appendMessage(headingTitle: string, content: string): void {
    const messagesDiv = document.getElementById('messages') as HTMLDivElement;
    const newMessageDiv = document.createElement('div') as HTMLDivElement;
    const newMessageHeadingDiv = document.createElement('div') as HTMLDivElement;
    newMessageHeadingDiv.innerText = headingTitle;
    newMessageDiv.appendChild(newMessageHeadingDiv);
    const newMessageContentPre = document.createElement('pre') as HTMLPreElement;
    newMessageContentPre.innerText = JSON.stringify(content, null, 4);
    this.updateProperty(newMessageContentPre.style, 'overflow', 'unset');
    newMessageDiv.appendChild(newMessageContentPre);
    messagesDiv.appendChild(newMessageDiv);
  }

  switchToFlow(flow: string): void {
    Array.from(document.getElementsByClassName('flow')).map(
      e => ((e as HTMLDivElement).style.display = 'none')
    );
    (document.getElementById(flow) as HTMLDivElement).style.display = 'block';
  }

  clearMessages(): void {
    document.getElementById('messages').innerText = '';
  }

  // eslint-disable-next-line
  async fetchCredentials(): Promise<any> {
    const response = await fetch(
      `${DemoMessagingSessionApp.BASE_URL}fetch_credentials`,
      {
        method: 'GET',
      }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }
    return json;
  }

  updateProperty(obj: any, key: string, value: string) {
    if (value !== undefined && obj[key] !== value) {
      obj[key] = value;
    }
  }
}
window.addEventListener('load', () => {
  new DemoMessagingSessionApp();
});
