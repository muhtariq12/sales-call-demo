#!/usr/bin/env node

/**
 * Test script to initiate an outgoing call
 * 
 * Usage: node test-outgoing-call.js <phone_number>
 * Example: node test-outgoing-call.js "+14155552671"
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const toNumber = process.argv[2];

if (!toNumber) {
  console.error('Usage: node test-outgoing-call.js <phone_number>');
  console.error('Example: node test-outgoing-call.js "+14155552671"');
  process.exit(1);
}

console.log(`📞 Initiating outgoing call to ${toNumber}...`);
console.log(`📡 Server: ${serverUrl}`);

fetch(`${serverUrl}/outgoing-call`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    toNumber: toNumber,
  }),
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log('✅ Call initiated successfully!');
      console.log(`📞 Call SID: ${data.callSid}`);
      console.log(`From: ${data.from}`);
      console.log(`To: ${data.to}`);
      console.log('');
      console.log('The call should be connected now. Check your phone and the server logs for transcription.');
    } else {
      console.error('❌ Error initiating call:');
      console.error(data);
    }
  })
  .catch((error) => {
    console.error('❌ Failed to initiate call:');
    console.error(error.message);
  });
