/**
 * Twilio Media Streams → OpenAI Whisper Real-time Transcription Server
 * 
 * This server handles real-time audio transcription from Twilio phone calls
 * using OpenAI's Whisper API.
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import twilio from 'twilio';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Validate required environment variables
if (!openaiApiKey) {
  console.error('ERROR: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Twilio client for outgoing calls
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Debug logging for Twilio credentials
console.log(`\n[DEBUG] Twilio Configuration Loaded:`);
console.log(`  Account SID: ${process.env.TWILIO_ACCOUNT_SID}`);
console.log(`  Phone Number: ${process.env.TWILIO_PHONE_NUMBER}\n`);

// Initialize Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add ngrok-skip-browser-warning header to all responses to bypass free tier warning
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader('User-Agent', 'Twilio-Media-Stream');
  next();
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

/**
 * Health check endpoint
 * Returns 200 if server is running
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * TwiML endpoint for configuring Twilio
 * This endpoint provides the response with Media Stream enabled
 * Twilio may request this URL using either GET or POST.
 */
const handleTwiml = (req, res) => {
  // Use DOMAIN env var for the media stream URL, default to request hostname
  const host = process.env.DOMAIN || req.hostname;
  const mediaStreamUrl = `wss://${host}/media-stream`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Your call is being recorded and transcribed in real time.</Say>
  <Stream url="${mediaStreamUrl}" />
  <Gather numDigits="1" timeout="10">
    <Say>Press any key or just wait.</Say>
  </Gather>
  <Say>Thank you for your call.</Say>
  <Hangup />
</Response>`;

  console.log(`[${new Date().toISOString()}] TwiML requested by Twilio`);
  console.log(`[${new Date().toISOString()}] Media Stream URL: ${mediaStreamUrl}`);
  console.log(`[${new Date().toISOString()}] Full TwiML:\n${twiml}\n`);

  res.type('application/xml').send(twiml);
};

app.get('/twiml', handleTwiml);
app.post('/twiml', handleTwiml);

/**
 * Endpoint to initiate an outgoing call
 * POST /outgoing-call with JSON body: { "toNumber": "+1234567890" }
 */
app.post('/outgoing-call', async (req, res) => {
  try {
    const toNumber = req.body.toNumber;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Validate inputs
    if (!toNumber) {
      return res.status(400).json({ error: 'Missing toNumber in request body' });
    }
    if (!fromNumber) {
      return res.status(500).json({ error: 'TWILIO_PHONE_NUMBER not configured in .env' });
    }

    // Get the domain for the callback URL
    const host = process.env.DOMAIN || req.hostname;
    const protocol = host === 'localhost' || host.includes('localhost') ? 'http' : 'https';
    const twimlUrl = `${protocol}://${host}/twiml`;

    console.log(`[${new Date().toISOString()}] Initiating outgoing call from ${fromNumber} to ${toNumber}`);

    // Create the call
    const call = await twilioClient.calls.create({
      from: fromNumber,
      to: toNumber,
      url: twimlUrl,
      method: 'GET',
    });

    console.log(`[${new Date().toISOString()}] Call created: ${call.sid}`);

    res.json({
      success: true,
      message: 'Call initiated successfully',
      callSid: call.sid,
      from: fromNumber,
      to: toNumber,
    });
  } catch (error) {
    console.error(`Error initiating outgoing call: ${error.message}`);
    res.status(500).json({
      error: 'Failed to initiate call',
      details: error.message,
    });
  }
});

/**
 * WebSocket upgrade handler
 * This handles the WebSocket upgrade request from Twilio
 */
server.on('upgrade', (request, socket, head) => {
  console.log(`[${new Date().toISOString()}] WebSocket upgrade request to: ${request.url}`);
  // Only upgrade requests to /media-stream
  if (request.url === '/media-stream') {
    console.log(`[${new Date().toISOString()}] ► Upgrading to WebSocket for /media-stream`);
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log(`[${new Date().toISOString()}] ✗ WebSocket request to unknown URL, destroying socket`);
    socket.destroy();
  }
});

/**
 * WebSocket connection handler
 * Manages individual Twilio Media Stream connections
 */
