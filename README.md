# ProPredict 2.0

**Real-time sports intelligence arbitrage platform.**

Built by GREYWORK™ · BMAD Master deployment · Claude Sonnet 4.6 AI engine

---

## Architecture

```
Edge Workers (47 books) → Upstash Kafka → AI Engine → tRPC API → Next.js 14 Frontend
```

Five independent layers. Each replaceable without touching the others. See `BMAD Architecture Command Center` for the full system diagram.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router + React 18 |
| Auth | Clerk (per-user isolation, JWT) |
| Database | Neon (Postgres) + Prisma |
| Cache | Upstash Redis |
| Message Bus | Upstash Kafka |
| Real-time | Pusher Channels |
| AI | Claude Sonnet 4.6 (Anthropic) |
| Background Jobs | Trigger.dev |
| Email | Resend + React Email |
| Deployment | Vercel (frontend) + Railway (Python ML) |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/greywork/propredict.git
cd propredict
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for descriptions
```

Required services to provision:
- [Neon](https://neon.tech) — Postgres database
- [Clerk](https://clerk.com) — Authentication
- [Upstash](https://upstash.com) — Redis + Kafka
- [Pusher](https://pusher.com) — WebSocket
- [Anthropic](https://console.anthropic.com) — Claude API key
- [The Odds API](https://the-odds-api.com) — Sports odds
- [SportsDataIO](https://sportsdata.io) — Scores, injuries, schedules
- [Trigger.dev](https://trigger.dev) — Background jobs
- [Resend](https://resend.com) — Transactional email
- [Pinecone](https://pinecone.io) — Vector database

### 3. Database setup

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Neon
npm run db:seed       # Seed initial data (teams, model version)
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Start background jobs (separate terminal)

```bash
npm run trigger:dev
```

---

## Project Structure

```
src/
├── app/                     # Next.js 14 App Router pages
│   ├── dashboard/           # Main dashboard (SSR)
│   ├── nfl/ nba/ ufc/ ...  # Sport pages
│   ├── live/                # Live tracker
│   ├── portfolio/           # CLV-first bankroll tracker
│   ├── analytics/           # Model calibration
│   ├── ai/                  # AI chat assistant
│   └── api/                 # API routes
│       ├── ai/chat/         # Claude chat endpoint
│       └── webhooks/        # Pusher + Clerk webhooks
├── components/
│   ├── dashboard/           # StatsOverview, SharpAlertsFeed, LiveGames
│   ├── predictions/         # PredictionCard, PredictionList
│   ├── portfolio/           # CLVTracker, BankrollChart, BettingHistory
│   ├── sports/              # SportPageClient (NFL/NBA/etc template)
│   ├── ai/                  # Chat components
│   └── shared/              # Sidebar, CommandPalette, QueryProvider
├── lib/
│   ├── db/                  # Prisma client, Redis helpers
│   ├── ai/                  # Claude prediction engine, CLV calculator
│   └── sports/              # Odds API, SportsDataIO, sharp inference
├── types/                   # TypeScript types (all derived from Prisma)
└── styles/                  # Design system (Dark Signal tokens)

prisma/
├── schema.prisma            # Full database schema
└── seed.ts                  # Initial data seed

trigger/
└── jobs.ts                  # All cron jobs (odds, scores, predictions, settlement)
```

---

## Key Features

### CLV-First Portfolio
Every bet tracks opening line, line at bet time, and closing line. CLV (Closing Line Value) is calculated automatically on settlement. This is the single most important metric in sports betting — it determines long-term profitability regardless of short-term W/L record.

### Sharp Money Inference
The sharp inference engine detects:
- **Reverse Line Movement (RLM)**: Line moves opposite to public betting direction
- **Steam Moves**: Sudden simultaneous movement across 70%+ of books
- **Significant Moves**: Any 1.5+ point movement worth monitoring

Alerts fire in real-time via Pusher to all subscribed users.

### AI Prediction Engine
Claude Sonnet 4.6 generates pre-game predictions daily at 6 AM. Each prediction includes:
- Structured pick (spread/total/ML) with confidence 0-100
- Expected value and Kelly percentage
- Key factors (reasons FOR the pick)
- Risk factors (reasons AGAINST)
- Contrarian case (the other side)
- CLV tracked on settlement

### AI Chat Assistant
Natural language queries over your personal portfolio + live market data:
- "What's my worst performing bet type?"
- "Is there sharp money on any games tonight?"
- "Show me my CLV by sport"
- "What are the best value picks today?"

### Zero Hardcoded Stats
ESLint rule prevents hardcoded stat strings. Every metric is computed from real data. If the database is empty, the UI shows clean empty states with CTAs — never fake numbers.

---

## Cron Schedule

| Job | Schedule | Purpose |
|---|---|---|
| `ingest-odds` | Every 2 min | Fetch odds from 47 books, detect line movements |
| `live-scores` | Every 5 min | Update live game scores |
| `generate-predictions` | Daily 6 AM | AI predictions for next 24h games |
| `settle-games` | Nightly 11 PM | Mark predictions won/lost, calculate CLV |
| `weekly-recap-email` | Monday 6 AM | Personalized performance summary |

---

## Design System: Dark Signal

- **Background**: `#070810` (near-black with blue undertone)
- **Accent Edge**: `#00E5FF` (electric cyan — live/sharp signals)
- **Accent Win**: `#00FF88` (positive EV, wins)
- **Accent Loss**: `#FF3D5A` (negative, risk)
- **Accent Gold**: `#FFD166` (medium confidence)
- **Display font**: Space Grotesk
- **Body font**: Inter
- **Mono font**: JetBrains Mono (all odds/numbers)
- **Signature**: The Signal Bar — animated gradient line at top of every game card. Pulses cyan for sharp money, green for wins, muted otherwise.

---

## Roadmap

See `propredict2_bmad_architecture.html` for the full 24-sprint delivery plan.

**Next milestones:**
- [ ] SportsDataIO integration for live scores
- [ ] Pusher WebSocket real-time alerts
- [ ] Player props entity + predictions
- [ ] Parlay builder + Kelly optimizer
- [ ] Social pick sharing (html2canvas)
- [ ] Gamification (badges, streaks, leaderboard)

---

## License

GREYWORK™ — All rights reserved.
