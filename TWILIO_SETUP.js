/**
 * SAMPLE TWIML RESPONSE FOR TWILIO MEDIA STREAMS
 * 
 * This demonstrates the TwiML XML that Twilio expects from your webhook.
 * The server.js file generates this automatically at POST /twiml
 * 
 * The key element is <Stream> which enables Media Streams
 */

// Example 1: Basic transcription with greeting
const basicTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Your call is being recorded and transcribed in real time.</Say>
  <Stream url="wss://yourdomain.com/media-stream" />
  <Hangup />
</Response>`;

// Example 2: Transcription with menu
const twiMLWithMenu = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to customer support.</Say>
  <Stream url="wss://yourdomain.com/media-stream" />
  <Gather numDigits="1" timeout="10">
    <Say>Press 1 for billing, 2 for technical support, or 3 to speak with an agent.</Say>
  </Gather>
  <Say>Thank you for your call.</Say>
  <Hangup />
</Response>`;

// Example 3: Dynamic URL (server-side example)
const dynamicTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Connecting to transcription service.</Say>
  <Stream url="wss://{process.env.TWILIO_DOMAIN}/media-stream" />
</Response>`;

/**
 * TWILIO VOICE WEBHOOK CONFIGURATION
 * 
 * How to set this up in Twilio Console:
 * 
 * 1. Go to https://console.twilio.com/
 * 2. Navigate to: Phone Numbers → Active Numbers
 * 3. Click on the phone number you want to configure
 * 4. Under "Voice & Fax" section:
 *    - Find "A Call Comes In" field
 *    - Set the webhook URL to: https://yourdomain.com/twiml
 *    - Set Method to: POST
 *    - Click "Save"
 * 
 * 5. Test by calling the number - your server should receive the request
 */

/**
 * WHAT HAPPENS WHEN SOMEONE CALLS
 * 
 * Step 1: Call arrives at Twilio phone number
 * Step 2: Twilio makes POST request to https://yourdomain.com/twiml
 * Step 3: Your server returns the TwiML response with <Stream> element
 * Step 4: Twilio opens WebSocket connection to: wss://yourdomain.com/media-stream
 * Step 5: Server receives "start" event with call metadata
 * Step 6: Server receives "media" events with audio chunks
 * Step 7: Server sends audio to Whisper API for transcription
 * Step 8: Transcripts are logged in real-time
 * Step 9: When call ends, Twilio sends "stop" event
 * Step 10: Server closes WebSocket connection
 */

/**
 * TWILIO CLI EXAMPLE
 * 
 * Alternative way to set webhook using Twilio CLI:
 * 
 * First, get your phone number SID:
 *   twilio phone-numbers:list
 * 
 * Then update the webhook:
 *   twilio api:core:incoming-phone-numbers:update <YOUR_PHONE_SID> \
 *     --voice-url https://yourdomain.com/twiml \
 *     --voice-method POST
 * 
 * Verify it was set:
 *   twilio api:core:incoming-phone-numbers:fetch <YOUR_PHONE_SID>
 */

/**
 * TWILIO STUDIO ALTERNATIVE
 * 
 * If you prefer using Twilio Studio instead of webhooks:
 * 
 * 1. Go to Studio in Twilio Console
 * 2. Create a new Flow
 * 3. Drag "Start" widget
 * 4. Drag "Webhooks" widget
 * 5. Configure webhook to POST to https://yourdomain.com/media-stream
 * 6. Add "Audio Track" widget set to "Enabled"
 * 7. Deploy the flow
 * 8. Assign flow to your phone number
 */

/**
 * IMPORTANT REQUIREMENTS
 * 
 * ✓ HTTPS Required: Twilio ONLY accepts HTTPS webhooks
 *                   HTTP will NOT work
 * 
 * ✓ Public Domain: The webhook URL must be accessible from the internet
 *                  Localhost/private IPs won't work in production
 * 
 * ✓ WebSocket Secure: Media Stream also requires wss:// (not ws://)
 * 
 * ✓ Timeout: Twilio expects a TwiML response within 5 seconds
 * 
 * ✓ Valid XML: The TwiML must be valid XML with proper encoding
 */

/**
 * DEPLOYMENT OPTIONS FOR HTTPS
 * 
 * For Local Testing:
 *   - Use ngrok: ngrok http 3000
 *   - This gives you a free HTTPS URL
 * 
 * For Production:
 *   - Heroku: heroku create && git push heroku main
 *   - Railway: railway up
 *   - Render: Connect GitHub repo, deploy
 *   - AWS EC2 + Let's Encrypt (certbot)
 *   - DigitalOcean App Platform
 *   - Custom VPS with Nginx + Let's Encrypt
 */

export {
  basicTwiML,
  twiMLWithMenu,
  dynamicTwiML,
};
