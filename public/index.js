// index.js

import {
    DefaultMeetingSession,
    MeetingSessionConfiguration,
    ConsoleLogger,
    LogLevel,
    DefaultDeviceController
  } from 'amazon-chime-sdk-js';
  
  console.log("Chime SDK modules loaded:", {
    DefaultMeetingSession,
    MeetingSessionConfiguration,
    ConsoleLogger,
    LogLevel,
    DefaultDeviceController
  });
  
  // Predefined questions
  const questions = [
    "Please state your full name.",
    "What is your date of birth?",
    "Confirm the loan amount received."
  ];
  let currentQuestionIndex = 0;
  let meetingSession; // Global meeting session variable
  
  function speakQuestion(question) {
    const utterance = new SpeechSynthesisUtterance(question);
    window.speechSynthesis.speak(utterance);
    document.getElementById("question").innerText = question;
  }
  
  async function recordAnswer() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'answer.webm');
        try {
          const response = await fetch('/uploadResponse', {
            method: 'POST',
            body: formData
          });
          const result = await response.json();
          console.log("Upload result:", result);
        } catch (uploadError) {
          console.error("Error uploading audio:", uploadError);
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
          speakQuestion(questions[currentQuestionIndex]);
        } else {
          alert("Verification complete. Thank you!");
        }
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 5000);
    } catch (err) {
      console.error("Error recording audio:", err);
    }
  }
  
  async function joinMeeting(meetingInfo) {
    const meeting = meetingInfo.meeting;
    const attendee = meetingInfo.attendee;
    
    const configuration = new MeetingSessionConfiguration(meeting, attendee);
    const logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
    const deviceController = new DefaultDeviceController(logger);
    meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
  
    const videoDevices = await meetingSession.audioVideo.listVideoInputDevices();
    const selectedDeviceId = videoDevices[0].deviceId;
    const videoInputDeviceInfo = videoInputDevices.find(device => device.deviceId === selectedDeviceId);    
    console.log("Available video devices:", videoDevices);
    if (videoInputDeviceInfo) {
        await meetingSession.audioVideo.startVideoInput(videoInputDeviceInfo);
        meetingSession.audioVideo.startLocalVideoTile();
    } else {
        console.error('Selected video input device not found.');
    }
  
    meetingSession.audioVideo.addObserver({
      videoTileDidUpdate: (tileState) => {
        console.log("videoTileDidUpdate:", tileState);
        if (tileState.localTile) {
          console.log("Local video tile found with tileId:", tileState.tileId);
          meetingSession.audioVideo.bindVideoElement(tileState.tileId, document.getElementById('localVideo'));
        }
      }
    });
  
    meetingSession.audioVideo.startLocalVideoTile();
    meetingSession.audioVideo.start();
  
    setTimeout(() => {
      const videoElement = document.getElementById('localVideo');
      if (!videoElement.srcObject) {
        console.log("Fallback: No video bound, attempting manual binding.");
        const tiles = meetingSession.audioVideo.getAllVideoTiles();
        console.log("All video tiles:", tiles);
        for (const [tileId, tileState] of tiles.entries()) {
          if (tileState.localTile) {
            console.log("Fallback binding tileId:", tileId);
            meetingSession.audioVideo.bindVideoElement(tileId, videoElement);
            break;
          }
        }
      } else {
        console.log("Video tile successfully bound.");
      }
    }, 5000);
  }
  
  async function startVerification() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
    
      console.error("Media permissions denied or error:", err);
      alert("Please allow access to your camera and microphone.");
      return;
    }
  
    const customerId = "customer-1234";
    let meetingInfo;
    try {
      const response = await fetch('http://localhost:3001/createMeeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId })
      });
      meetingInfo = await response.json();
      console.log("Meeting Info:", meetingInfo);
    } catch (err) {
      console.error("Error creating meeting:", err);
      alert("Error creating meeting. Please try again.");
      return;
    }
  
    if (meetingInfo) {
      joinMeeting(meetingInfo);
    }
  
    document.getElementById("question-container").style.display = "block";
    speakQuestion(questions[currentQuestionIndex]);
  }
  
  document.getElementById("startVerification").addEventListener("click", startVerification);
  document.getElementById("recordAnswer").addEventListener("click", recordAnswer);
  