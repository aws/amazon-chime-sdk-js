const express = require('express');
const cors = require('cors');

const multer = require('multer');

require('dotenv').config();
const PORT = process.env.PORT;


const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION
  });

  async function createChimeClientWithMFA() {
  
    return new ChimeSDKMeetingsClient({
      region: process.env.REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        
      }
    });
  }
  


const {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand
} = require('@aws-sdk/client-chime-sdk-meetings');

const app = express();
app.use(cors());
app.use(express.json());

// File uploads setup
const upload = multer({ dest: './uploads' });

// Amazon Chime createMeeting API
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

// Receive video upload
app.post('/uploadResponse', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  console.log('Uploaded:', req.file);
  res.json({ message: 'Video uploaded successfully.', file: req.file });
});

// Polly TTS integration
app.post('/speakQuestion', async (req, res) => {
  const { questionText } = req.body;
  const polly = new AWS.Polly({ region: 'us-east-1' });

  const audio = await polly.synthesizeSpeech({
    OutputFormat: 'mp3',
    Text: questionText,
    VoiceId: 'Joanna'
  }).promise();

  res.json({ audio: Buffer.from(audio.AudioStream).toString('base64') });
});

// Amazon Lex question-answering integration
app.post('/aiQuestion', async (req, res) => {
  const { userInput } = req.body;
  const lex = new AWS.LexRuntimeV2({ region: 'us-east-1' });

  const params = {
    botId: process.env.LEX_BOT_ID,
    botAliasId: process.env.LEX_BOT_ALIAS_ID,
    localeId: 'en_US',
    sessionId: 'customer-1234',
    text: userInput || 'Hello'
  };

  try {
    const lexResponse = await lex.recognizeText(params).promise();
    const lexMessage = lexResponse.messages[0]?.content || "";
    const intentState = lexResponse.sessionState.intent.state;

    res.json({ lexMessage, intentState });
  } catch (error) {
    console.error("Lex error:", error);
    res.status(500).json({ error });
  }
});

app.use(cors());
app.use(express.json());


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
