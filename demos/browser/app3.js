// app.js

const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
require('dotenv').config();


const multer = require('multer');
const fs = require('fs');
const path = require('path');

let conversationHistory ='';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION
  });


const { 
  ChimeSDKMeetingsClient, 
  CreateMeetingCommand, 
  CreateAttendeeCommand 
} = require('@aws-sdk/client-chime-sdk-meetings');
const { debug } = require('console');

const app = express();
app.use(cors());
app.use(express.json());


async function createChimeClientWithMFA() {
  
  return new ChimeSDKMeetingsClient({
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      
    }
  });
}


app.post('/createMeeting', async (req, res) => {
  const { customerId } = req.body;  // Expecting MFA code from the client
  if (!customerId) {
    return res.status(400).json({ error: 'customerId is required' });
  }

  try {
    // Create a Chime Meetings client using temporary credentials with MFA
    const chimeClient = await createChimeClientWithMFA();
    
    // Create a meeting with ExternalMeetingId (which is now required)
    const createMeetingParams = {
      ClientRequestToken: `loan-verification-${customerId}-${Date.now()}`,
      MediaRegion: 'us-east-1',
      ExternalMeetingId: `external-meeting-${customerId}-${Date.now()}`
    };

    const createMeetingCommand = new CreateMeetingCommand(createMeetingParams);
    const meetingResponse = await chimeClient.send(createMeetingCommand);
    const meeting = meetingResponse.Meeting;

    // Create an attendee for the meeting
    const createAttendeeParams = {
      MeetingId: meeting.MeetingId,
      ExternalUserId: customerId,  // Must be unique per customer
    };

    const createAttendeeCommand = new CreateAttendeeCommand(createAttendeeParams);
    const attendeeResponse = await chimeClient.send(createAttendeeCommand);
    const attendee = attendeeResponse.Attendee;

    res.json({ meeting, attendee });
  } catch (error) {
    console.error('Error creating meeting or attendee:', error);
    res.status(500).json({ error: 'Error creating meeting or attendee', details: error });
  }
});


// Set up storage with multer for uploaded audio files.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// This endpoint receives the recorded audio from the client.
app.post('/uploadResponse', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // For demonstration, log file details.
    console.log('Received file:', req.file);
    // Here, you can integrate a speech-to-text service or store the file for later verification.
    res.json({ message: 'File received', file: req.file });
});

app.post('/speakQuestion', async (req, res) => {
    const AWS = require('aws-sdk');
  
    const { questionText } = req.body;
  
    // Configure Polly
    const polly = new AWS.Polly({
      region: 'us-east-1', // Ensure correct region clearly specified
    });
  
    const params = {
      OutputFormat: 'mp3',
      Text: questionText,
      VoiceId: 'Joanna' // Adjust voice clearly as desired
    };
  
    try {
      const audio = await polly.synthesizeSpeech(params).promise();
      const audioBase64 = Buffer.from(audio.AudioStream).toString('base64');
  
      // Send audio clearly as base64-encoded response
      res.json({ audio: audioBase64 });
  
    } catch (error) {
      console.error("Polly error:", error);
      res.status(500).json({ error });
    }
  });
  
  app.post('/aiQuestion', async (req, res) => {
    debug.log('question ', question);
    const {question} = req.body;
  
    const params = {
      botId: process.env.LEX_BOT_ID,
      botAliasId: process.env.LEX_BOT_ALIAS_ID,
      localeId: 'en_US',
      sessionId: 'customer-1234',
      text: question || 'Hello'
    };
  
    try {
      const lexRuntime = new AWS.LexRuntimeV2();
      const lexResponse = await lexRuntime.recognizeText(params).promise();
  
      const aiQuestion = lexResponse.messages[0]?.content || "";
      const intentStatus = lexResponse.sessionState.intent.state;
  
      res.json({ aiQuestion, intentStatus });
  
    } catch (error) {
      console.error("Lex error:", error);
      res.status(500).json({ error });
    }
  });



const PORT = process.env.PORT || 3036;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
