# jobbot

**Terminal-first AI copilot for job seekers.**

> Tired of being screened by AI? Start applying with AI!

jobbot is a complete job application automation tool that helps you find, analyze, and apply to jobs with AI-generated tailored application packets.

## Features

- **Guided Terminal Onboarding** - Set up your profile, resume, and search preferences
- **Live Job Search** - Pull listings from Remotive and Arbeitnow APIs
- **AI-Powered Scoring** - Rank jobs against your profile with heuristic fit scoring
- **Application Packet Generation** - AI-generated cover letters, resume notes, and application answers
- **Local Storage** - All application data stored locally under `.jobbot/applications/`
- **Modern React UI** - Dashboard, job browser, and application workspace
- **CLI + Web Interface** - Use via terminal commands or modern web UI
- **Comprehensive Testing** - Unit tests, API tests, and service tests included

## Quick Start

### Prerequisites

- Node.js 20+
- OpenAI API key (optional - works in demo mode without it)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd jobbot

# Install dependencies
npm install
cd ui && npm install && cd ..
```

### Configuration

```bash
# Copy environment file
copy .env.example .env

# Add your OpenAI API key (optional)
# Edit .env and add:
OPENAI_API_KEY=your_key_here
```

### Initialize Profile

```bash
# Interactive setup
node index.js init --resume ./examples/sample-resume.md

# Or one-shot setup
node index.js init --name "Alex Candidate" \
  --email "alex@example.com" \
  --location "Berlin" \
  --roles "Product Operations Manager, Product Analyst" \
  --skills "workflow automation, data analysis, writing" \
  --experience 5 \
  --remote-preference remote-first \
  --summary "Operator focused on systems and execution." \
  --resume ./examples/sample-resume.md \
  --search-query operations \
  --search-location Remote \
  --non-interactive true
```

## Usage

### CLI Commands

```bash
# Guided workflow
node index.js guide

# Search for jobs
node index.js search --query "product designer" --limit 10

# Batch mode - search and generate applications
node index.js autopilot --query "product designer" --top 3

# Check system health
node index.js doctor
```

### Web UI

```bash
# Terminal 1: Start the API server
npm run api:dev

# Terminal 2: Start the UI dev server
npm run ui:dev

# Or build for production
npm run ui:build
```

The UI will be available at `http://localhost:3000` and connects to the API at `http://localhost:8787/api`.

### Demo Mode

Try without API keys:

```bash
node index.js search --query "operations" --demo true
```

## Architecture

```
jobbot/
├── src/
│   ├── index.js              # CLI entry point
│   ├── server.js             # Express API server
│   ├── commands/            # CLI commands (init, guide, search, autopilot)
│   ├── services/            # Core services (AI, jobs, scoring, applications)
│   └── lib/                # Utilities (config, store, UI helpers)
├── ui/                      # React/Vite frontend
│   ├── src/
│   │   ├── pages/          # Dashboard, Jobs, Applications, Settings
│   │   ├── components/     # Reusable UI components
│   │   └── lib/api/       # API client
│   └── dist/               # Production build output
├── tests/                   # Test suite
└── .jobbot/                # Local data directory (created on init)
    ├── config.json         # User configuration
    ├── resume.md           # User resume
    └── applications/       # Generated application packets
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/profile` | GET/PUT | Get/update user profile |
| `/api/settings` | GET/PUT | Get/update settings |
| `/api/dashboard` | GET | Dashboard statistics |
| `/api/jobs` | GET | Search jobs |
| `/api/jobs/:id` | GET | Get specific job |
| `/api/applications` | GET/POST | List/create applications |
| `/api/applications/:id` | GET/PATCH | Get/update application |
| `/api/data` | DELETE | Reset all data |

## Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:api
npm run test:services
```

## Production Deployment

### Building for Production

```bash
# Build the UI
npm run ui:build

# The dist/ folder contains the production build
# Serve it with any static file server
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - |
| `JOB_BOT_OPENAI_API_KEY` | Alternative OpenAI key var | - |
| `JOB_BOT_UI_API_PORT` | API server port | 8787 |
| `VITE_JOB_BOT_API_URL` | UI API URL | http://localhost:8787/api |

## Application Workflow

1. **Setup** - Initialize your profile with `jobbot init`
2. **Search** - Find matching jobs with `jobbot search`
3. **Score** - Jobs are ranked by compatibility with your profile
4. **Generate** - Create tailored application packets with AI
5. **Review** - Edit and refine in the web UI workspace
6. **Submit** - Copy finalized materials and apply manually

## Output

Each generated application gets its own folder:

```text
.jobbot/
  applications/
    2026-04-23-company-role/
      application.json
      application-answers.md
      checklist.md
      cover-letter.md
      job-summary.md
      resume-tailoring.md
```

The packet is designed so the last manual step is the final application review and send action.

## AI Behavior

If `OPENAI_API_KEY` or `JOB_BOT_OPENAI_API_KEY` is present, jobbot will call the OpenAI Chat Completions API and ask for structured JSON output.

If no key is present, jobbot still works in fallback mode by generating deterministic drafts from your profile and the job description.

## Notes

- Resume and base cover letter imports are currently text-first. Markdown and `.txt` files work best.
- Live job sources can fail or rate-limit. jobbot caches the latest search results and will reuse them when necessary.
- Public APIs and job-board terms can change. Review source usage before large-scale automation.
- Final submission remains manual by design.

## Public Sources Used

- Remotive Jobs Public API: https://remotive.com/remote-jobs/api
- Arbeitnow Job Board API overview: https://www.arbeitnow.com/blog/job-board-api
- OpenAI API overview: https://platform.openai.com/docs/overview/
- OpenAI Chat Completions API reference: https://platform.openai.com/docs/api-reference/chat/create-chat-completion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
