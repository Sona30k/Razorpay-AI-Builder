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
- Local Ollama-powered AI with a deterministic `MOCK_AI_MODE` fallback.
- Demo-only commerce actions. No real payment provider or money transfer is used.
- Light and dark UI modes.

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
- Ollama
- A downloaded local model, currently `qwen2.5:0.5b`

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
4. Add these environment variables for **Production**, **Preview**, and **Development**:

```env
MOCK_AI_MODE=true
MOCK_COMMERCE_MODE=true
```

This is the recommended deployment configuration because a Vercel serverless function cannot access Ollama running on a local computer. It keeps growth analysis, risk analysis, planning, investor briefs, and commerce actions functional through their clearly labelled deterministic demo flows. No secrets are needed for this setup.

To use a hosted Ollama service later, set `MOCK_AI_MODE=false` and configure server-only `OLLAMA_BASE_URL` and `OLLAMA_MODEL` in Vercel. Never add a provider secret using a `NEXT_PUBLIC_` environment variable.

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/ai/growth` | Company-specific structured growth analysis. |
| `POST /api/ai/risk` | Structured estimated risk analysis. |
| `POST /api/ai/growth-plan` | Structured four-action growth plan. |
| `POST /api/commerce/action` | Deterministic demo Action Center result. |
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
- Ollama with Qwen for local AI inference

## Security And Demo Boundaries

- Ollama is called from server-side API routes only.
- API keys, if configured for an alternative provider, must never use `NEXT_PUBLIC_*` names.
- Demo commerce actions are clearly labeled and never charge real money.
- The globe uses local geographic assets and does not rely on a live map API at runtime.

## Current Scope

TechAtlas is currently an ecosystem exploration and planning demo. It does not include live payments, autonomous transactions, CRM delivery, or external campaign execution.
