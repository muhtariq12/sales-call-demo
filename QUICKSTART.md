# Twilio Media Streams Real-time Transcription Server

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Run server:**
   ```bash
   npm start
   ```

4. **Expose with ngrok (for testing):**
   ```bash
   ngrok http 3000
   # Note the https://abc123.ngrok.io URL
   ```

5. **Configure Twilio:**
   - Go to Twilio Console → Phone Numbers
   - Select your number
   - Set "A Call Comes In" webhook to: `https://yourdomain.com/twiml` (POST)
   - Save

6. **Call your number** - transcripts appear in real-time!

## Project Structure

- `server.js` - Main server with WebSocket, Express, and Whisper integration
- `package.json` - Dependencies and scripts
- `.env.example` - Environment variables template
- `TWILIO_SETUP.js` - TwiML examples and Twilio configuration guide
- `README.md` - Full documentation

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key from https://platform.openai.com/api-keys |
| `PORT` | ❌ No | 3000 | HTTP server port |

## Key Features

- ✅ Real-time audio transcription via WebSocket
- ✅ Handles Twilio Media Stream events (start, media, stop)
- ✅ Base64 audio decoding (mu-law format)
- ✅ OpenAI Whisper integration
- ✅ Proper error handling and cleanup
- ✅ Health check endpoint
- ✅ Auto-generated TwiML responses
- ✅ Detailed logging with timestamps

## How It Works

```
Phone Call → Twilio → /twiml endpoint
    ↓
TwiML response with <Stream>
    ↓
WebSocket /media-stream
    ↓
Decode audio chunks
    ↓
OpenAI Whisper transcription
    ↓
Console output (real-time)
```

## Example Output

```
[2024-02-15T10:30:45.123Z] New WebSocket connection established
[2024-02-15T10:30:45.456Z] Event: start
[2024-02-15T10:30:45.789Z] ► Call Started - Call SID: CAxxxxx
[2024-02-15T10:30:47.100Z] Transcript (CAxxxxx): Hello, how are you?
[2024-02-15T10:30:48.200Z] Transcript (CAxxxxx): I'm calling about my account.
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Connection failed | Ensure HTTPS is enabled and domain is public |
| No transcripts | Check OPENAI_API_KEY and OpenAI account credits |
| Slow transcription | Audio chunks may be too small; consider batching |

## For Production

1. Add database storage (MongoDB, PostgreSQL)
2. Implement audio buffering (batch chunks)
3. Add monitoring/alerting (Sentry, DataDog)
4. Rate limiting on WebSocket
5. Use PM2 or clustering for scaling
6. Consider CDN for TwiML responses

See `TWILIO_SETUP.js` for detailed Twilio configuration and `README.md` for full documentation.
