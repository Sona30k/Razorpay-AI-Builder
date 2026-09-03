# TechAtlas AI

TechAtlas AI is an interactive 3D map of India's technology ecosystem. It combines a real-geography Earth view, city-scale visualizations, company discovery, and local AI-assisted growth workflows.

```text
Earth -> City -> Company -> Growth Analysis -> Risk Analysis / Growth Plan -> Action Center
```

## What Works Today

- Real Natural Earth country geometry rendered locally on a Three.js globe.
- Geographic markers for Bengaluru, Hyderabad, Pune, Gurugram, and Delhi.
- Interactive city views with visible buildings, roads, parks, water, and company markers.
- Searchable company data by city, company name, category, and industry.
- Company details, AI Growth Analysis, Risk Analysis, Growth Planner, and Action Center.
- Server-side AI provider selection: Gemini for hosted deployments, Ollama for local development, and a deterministic `MOCK_AI_MODE` fallback.
- Merchant Growth uses a compact summary generated from the supplied October and November 2019 e-commerce event archive.
- Demo commerce actions, plus an opt-in Razorpay **test-mode** order and signature-verification boundary. No live payments are enabled.

## Product Flow

### Real Earth View

The landing globe uses the bundled Natural Earth country-boundary dataset in `frontend/public/geodata/`. Land, coastlines, country borders, and the five city positions are derived from geographic coordinates.

### City And Company Discovery

Selecting a city opens a stylized city scene. Buildings, roads, parks, and water are visual layers for orientation; company markers use the local company dataset.

```text
Company list -> Company details -> Explore with AI
```

On desktop, the company list, company details, and analysis occupy separate columns. Smaller screens use focused scrollable panels to prevent overlap.

### Growth Workflows

Growth Analysis uses the selected company's available fields to return structured opportunity, segment, strategy, impact, priority, and KPI data. Users can then:

- Analyze estimated business risks.
- Build a four-action growth plan.
- Mark execution-plan actions complete.
- Open a demo Action Center for a selected action.

Risk output is a TechAtlas estimate based on available information. It is not a financial, credit, legal, or investment rating.

## Local Setup

### Requirements

- Node.js 20+
- Ollama and a local model only when using the local AI provider

### Run Ollama

```bash
ollama serve
ollama pull qwen2.5:0.5b
```

### Configure Environment

Create `frontend/.env.local` from `frontend/.env.example`.

```env
MOCK_AI_MODE=false
MOCK_COMMERCE_MODE=true
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:0.5b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Set `MOCK_AI_MODE=true` to use deterministic development analysis, risk, and planning responses without calling Ollama.

### Start The App

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
cd frontend
pnpm build
```

## Deploy To Vercel

1. Import the GitHub repository into Vercel.
2. In **Project Settings -> General**, set **Root Directory** to `frontend`.
3. Vercel uses `frontend/vercel.json` and the committed `pnpm-lock.yaml` to install and build the Next.js app.
4. Choose one safe AI configuration for **Production**, **Preview**, and **Development**.

   **Explicit Vercel demo mode** requires no provider or secret:

```env
MOCK_AI_MODE=true
MOCK_COMMERCE_MODE=true
```

   **Hosted Gemini mode** runs real generation server-side:

```env
MOCK_AI_MODE=false
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.6-flash
MOCK_COMMERCE_MODE=true
```

Vercel functions cannot reach Ollama running on a local computer. The explicit demo configuration keeps growth analysis, risk analysis, planning, investor briefs, and commerce actions functional through clearly labelled deterministic responses. The Gemini key is never sent to the browser.

To use a hosted Ollama service instead, set `MOCK_AI_MODE=false`, `AI_PROVIDER=ollama`, and configure server-only `OLLAMA_BASE_URL` and `OLLAMA_MODEL`. Never add provider secrets using a `NEXT_PUBLIC_` environment variable.

### Persistence With Supabase

