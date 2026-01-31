# .stack Code Assistant

A ChatGPT-like web application focused on **coding**, **debugging**, and **code explanation**. Supports both **Claude (Anthropic)** and **GPT (OpenAI)** models with a unique **Code Panel** feature for interactive code exploration.

## Features

- **AI-Powered Chat**: Converse with Claude 3.5 Sonnet or GPT-4o for coding assistance
- **Streaming Responses**: Real-time streaming for faster feedback
- **Syntax Highlighting**: Beautiful code blocks with Prism.js
- **Model Selector**: Switch between Claude and GPT on the fly
- **Dark/Light Mode**: Theme toggle for comfortable coding

### Code Panel (Key Feature)

When the AI provides code, you can open it in a **floating side panel** that:

- Stays visible while you scroll through the chat
- Allows **text selection** to highlight specific portions
- Provides **"Ask about selection"** to ask follow-up questions about highlighted code
- Supports **multiple pinned code blocks** with tabs
- Includes a **mini chat input** for quick contextual questions

This solves the problem of having to scroll up to reference code when asking follow-up questions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| AI Providers | Anthropic SDK, OpenAI SDK |
| Code Highlighting | Prism.js |
| Markdown | react-markdown + remark-gfm |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # Main chat API endpoint
│   │   └── health/route.ts     # Health check endpoint
│   ├── page.tsx                # Main chat page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── chat/                   # Chat UI components
│   ├── code/                   # Code Panel components
│   ├── theme/                  # Theme provider & toggle
│   ├── error/                  # Error boundary
│   └── ui/                     # shadcn/ui components
├── hooks/                      # Custom React hooks
├── lib/
│   ├── ai/                     # AI provider clients
│   └── validators/             # Request validation
└── types/                      # TypeScript interfaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- API keys for Anthropic and/or OpenAI

### Installation

1. Clone the repository and navigate to the project:

```bash
cd sideview-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | Your Anthropic API key for Claude |
| `OPENAI_API_KEY` | Yes* | Your OpenAI API key for GPT |

*At least one API key is required.

## Development

### Agent Roles

This project uses two specialized agent roles for development:

| Agent | Scope | Files |
|-------|-------|-------|
| **Backend Engineer** | API routes, AI integrations | `src/app/api/**`, `src/lib/ai/**`, `src/lib/validators/**` |
| **Frontend Engineer** | React components, UI/UX | `src/components/**`, `src/hooks/**`, `src/app/page.tsx` |

Both agents can modify shared files: `src/types/**`, `src/lib/utils.ts`, `src/lib/errors.ts`

Agent rules are defined in `.cursor/rules/`:
- `be-engineer.mdc` - Backend Engineer boundaries
- `fe-engineer.mdc` - Frontend Engineer boundaries

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## API Endpoints

### POST /api/chat

Send messages to AI models.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How do I sort an array?" }
  ],
  "model": "claude-3-5-sonnet",
  "codeContext": {
    "fullCode": "const arr = [3, 1, 4];",
    "selectedPortion": "arr",
    "language": "javascript"
  }
}
```

**Response:** Server-Sent Events (SSE) stream

### GET /api/health

Returns API status and available models.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Build the production bundle:

```bash
npm run build
npm run start
```

## License

MIT

## Contributing

1. Follow the agent role boundaries when making changes
2. Ensure code passes linting (`npm run lint`)
3. Test with both Claude and GPT models
