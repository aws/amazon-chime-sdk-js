const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {emitMetric} = require('./utils/CloudWatch');
const axios = require('axios').default;

let stepArray = [];
let doneArray = [];
let socketAttendeeMap = undefined;
let capabilities = {};
let attendeeJoined = new Set([]);
let meetingMap = {};

const port = process.argv[2];
const numberOfParticipant = parseInt(process.argv[3], 10);
const interval = 1000;
let createMeetingPromise = undefined;

createMeeting = async (createMeetingUrl) => {
  if (meetingMap[createMeetingUrl]) {
    const message = meetingMap[createMeetingUrl] === "created" ? "Meeting already created" : "Meeting creation in progress";
    console.log(message);
    try {
      await createMeetingPromise;
    } catch (error) {
      console.log(`Unable to create meeting, server error: ${error}`);
    }
    return;
  }
  meetingMap[createMeetingUrl] = "creating";
  let i = 0;
  let retryAttempts = 3;
  while (i < retryAttempts) {
    i++;
    try {
      console.log(`Creating meeting with title: ${createMeetingUrl}`);
      createMeetingPromise = axios.post(createMeetingUrl);
      const response = await createMeetingPromise;
      const data = await response.data;
      meetingMap[createMeetingUrl] = "created";
      console.log("Meeting created");
      console.log(`Chime meeting id : ${data.JoinInfo.Meeting.MeetingId}`);
      return data;
    } catch (error) {
      console.log(`Unable to create meeting, server error: ${error}`);
    }
  }
};

io.on('connection', function (socket) {

  let attendeeId = "";
  let testName = "";
  console.log('Connected');

  socket.on('setup_test', async (createMeetingUrl, id) => {
    console.log(`Setting up test for attendee: ${id}`);
    if (socketAttendeeMap === undefined) {
      socketAttendeeMap = {};
    }
    attendeeId = id;
    socketAttendeeMap[id] = socket;
    await createMeeting(createMeetingUrl);
    socket.emit('meeting_created');
  });

  socket.on('test_name', name => {
    testName = name;
  });

  socket.on('test_capabilities', cap => {
    capabilities = cap;
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  socket.on('test finished', id => {
    stepArray.push(id);
  });

  socket.on('done', id => {
    doneArray.push(id);
  });

  socket.on('attendee_joined', id => {
    console.log("Meeting joined by: " + id);
    attendeeJoined.add(id);
    let count = attendeeJoined.size;
    for (var key in socketAttendeeMap) {
      socketAttendeeMap[key].emit('participant_count', count);
    }
  });

  socket.on("local_video_on", () => {
    console.log("Video turned on by: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("remote_video_on", attendeeId);
      }
    }
  });

  socket.on("local_video_off", () => {
    console.log("Video turned off by: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("remote_video_off", attendeeId);
      }
    }
  });

  socket.on("audio_start", () => {
    console.log("Audio turned on by: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("remote_audio_on", attendeeId);
      }
    }
  });

  socket.on("audio_stop", () => {
    console.log("Audio turned off by: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("remote_audio_off", attendeeId);
      }
    }
  });

  socket.on("video_check_complete", () => {
    console.log("Video check completed for: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("video_check_completed_by_other_participants", attendeeId);
      }
    }
  });

  socket.on("audio_check_complete", () => {
    console.log("Audio check completed for: " + attendeeId);
    for (var key in socketAttendeeMap) {
      if (key !== attendeeId) {
        socketAttendeeMap[key].emit("audio_check_completed_by_other_participants", attendeeId);
      }
    }
  });

  socket.on("failed", subTest => {
    console.log(`${subTest} failed ${attendeeId}`);
    socket.broadcast.emit('failed');
  });

  function isFinished() {
    if (stepArray.length === numberOfParticipant) {
      socket.broadcast.emit('finished');
    }
  }

  function isDone() {
    if (doneArray.length === numberOfParticipant) {
      stepArray = [];
      doneArray = [];
    }
  }

  function ckeckStatus() {
    isFinished();
    isDone();
  }

  setInterval(ckeckStatus, interval);
});

http.listen(port, function () {
  console.log('Listening on port ' + port);
});