# Deploy .stack to Vercel

## Step 1: Push to GitHub

Ensure your code is in a GitHub repository:

```bash
cd c:\Users\Admin\Documents\.stack
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub)
2. Click **Add New** → **Project**
3. Import your repository
4. **Important:** Set **Root Directory** to `stack-app` (the Next.js app lives here)
5. Vercel will auto-detect Next.js

## Step 3: Add Environment Variables

In **Project Settings** → **Environment Variables**, add:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes* |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes* |
| `RATE_LIMIT` | e.g. `120` (optional) | No |
| `MAX_TOKENS` | e.g. `4096` (optional) | No |

*At least one of OPENAI_API_KEY or ANTHROPIC_API_KEY is required.

## Step 4: Deploy

Click **Deploy**. Vercel will build and deploy. You’ll get a URL like `https://your-project.vercel.app`.

## Deploy via Vercel CLI

From the `.stack-app` folder:

```bash
cd .stack-app
npx vercel
```

Follow prompts to log in and link the project. Add env vars in the Vercel dashboard or with:

```bash
vercel env add OPENAI_API_KEY
```
