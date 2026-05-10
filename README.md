# AI Booking Demo — Deployment Guide

## Project Structure
```
vercel-deploy/
  public/
    index.html      ← The demo page (served to clients)
  api/
    chat.js         ← Serverless proxy (API key lives here, hidden from clients)
  vercel.json       ← Vercel routing config
```

---

## Step 1 — Push to GitHub

1. Create a new repository on github.com (name it e.g. `ai-booking-demo`)
2. In your terminal (or VS Code terminal):
```bash
cd vercel-deploy
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-booking-demo.git
git push -u origin main
```

---

## Step 2 — Deploy to Vercel

1. Go to **vercel.com** → Sign up free with GitHub
2. Click **"Add New Project"** → Import your `ai-booking-demo` repo
3. Leave all settings as default → Click **Deploy**
4. Your site goes live at `https://ai-booking-demo.vercel.app`

---

## Step 3 — Add your API key (SECURE)

This is the critical step. Your API key goes into Vercel — NOT into the HTML file.

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add one of these:
   - Name: `GROQ_API_KEY`   Value: `gsk_your_key_here`
   - Name: `GEMINI_API_KEY` Value: `AIza_your_key_here`
3. Click **Save**
4. Go to **Deployments** → **Redeploy** (to apply the new env variable)

---

## Step 4 — Update index.html to use the proxy

In `public/index.html`, find this in the JS:
```js
const GROQ_KEY_DEFAULT   = '';
const GEMINI_KEY_DEFAULT = '';
```

Leave them EMPTY. The HTML already calls `/api/chat` if those are empty
(the `getReply` function will fall back to the proxy automatically once
you update it — see the "Proxy Mode" section below).

### Enabling Proxy Mode
In `public/index.html`, find the `getReply` function and replace the
direct Groq/Gemini fetch with this single call:

```js
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: history.map(m => ({ role: m.role, content: m.content })),
    systemPrompt: buildPrompt()
  })
});
if (!res.ok) throw new Error('Server error ' + res.status);
const data = await res.json();
reply = data.reply;
```

This means:
- Clients NEVER see your API key (it's on Vercel's server)
- You can update the key in Vercel without touching the HTML file
- Zero security risk when sharing the demo URL

---

## Is it safe to send the URL to clients?

**YES — with the proxy set up.** Here is what each person can see:

| What            | Client sees? | You see?  |
|-----------------|--------------|-----------|
| Demo page       | ✅ Yes       | ✅ Yes    |
| API key         | ❌ No        | ✅ Yes    |
| Admin panel     | ❌ No*       | ✅ Yes    |
| Chat history    | ❌ No        | ❌ No     |
| Your KB/prompts | ❌ No        | ✅ Yes    |

*Admin panel (Ctrl+Shift+K) is hidden from clients by default since they don't know the shortcut. For extra security, add a password check before openAdmin() is called.

---

## Sending to Clients

Once live, your demo URL will look like:
`https://ai-booking-demo.vercel.app`

When a client visits, they click "Launch Demo", fill in their business name and details, and the chatbot responds as if it's their own AI agent. This is your sales tool.

**Suggested email subject line:**
"Here's a live preview of your AI booking agent"
