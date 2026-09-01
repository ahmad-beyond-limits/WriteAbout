# WriteAbout Monorepo

> A production-grade Turborepo monorepo housing the **WriteAbout** image-writing challenge platform and the **SwiftType** minimalist speed typing application, built with Next.js, TypeScript, Tailwind CSS, and Neon PostgreSQL (Drizzle ORM).

---

## 🏛️ Monorepo Architecture

```text
WriteAbout/
│
├── apps/
│   ├── web/              # WriteAbout: Timed image-description AI practice app (Next.js, port 3000)
│   └── typing/           # SwiftType: Minimalist speed typing test app (Next.js, port 3001)
│
├── packages/
│   ├── db/               # Neon PostgreSQL client, Drizzle ORM schemas, migrations & seeders
│   ├── auth/             # PBKDF2 password hashing & symmetric AES-256-CBC API key encryption
│   ├── types/            # Shared domain, auth, and typing engine TypeScript interfaces
│   ├── validation/       # Zod schemas for request validation & server sanity checks
│   └── ui/               # Reusable design system primitives (Button, Card, Input, Badge)
│
├── scripts/
│   └── test_all.ts       # Automated end-to-end integration test runner
│
├── .env.example          # Template environment variable file
├── package.json          # Root workspace scripts & dependencies
└── turbo.json            # Turborepo task pipeline configuration
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.17.0+
- **npm**: v10.0+
- **Neon PostgreSQL**: Connection string via `POSTGRES_URL` or `DATABASE_URL`

### 2. Installation
Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/ahmad-beyond-limits/WriteAbout.git
cd WriteAbout
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` at the root of the workspace:

```bash
cp .env.example .env
```

Ensure your `.env` contains your Neon PostgreSQL connection string:
```ini
POSTGRES_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
GROQ_API_KEY=gsk_...
GROQ_MODEL_NAME=qwen/qwen3.6-27b
ENCRYPTION_KEY=a_very_secure_secret_key_32_bytes_long!!
```

### 4. Database Setup & Seeding
Run automated migrations and seed initial vocabulary lists (389 words across 3 word sets):

```bash
npm run db:migrate
npm run db:seed
```

### 5. Running Locally

#### Run all apps in parallel:
```bash
npm run dev
```

#### Run applications individually:
- **WriteAbout App** (`http://localhost:3000`):
  ```bash
  npm run dev:web
  ```
- **SwiftType Speed Typing App** (`http://localhost:3001`):
  ```bash
  npm run dev:typing
  ```

---

## ⚡ Applications & Features

### 1. SwiftType (`apps/typing`)
- **Real-Time Typing Engine**: Low-latency character tracking with smooth caret animation, instant WPM, raw WPM, accuracy, consistency, and character error breakdowns.
- **Customizable Modes**:
  - `time`: 15s, 30s, 60s, 120s
  - `words`: 10, 25, 50, 100
  - `custom`: Configurable word counts
  - `punctuation` & `numbers` toggles
- **Multi-Set Vocabulary**: Word sets stored directly in Neon PostgreSQL (`English Standard`, `English 1k`, `Tech & Code`).
- **Web Audio Sound Synthesizer**: Built-in mechanical keyboard click and error audio synthesis (no external MP3 assets needed).
- **Themes & Customization**: 5 curated themes (Dark, Light, Nord, Serika, Matrix), custom font selectors (Inter, Roboto Mono, JetBrains Mono, Fira Code), and font size sliders.
- **Leaderboards & Analytics**: Verified score submissions, paginated test history, and interactive Recharts progression graphs on user profile.

### 2. WriteAbout (`apps/web`)
- **60-Second Timed Writing**: Random image prompts with a live countdown timer.
- **Groq AI Grading**: Real-time evaluation scoring and feedback.
- **Personal Insights**: 7-day API usage and monthly score breakdown dashboards.
- **Encrypted Key Storage**: AES-256-CBC encryption of user API keys at rest.

---

## 🛠️ Verification & Quality Gate

```bash
# Typecheck all 7 workspace packages and applications
npm run typecheck

# Build all applications for production
npm run build

# Run end-to-end integration tests (Auth, Database, Typing Engine, Stats)
npx tsx scripts/test_all.ts
```