Vercel does not provide durable local disk storage. To persist watchlists, analyses, risk reports, growth plans, and Action Center outcomes, create a Supabase project and run [`frontend/supabase/schema.sql`](/Users/sonakerketta/Documents/ChatGPT/razorpay/frontend/supabase/schema.sql) in its SQL editor. Then configure only server-side values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
PERSISTENCE_SESSION_SECRET=a-long-random-secret
```

When these values are absent, the app deliberately falls back to browser-local watchlists instead of pretending that data is durable. The service-role key stays in server routes and is never exposed to the browser.

### Razorpay Test Integration

The Razorpay boundary is opt-in and accepts **test mode only**:

```env
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_TEST_AMOUNT_PAISE=10000
```

`POST /api/payments/order` creates a server-side Razorpay test order, and `POST /api/payments/verify` verifies the checkout signature. No live-mode key, payment capture, or production charging path is enabled. Keep `MOCK_COMMERCE_MODE=true` until a checkout and webhook workflow is explicitly required.

### Company Enrichment

The source dataset has no websites for the imported companies and only partial descriptions. TechAtlas now supports a verified enrichment overlay at `data/companies/enrichment.json`; running `node scripts/import-company-data.mjs` merges that overlay into the public dataset.

To collect only exact website matches from Google Places Text Search (New), configure `GOOGLE_PLACES_API_KEY` locally and run:

```bash
cd frontend
pnpm enrich:companies -- --limit 25 --dry-run
pnpm enrich:companies -- --limit 25
cd ..
node scripts/import-company-data.mjs
```

The importer accepts a website only when the returned place name and city exactly match the existing company record. It derives a favicon URL only from that verified website domain and leaves descriptions unchanged unless a verified description is supplied in the overlay. This avoids fabricating company facts.

## Architecture

TechAtlas is currently a full-stack Next.js application. The browser uses the frontend in `frontend/`, and its server-side API routes in `frontend/src/app/api/` handle growth analysis, risk analysis, planning, investor briefs, city data, and demo commerce actions.

The separate `backend/` directory is an unused scaffold and is not required to run locally or deploy to Vercel. A standalone backend becomes useful only for future needs such as a database, authentication, background jobs, live payment providers, or other external integrations.

### Merchant Growth Data

Merchant Growth uses the committed summary at `frontend/src/data/merchant-events-summary.json`. It was generated by streaming both files in the supplied archive through `frontend/scripts/import-merchant-events.mjs`, processing 109,950,743 historical events across 206,876 products. The UI uses the top 30 products ranked by recorded purchase revenue. Raw archive files are not shipped to the browser or included in the deployment.

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/ai/growth` | Company-specific structured growth analysis. |
| `POST /api/ai/risk` | Structured estimated risk analysis. |
| `POST /api/ai/growth-plan` | Structured four-action growth plan. |
| `POST /api/commerce/action` | Deterministic demo Action Center result. |
| `POST /api/payments/order` | Optional Razorpay test-order creation. |
| `POST /api/payments/verify` | Optional server-side Razorpay signature verification. |
| `GET/POST/DELETE /api/persistence/watchlist` | Optional Supabase-backed watchlist persistence. |
| `POST /api/persistence/records` | Optional persisted AI plans, reports, and action outcomes. |
| `GET /api/city-data` | Static city geography data. |
| `GET /api/buildings` | Building data endpoint. |

## Project Structure

```text
frontend/
  public/
    company-data/        # Company dataset
    city-data/           # Static city datasets
    geodata/             # Bundled Natural Earth geography
  src/
    app/api/             # AI, city, building, and demo-commerce endpoints
    components/map/      # Globe, city view, company markers, controls
    components/company/  # Details, analysis, risk, plan, action center
    lib/                 # Geographic, company, AI-provider helpers
```

## Technology

- Next.js 15 and React 19
- Three.js with React Three Fiber and Drei
- Tailwind CSS
- Natural Earth GeoJSON for local globe geography
- Gemini for hosted AI inference, or Ollama with Qwen locally

## Security And Demo Boundaries

- AI providers are called from server-side API routes only.
- Provider, Supabase, and Razorpay secret keys must never use `NEXT_PUBLIC_*` names.
- Demo commerce actions are clearly labeled and never charge real money. Razorpay is test-mode only and performs server-side signature verification.
- The globe uses local geographic assets and does not rely on a live map API at runtime.

## Current Scope

TechAtlas is currently an ecosystem exploration and planning demo. It does not include live-mode payments, autonomous transactions, CRM delivery, or external campaign execution.
