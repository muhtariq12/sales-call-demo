# Deployment to Render

This guide walks you through deploying this Twilio call transcription server to Render.com (free tier).

## Prerequisites

- GitHub account with your code pushed
- Render.com account (free)
- Twilio credentials (Account SID, Auth Token, Phone Number)
- OpenAI API key

## Step 1: Push Code to GitHub

```bash
# If you haven't created a GitHub repo yet:
# 1. Go to github.com and create a new repository
# 2. Copy the repository URL

# Then run:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Create Render Account

1. Go to **render.com**
2. Click "Get Started" (it's free!)
3. Sign up with GitHub

## Step 3: Deploy from GitHub

1. Go to render.com dashboard
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repository
4. Fill in the form:
   - **Name**: `twilio-call-transcription`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter if you want to avoid cold starts)

5. Click **"Advanced"** and add environment variables:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `TWILIO_ACCOUNT_SID` = your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` = your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER` = your Twilio phone number (e.g., +14633484572)
   - `DOMAIN` = your Render URL (e.g., `twilio-call-transcription.onrender.com`)
   - `NODE_ENV` = `production`

6. Click **"Create Web Service"**

Render will automatically:
- Pull your code from GitHub
- Install dependencies
- Start the server
- Give you a public HTTPS URL

## Step 4: Configure Twilio

Once your Render service is deployed, you'll get a URL like:
```
https://twilio-call-transcription.onrender.com
```

1. Update your Twilio webhook (optional for outgoing calls):
   - Go to Twilio Console → Phone Numbers
   - Set voice webhook to: `https://twilio-call-transcription.onrender.com/twiml`

2. Update your local `.env` DOMAIN:
   ```env
   DOMAIN=twilio-call-transcription.onrender.com
   ```

## Step 5: Test on Production

```bash
# From your local machine, test the deployed server:
curl https://twilio-call-transcription.onrender.com/health

# Or test outgoing calls (update with your phone number):
node test-outgoing-call.js "+971507168945"
```

## Monitoring

1. View logs in Render dashboard:
   - Go to your service
   - Click **"Logs"** tab

2. View real-time logs:
   ```bash
   # Render doesn't have CLI, but you can check the dashboard
   ```

## Troubleshooting

### Service won't start
- Check the Logs tab in Render dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct `start` script

### WebSocket connection failing
- Check that your `DOMAIN` environment variable matches your Render URL
- Verify Twilio can reach your server: `curl https://your-render-url/health`

### "Cannot find module" errors
- Render runs `npm install` automatically, but try redeploying
- Click "Manual Deploy" → "Deploy latest commit" in Render dashboard

## Auto-Deploy from GitHub

Render automatically redeploys whenever you push to GitHub:

```bash
git add .
git commit -m "Update transcription logic"
git push origin main
# Render will automatically rebuild and deploy!
```

## Free Tier Limitations

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- For production with no downtime, upgrade to Starter ($7/month)

## Next Steps

1. WebSocket should now work properly on Render
2. Implement the Whisper transcription logic in `server.js`
3. Add database storage for transcriptions
4. Set up monitoring and alerts

## Questions?

- Render docs: https://render.com/docs
- Twilio docs: https://www.twilio.com/docs
