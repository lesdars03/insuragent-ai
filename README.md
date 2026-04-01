# 🤖 InsurAgent AI — Setup Guide

## Complete Beginner's Guide to Running the App

---

## PREREQUISITES (One-Time Setup)

Before anything, you need 2 things installed on your computer:

### 1. Install Node.js

Node.js is the engine that runs the app.

1. Go to: **https://nodejs.org**
2. Click the big green button that says **"LTS"** (recommended)
3. Download and run the installer
4. Click "Next" through everything (keep all defaults)
5. Restart VS Code after installing

**Verify it worked:** Open VS Code terminal (press `` Ctrl + ` ``) and type:

```
node --version
```

You should see something like `v20.x.x`. If you see an error, restart your computer and try again.

### 2. Install Git (Optional but Recommended)

1. Go to: **https://git-scm.com/downloads**
2. Download and install for your OS
3. Keep all defaults during installation

---

## STEP-BY-STEP: Running the App

### Step 1: Open the Project Folder

1. In VS Code, go to **File → Open Folder**
2. Navigate to the `insuragent-ai` folder you downloaded
3. Click "Select Folder"

You should see these files in the left sidebar:
```
insuragent-ai/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx        ← This is the main app
│   └── index.js       ← This loads the app
├── package.json       ← This lists what the app needs
└── README.md          ← This file
```

### Step 2: Open the Terminal

In VS Code, press `` Ctrl + ` `` (backtick key, above Tab) to open the terminal.

Make sure it says `insuragent-ai` in the terminal path. If not, type:
```
cd insuragent-ai
```

### Step 3: Install Dependencies

This downloads everything the app needs to run. Type:

```
npm install
```

⏳ This will take 1-3 minutes. You'll see a progress bar.
You'll see some "warnings" — that's normal, ignore them.
When it's done, you'll see a new `node_modules` folder appear.

### Step 4: Start the App

```
npm start
```

⏳ Wait 15-30 seconds. Then:
- Your browser will automatically open to **http://localhost:3000**
- You'll see the InsurAgent AI dashboard! 🎉

### Step 5: Use the App

The app is now running! Here's what you can do:

| Sidebar Icon | What It Does |
|---|---|
| ⚡ Command | Your mission control — AI actions queue, pipeline overview |
| 📊 Pipeline | Kanban board of all clients by stage |
| 👤 Clients | Full client list with search and edit |
| 🧠 AI Chat | Talk to your AI copilot (needs internet) |
| 💰 Earnings | Commission forecasting and policy book |
| 👥 Team | Team management and leaderboard |
| 🌐 Prospect Bot | Customer-facing chatbot preview |

---

## HOW TO STOP THE APP

In the VS Code terminal, press `Ctrl + C` and type `Y` then Enter.

## HOW TO RESTART THE APP

Just run `npm start` again in the terminal.

---

## COMMON ISSUES & FIXES

### "npm is not recognized"
→ Node.js isn't installed. Go back to Prerequisites Step 1.

### "EACCES permission denied"
→ On Mac/Linux, try: `sudo npm install`

### "Module not found"
→ Run `npm install` again. If that doesn't work, delete the `node_modules` folder and run `npm install` again.

### The page is blank
→ Open browser developer tools (F12), check the Console tab for errors.
→ Make sure you have an internet connection (the app loads fonts from Google).

### AI Chat says "AI temporarily unavailable"
→ The AI features use the Anthropic API. In this demo, it works when viewed inside Claude artifacts. For standalone deployment, you'll need to add your own API key (see Deployment section below).

---

## CUSTOMIZING THE APP

### Change Client Data
Open `src/App.jsx` and find `DEMO_CLIENTS` near the top. Edit the names, phone numbers, products, etc.

### Change Products
Find `PRODUCTS` array and add/remove insurance products.

### Change Commission Rates
Find `COMM_RATES` and adjust the percentages:
```javascript
const COMM_RATES = {
  year1: 0.30,    // 30% first year
  year2: 0.15,    // 15% second year
  renewal: 0.05   // 5% renewals
};
```

### Change Team Members
Find `DEMO_TEAM` and edit names, roles, targets.

---

## DEPLOYING TO THE INTERNET (So Others Can Use It)

### Option A: Vercel (Easiest — Free)

1. Go to **https://vercel.com** and sign up with GitHub
2. Push your project to GitHub:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/insuragent-ai.git
   git push -u origin main
   ```
3. In Vercel, click "Import Project" → select your GitHub repo
4. Click "Deploy"
5. Your app will be live at `https://insuragent-ai.vercel.app` 🎉

### Option B: Netlify (Also Free)

1. Run `npm run build` to create a production build
2. Go to **https://app.netlify.com/drop**
3. Drag the `build` folder into the browser
4. Your app is live! 🎉

---

## ADDING REAL AI (API Key Setup)

The AI Chat and Prospect Bot use the Anthropic API. To make them work in production:

1. Get an API key from **https://console.anthropic.com**
2. In your project, create a file called `.env` in the root folder:
   ```
   REACT_APP_ANTHROPIC_KEY=sk-ant-your-key-here
   ```
3. In `src/App.jsx`, find the `callAI` function and update the fetch headers:
   ```javascript
   headers: {
     "Content-Type": "application/json",
     "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
     "anthropic-version": "2023-06-01"
   }
   ```

⚠️ **IMPORTANT:** Never expose API keys in frontend code for production.
For a real SaaS product, you'd route API calls through your own backend server.

---

## NEXT STEPS FOR A REAL SAAS PRODUCT

To turn this into a real product, you'd want to add:

1. **Backend server** (Node.js/Express or Python/FastAPI) for API key security
2. **Database** (Supabase, Firebase, or PostgreSQL) to store real client data
3. **Authentication** (Clerk, Auth0, or Supabase Auth) for agent logins
4. **Real-time sync** so team members see live updates
5. **SMS/Viber integration** (Twilio, MessageBird) to actually send messages
6. **Stripe** for subscription billing if selling as SaaS

---

Built with ❤️ for Filipino insurance agents 🇵🇭