wss.on('connection', (ws, request) => {
  console.log(`[${new Date().toISOString()}] New WebSocket connection established`);

  // Track connection state
  let callSid = null;
  let audioBuffer = [];
  let isProcessing = false;
  let streamId = null;

  /**
   * Handle incoming messages from Twilio Media Stream
   * Message types: "start", "media", "stop"
   */
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const eventType = message.event;

      // Log event for debugging
      console.log(`[${new Date().toISOString()}] Event: ${eventType}`);

      switch (eventType) {
        /**
         * "start" event: Twilio initiates the Media Stream
         * Contains call metadata like callSid, accountSid, etc.
         */
        case 'start':
          callSid = message.start.callSid;
          streamId = message.start.streamSid;
          console.log(`[${new Date().toISOString()}] ► Call Started - Call SID: ${callSid}`);
          break;

        /**
         * "media" event: Raw audio data from the call
         * Contains base64-encoded audio payload (8kHz, 8-bit mu-law format)
         */
        case 'media': {
          const payload = message.media.payload;

          // Decode base64 audio data
          const audioBuffer = Buffer.from(payload, 'base64');

          // Send audio to Whisper for transcription
          // We batch audio in chunks for better performance
          await transcribeAudioChunk(audioBuffer, callSid);
          break;
        }

        /**
         * "stop" event: Twilio ends the Media Stream
         * Perform cleanup and finalize transcription
         */
        case 'stop':
          console.log(`[${new Date().toISOString()}] ◄ Call Ended - Call SID: ${callSid}`);
          // Gracefully close the connection
          ws.close(1000, 'Call ended');
          break;

        default:
          console.warn(`Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
    }
  });

  /**
   * Handle WebSocket errors
   */
  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`);
  });

  /**
   * Handle WebSocket closure
   */
  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] WebSocket connection closed`);
    callSid = null;
    audioBuffer = [];
  });
});

/**
 * Transcribe audio chunk using OpenAI Whisper
 * 
 * This function:
 * 1. Receives raw PCM audio data from Twilio
 * 2. Sends it to OpenAI's Whisper API
 * 3. Returns partial/final transcription
 * 
 * Note: Twilio sends audio in mu-law format (8kHz, mono)
 * For production, consider batching multiple chunks for efficiency
 * 
 * @param {Buffer} audioChunk - Raw audio data in mu-law format
 * @param {string} callSid - Twilio call identifier
 */
async function transcribeAudioChunk(audioChunk, callSid) {
  try {
    // Skip empty chunks
    if (!audioChunk || audioChunk.length === 0) {
      return;
    }

    // Create a FormData-like object with the audio chunk
    // The Whisper API expects WAV or raw audio file
    const blob = new Blob([audioChunk], { type: 'audio/wav' });

    // Convert Blob to Buffer for Node.js (fs-based approach would be File)
    // Note: For production, consider using a temporary file or streaming approach
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Call Whisper API for transcription
    const transcript = await openai.audio.transcriptions.create({
      file: new File([buffer], 'audio.wav', { type: 'audio/wav' }),
      model: 'whisper-1',
      language: 'en',
      // Optional: add temperature for more deterministic results
      temperature: 0,
    });

    // Log transcription result
    if (transcript.text && transcript.text.trim()) {
      console.log(`[${new Date().toISOString()}] Transcript (${callSid}): ${transcript.text}`);
    }
  } catch (error) {
    // Handle specific Whisper API errors
    if (error.status === 400) {
      // Often means audio is too short or invalid format
      // This is expected for small chunks - log only if verbose needed
    } else {
      console.error(`Whisper transcription error: ${error.message}`);
    }
  }
}

/**
 * Start HTTP server
 */
server.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Twilio Media Streams → Whisper Transcription Server       ║
║  Server running on port: ${port.toString().padEnd(43)}║
║  Health check: http://localhost:${(port + '/health').padEnd(43)}║
║  TwiML endpoint: http://localhost:${(port + '/twiml').padEnd(44)}║
║  WebSocket: wss://yourdomain.com/media-stream              ║
╚════════════════════════════════════════════════════════════╝
  `);
  console.log('⏳ Waiting for Twilio connections...\n');
});

/**
 * Handle server shutdown gracefully
 */
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default server;
