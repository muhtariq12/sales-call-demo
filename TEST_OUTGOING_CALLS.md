# Testing Outgoing Calls

The server is now running and ready to make outgoing calls! Here's how to test it:

## Prerequisites

✅ Server is running on `http://localhost:3000`
✅ `.env` file has valid Twilio credentials:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`  
   - `TWILIO_PHONE_NUMBER`
✅ `OPENAI_API_KEY` is configured

## Option 1: Using the Test Script (Recommended)

Run the test script with a phone number:

```bash
node test-outgoing-call.js "+1234567890"
```

Replace `+1234567890` with an actual phone number (your own phone number is great for testing!).

**Example:**
```bash
node test-outgoing-call.js "+14155552671"
```

## Option 2: Using curl

```bash
curl -X POST http://localhost:3000/outgoing-call \
  -H "Content-Type: application/json" \
  -d '{"toNumber": "+1234567890"}'
```

## Option 3: Using fetch in Node.js

```javascript
fetch('http://localhost:3000/outgoing-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ toNumber: '+1234567890' })
})
.then(r => r.json())
.then(data => console.log(data));
```

## What Happens During the Call

1. **Call Initiated**: Twilio makes the outgoing call to the specified number
2. **TwiML Response**: The call connects to your server's `/twiml` endpoint
3. **Media Stream**: Twilio opens a WebSocket connection and streams the audio
4. **Real-time Transcription**: The audio is sent to OpenAI Whisper for transcription
5. **Logs**: Transcripts appear in real-time in the server console
6. **Call Ends**: When you hang up, the WebSocket connection closes

## Expected Server Output

When you make an outgoing call, you should see in the server logs:

```
[2026-02-25T...] Initiating outgoing call from +1234567890 to +1111111111
[2026-02-25T...] Call created: CA1234567890abcdef
[2026-02-25T...] New WebSocket connection established
[2026-02-25T...] Event: start
[2026-02-25T...] ► Call Started - Call SID: CA1234567890abcdef
[2026-02-25T...] Event: media
[2026-02-25T...] Transcript (CA1234567890abcdef): Hello, can you hear me?
[2026-02-25T...] Event: media
[2026-02-25T...] Transcript (CA1234567890abcdef): This is a test call.
[2026-02-25T...] Event: stop
[2026-02-25T...] ◄ Call Ended - Call SID: CA1234567890abcdef
[2026-02-25T...] WebSocket connection closed
```

## Testing Tips

- **Use your own number first** - Call yourself to hear the greeting and see how the transcription works
- **Watch the server logs** - All activity is logged in real-time
- **Check call duration** - Your Twilio account shows all calls made
- **Test different accents/languages** - Whisper handles multiple languages well
- **Try speaking at different speeds** - Test how the system handles fast/slow speech

## Troubleshooting

### "TWILIO_PHONE_NUMBER not configured"
- Make sure `.env` has your Twilio phone number in E.164 format (e.g., `+11234567890`)

### "Missing credentials"
- Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set in `.env`
- These are available in your [Twilio Console](https://console.twilio.com/)

### Call doesn't connect
- Make sure your Twilio account has credits or an active trial account
- Verify the phone number is in E.164 format: `+<country_code><number>`

### No transcripts in logs
- Check that `OPENAI_API_KEY` is valid
- Make sure there's actual audio during the call (not just silence)

### Server won't start
- Check that port 3000 is available: `lsof -i :3000`
- Install dependencies: `npm install`

## Next Steps

Once outgoing calls work:
1. Try **incoming calls** by setting the webhook on your Twilio number
2. Add call **recording storage** to save transcripts
3. Implement **real-time streaming** to your app UI
4. Add **analytics** to track call metrics
5. Create **custom greetings** based on the caller ID
