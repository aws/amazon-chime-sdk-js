const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {emitMetric} = require('./utils/CloudWatch');


let stepArray = [];
let doneArray = [];
let socketAttendeeMap = {};
let capabilities = {};

const port = process.argv[2];
const numberOfParticipant = parseInt(process.argv[3], 10);
const interval = 1000;

io.on('connection', function (socket) {

  let attendeeId = "";
  let testName = "";
  console.log('Connected');

  socket.on('test_start', () => {
    console.log("Starting test");
    socketAttendeeMap = {};
    attendeeId = "";
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
    attendeeId = id;
    socketAttendeeMap[id] = socket;
    let count = 0;
    for (var key in socketAttendeeMap) {
      count++;
    }
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
