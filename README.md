# Twilio Media Streams Real-time Transcription Server

A Node.js server that initiates Twilio phone calls and is designed to transcribe them in real-time using Twilio Media Streams and OpenAI's Whisper API.

## Status

⚠️ **In Development** - Call initiation is working, but WebSocket media streaming requires deployment to a proper hosting platform.

## Features

- ✅ Outgoing call initiation via Twilio
- ✅ TwiML generation with dynamic domain support
- ✅ Health check endpoint
- ✅ Proper error handling and logging
- 🚧 WebSocket-based Media Stream handling (requires production deployment)
- 🚧 Real-time transcription via OpenAI Whisper API (requires WebSocket)

## Prerequisites

- Node.js 16+
- OpenAI API key (for future transcription feature)
- Twilio account with Voice capability
- Phone number to test calls

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy or create `.env`:

```bash
OPENAI_API_KEY=sk-proj-xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+14633484572
DOMAIN=localhost
PORT=3000
```

### 3. Run the Server

```bash
npm start
# or for development with auto-reload
npm run dev
# or directly
node server.js
```

## Testing Locally

### Test Outgoing Calls

Use the test script to initiate a call:

```bash
node test-outgoing-call.js "+971507168945"
```

Replace with your own phone number.

## API Endpoints

### `POST /outgoing-call`
Initiates an outgoing call to a phone number.

**Request:**
```json
{
  "toNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "callSid": "CAxxxxx",
  "from": "+14633484572",
  "to": "+1234567890"
}
```

### `GET /health`
Health check endpoint
- **Response**: `{ "status": "ok", "timestamp": "2026-02-27T..." }`

### `POST /twiml`
Twilio callback endpoint - generates TwiML response with Media Stream configuration
- **Response**: XML with `<Stream>` element

### `wss://yourdomain.com/media-stream`
WebSocket endpoint for Twilio Media Stream (requires proper deployment)
- **Protocol**: WebSocket Secure (wss://)
- **Events handled**: `start`, `media`, `stop`

## How It Works

```
┌─────────────┐
│  Twilio     │
│  Phone Call │
└──────┬──────┘
       │
       │ (1) Incoming call to your number
       ↓
┌──────────────────┐
│ POST /twiml      │ (2) Twilio fetches TwiML
└────────┬─────────┘
         │
         │ (3) TwiML response enables Media Stream
         ↓
┌──────────────────────────────┐
│ wss://domain/media-stream    │
└────────┬─────────────────────┘
         │
         │ (4) Twilio WebSocket connects
         ↓
    ┌────────────────┐
    │ Media Stream   │
    │ - start event  │ (5) Audio frames sent
    │ - media events │     (mu-law, 8kHz)
    │ - stop event   │
    └────────┬───────┘
             │
             ↓
    ┌────────────────────────┐
    │ OpenAI Whisper API     │
    │ Transcription          │
    └────────┬───────────────┘
             │
             ↓
    ┌────────────────────────┐
    │ Console Output         │
    │ Real-time transcripts  │
    └────────────────────────┘
```

## Audio Format Details

Twilio sends audio in **mu-law format**:
- **Sample rate**: 8000 Hz (8 kHz)
- **Bit depth**: 8-bit
- **Channels**: Mono (1)
- **Encoding**: mu-law (G.711)
- **Chunk size**: Approximately 160 bytes per 20ms

The server decodes this and sends it to Whisper for transcription.

## Example Output

```
[2024-02-15T10:30:45.123Z] New WebSocket connection established
[2024-02-15T10:30:45.456Z] Event: start
[2024-02-15T10:30:45.789Z] ► Call Started - Call SID: CA123abc456def789ghi012jkl
[2024-02-15T10:30:47.100Z] Transcript (CA123...): Hello, how are you?
[2024-02-15T10:30:48.200Z] Transcript (CA123...): I'm calling about my account.
[2024-02-15T10:31:25.300Z] Event: stop
[2024-02-15T10:31:25.400Z] ◄ Call Ended - Call SID: CA123abc456def789ghi012jkl
[2024-02-15T10:31:25.401Z] WebSocket connection closed
```

## Production Considerations

1. **Whisper Cost**: Each audio chunk calls Whisper. Consider:
   - Batching audio chunks to reduce API calls
   - Implementing audio buffering (e.g., 5-second chunks)
   - Caching repeated phrases

2. **Error Handling**: 
   - Currently logs errors; consider alerting via email/Slack
   - Implement retry logic for transient failures

3. **Persistence**:
   - Transcripts are only logged to console
   - Add database storage (MongoDB, PostgreSQL, etc.)

4. **Rate Limiting**:
   - Consider rate limiting on WebSocket connections
   - Monitor OpenAI API usage

5. **Scaling**:
   - Use multiple workers with PM2 or clustering
   - Consider a job queue (Bull, RabbitMQ) for processing

## Troubleshooting

### "WebSocket connection failed"
- Ensure HTTPS is enabled
- Check Twilio webhook URL (must be public HTTPS)
- Verify firewall/network settings

### "No transcripts appearing"
- Check OPENAI_API_KEY is set correctly
- Verify OpenAI account has available credits
- Check browser console and server logs

### "Audio quality issues"
- Ensure Twilio is configured correctly
- Check network latency to Whisper API
- Consider audio preprocessing

## File Structure

```
.
├── server.js           # Main server implementation
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env                # Environment variables (created by you)
└── README.md           # This file
```

## License

MIT

## Support

For issues with:
- **Twilio**: https://support.twilio.com
- **OpenAI Whisper**: https://platform.openai.com/docs/guides/speech-to-text
- **This code**: Check server logs and ensure all env variables are set
