const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {emitMetric} = require('./utils/CloudWatch');
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

let stepArray = [];
let doneArray = [];
let socketAttendeeMap = undefined;
let capabilities = {};
let attendeeJoined = new Set([]);
let meetingTitle = '';
let meetingCreationStatus = undefined;
let numberAttendeeReady = 0;

const port = process.argv[2];
const numberOfParticipant = parseInt(process.argv[3], 10);
const interval = 1000;
let createMeetingPromise = undefined;
let attendeeReadyMap = new Map();

createMeeting = async (baseUrl) => {
  if (meetingTitle) {
    const message = meetingCreationStatus === "created" ? "Meeting already created" : "Meeting creation in progress";
    console.log(message);
    try {
      await createMeetingPromise;
    } catch (error) {
      console.log(`Unable to create meeting, server error: ${error}`);
    }
    return;
  }
  meetingCreationStatus = "creating";
  meetingTitle = uuidv4();
  const createMeetingUrl = `${baseUrl}join?title=${meetingTitle}&name=MeetingOwner&region=us-east-1`;
  let i = 0;
  let retryAttempts = 3;
  while (i < retryAttempts) {
    i++;
    try {
      console.log(`Creating meeting with title: ${createMeetingUrl}`);
      createMeetingPromise = axios.post(createMeetingUrl);
      const response = await createMeetingPromise;
      const data = await response.data;
      meetingCreationStatus = "created";
      console.log("Meeting created");
      console.log(`Chime meeting id : ${data.JoinInfo.Meeting.Meeting.MeetingId}`);
      return data;
    } catch (error) {
      console.log(`Unable to create meeting, server error: ${error}`);
    }
  }
};

cleanup = () => {
  meetingTitle = '';
  meetingCreationStatus = undefined;
  createMeetingPromise = undefined;
  attendeeReadyMap = new Map();
  socketAttendeeMap = undefined;
  capabilities = {};
  attendeeJoined = new Set([]);
  stepArray = [];
  doneArray = [];
}

io.on('connection', function (socket) {

  let attendeeId = "";
  let testName = "";
  console.log('Connected');

  socket.on('test_ready', isReady  => {
    attendeeReadyMap.set(socket, !!isReady);
    let numberAttendeeReady = 0;
    attendeeReadyMap.forEach(function(value, socket) {
      if (value === true) {
        numberAttendeeReady += 1;
      }
    });
    if (numberAttendeeReady === numberOfParticipant) {
      console.log(`All clients are ready`);
      io.sockets.emit('all_clients_ready', true);
    } else {
      io.sockets.emit('all_clients_ready', false);
    }
  });

  socket.on('setup_test', async (baseUrl, id) => {
    console.log(`Setting up test for attendee: ${id}`);
    if (socketAttendeeMap === undefined) {
      socketAttendeeMap = {};
    }
    attendeeId = id;
    socketAttendeeMap[id] = socket;
    await createMeeting(baseUrl);
    socket.emit('meeting_created', meetingTitle);
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
    if (attendeeJoined.size === numberOfParticipant) {
      attendeeJoined = new Set([]);
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
      cleanup();
    }
  }

  function checkStatus() {
    isFinished();
    isDone();
  }

  setInterval(checkStatus, interval);
});

http.listen(port, function () {
  console.log('Listening on port ' + port);
});