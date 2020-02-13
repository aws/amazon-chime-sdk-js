// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogLevel from '../../../../src/logger/LogLevel';
import {ConsoleLogger} from '../../../../src/index';

export default class CloudWatchLogger extends ConsoleLogger {
  name: string;
  level: LogLevel;
  logCapture: string[] = [];
  meetingID: string;
  attendeeID: string;
  logSeqNo: any;
  lock = false;
  batchSizes = 50;

  constructor(name: string, level = LogLevel.WARN, meetingID: string, attendeeID: string) {
    super(name, level);
    this.name = name;
    this.level = level;
    this.meetingID = meetingID;
    this.attendeeID = attendeeID;
    this.logSeqNo = 0;
  }

  async publishToCloudWatch(base_url: string) {
    var _this = this;

    setInterval(async function () {

      if (_this.lock == true || _this.logCapture.length == 0 )
        return
      _this.lock = true;
      var batch = _this.logCapture.slice(0, _this.batchSizes);
      var bodyString = JSON.stringify({
        "meetingID" : _this.meetingID,
        "attendeeID" : _this.attendeeID,
        "appName" : _this.name,
        "logs": batch
      });
      const response = await fetch(
        `${base_url}logs`, {
          method: 'POST',
          body: bodyString
        }
      );
      if (response.status == 200){
        // delete elements upto current_size(logCapture) from the array logCapture
        _this.logCapture = _this.logCapture.slice(batch.length);
      }
      _this.lock = false;
    }, 5000);
  }


  protected log(type: LogLevel, msg: string): void {
    if (type < this.level) {
      return;
    }
    const date = new Date();
    const timestamp = date.toISOString();
    const logMessage = `${timestamp} [${LogLevel[type]}] ${this.name} - ${msg}`;
    switch (type) {
      case LogLevel.ERROR:
        console.trace(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage.replace(/\\r\\n/g, '\n'));
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      }
      var logJSON = {
        "logSeqNo": this.logSeqNo,
        "logMessage" : msg,
        "timestamp" : date.getTime(),
        "logLevelType" : LogLevel[type]
      };
      this.logCapture.push(JSON.stringify(logJSON));
      this.logSeqNo += 1;
    }
}