# TechAtlas AI

**An interactive AI-powered map and intelligence platform for India's technology ecosystem, combining geographic company discovery, investor intelligence, and merchant growth analytics.**

TechAtlas AI helps people move from a geographic view of India's technology ecosystem to useful company, investor, and merchant-growth context. It brings together a real-world globe, five technology-city views, a local company directory, structured AI workflows, investor research tools, and a merchant analytics demo.

The project is designed for technology ecosystem explorers, founders and business teams, investors and researchers, and merchants who want a visual starting point for exploration and planning. Geography provides the context; structured company data and AI-assisted workflows help turn that context into questions, hypotheses, and next steps.

## Live Deployment

Try the deployed application at [razorpay-ai-builder-41su.vercel.app](https://razorpay-ai-builder-41su.vercel.app/).

## Product Flows

### Primary User Workflow

```text
Open TechAtlas
  -> Select a highlighted city on the globe
  -> Search or select a company
  -> Inspect the company profile
  -> Explore with AI
  -> Review growth analysis or risk analysis
  -> Build a growth plan
  -> Select an action in the Action Center
```

### Ecosystem Explorer

```text
Earth -> City -> Company -> Company Details -> Growth Analysis -> Risk Analysis -> Growth Plan -> Action Center
```

### Investor Radar

```text
Investor Radar -> Filter -> Discover Companies -> Compare -> Watchlist -> Investor Intelligence Brief
```

### Merchant Growth Intelligence

```text
Merchant Dashboard -> Analyze Historical Merchant Data -> Growth Opportunities -> Review and Approve -> Demo Action Center -> Demo Execution Metrics
```

## Key Features

### Real Earth and Geographic Explorer

- Interactive Three.js globe backed by local Natural Earth country geometry.
- Filled continents, country boundaries, coastlines, and India-focused geographic context.
- Real coordinates for Bengaluru, Hyderabad, Pune, Gurugram, and Delhi.
- Globe navigation and transitions from the Earth view into a selected city.

### City Explorer

- City-level visual environment with roads, parks, water, and company markers.
- Search companies by name, category, or industry within a selected city.
- Floating company labels and selected-company details.
- City switching resets the relevant company selection and search state.

> **Rendering note:** the active city environment uses procedural/sample 3D geometry for visual orientation. It is not a real-world building GIS renderer. Static city-data files are bundled for the city-data API, but they are not the source of the currently rendered procedural buildings.

### Company Discovery

- Local dataset of 1,419 imported company records across the five supported cities.
- Geographic company coordinates, city filtering, search, floating markers, and company popups.
- Available company category, industry, description, address, funding, and investor fields.
- Company-logo support with fallback initials when a logo is unavailable.
- Compact spatial company-directory experience instead of a generic table.

### Investor Radar and Investor Intelligence

- Filter companies by city, industry, reported funding, investor name, search query, and sort order.
- View company information, available funding and investor fields, and data-confidence indicators.
- Select up to four companies for comparison.
- Add, remove, view, and compare companies from a watchlist.
- Explore investor relationships from available company records.
- Generate a structured investor brief with research signals, confidence labels, and research questions.

Watchlists use browser storage by default. Optional server-side persistence endpoints are available when deployment configuration is supplied.

### AI Growth Analysis

- `POST /api/ai/growth` produces a structured company-specific analysis.
- Covers a growth opportunity, why it is relevant, target segment, recommended strategy, expected impact, priority, difficulty, and KPIs.
- Uses only selected company fields supplied to the server-side route.
- Supports deterministic development responses through `MOCK_AI_MODE=true`.

### Risk Analysis

- Structured overall risk score and level.
- Six estimated research-signal categories: competition, market, funding, customer acquisition, execution, and geographic risk.
- Each category includes a score, reason, and mitigation.
- Includes a key risk and recommendation, with a return path to Growth Analysis or Growth Plan.

> Risk output is a TechAtlas estimate based on available company and market information. It is not financial, investment, legal, or credit advice, and it is not an official rating or guaranteed prediction.

### Growth Planner

- Converts growth-analysis context into a goal, strategy, action plan, timelines, priorities, KPIs, expected outcomes, and risks.
- Produces four to six practical actions when the provider response validates successfully.
- Lets users mark actions complete and track progress.
- Opens an Action Center for an individual growth-plan action.

### Action Center

- Displays the selected company and approved growth action.
- Presents recommended next steps and demo action choices such as campaign, landing-page, customer-segment, and conversion-tracking work.
- Provides loading, success, and retry states.
- Demo execution states are explicitly labelled; no external business system is changed.

### Merchant Growth Intelligence

- Merchant dashboard based on imported **historical public/demo event data**, not a live merchant feed.
- Displays recorded revenue, purchases, average order value, conversion rate, product views, add-to-cart events, and product performance.
- Identifies evidence-based upsell, cross-sell, product-improvement, and campaign opportunities.
- Shows the evidence, recommendation, expected impact, and source metrics behind each opportunity.
- Includes a review, approve, reject, and simulated execution flow with clearly labelled demo performance metrics.

The merchant dashboard uses a compact summary derived from the supplied October and November 2019 e-commerce event archive. It does not connect to a live store, customer database, or campaign system.

## AI Architecture

```text
React frontend -> Next.js API route -> server-side AI provider -> structured JSON validation -> frontend UI
```

AI is never called directly from browser code.

- `AI_PROVIDER=gemini` uses the official `@google/genai` SDK with `GEMINI_API_KEY` held on the server.
- `AI_PROVIDER=ollama` uses a server-side Ollama endpoint for local development or a reachable hosted Ollama service.
- `AI_PROVIDER=auto` selects Ollama locally and Gemini on Vercel.
- `MOCK_AI_MODE=true` bypasses providers and returns deterministic demo data for growth analysis, risk analysis, planning, investor briefs, and merchant opportunities.

Each route validates structured output before the frontend receives it. Provider and schema failures never expose secrets or raw provider responses.

When a configured provider is unavailable, rate-limited, returns malformed JSON, or fails, the company Growth Analysis, Risk Analysis, Growth Plan, and Investor Brief routes fall back to deterministic company-specific demo data. The frontend visibly labels those responses as `DEMO MODE`; a real provider response is never silently replaced or misrepresented.

## System Architecture

```text
                         +--------------------------+
                         |        Next.js App        |
                         |  React + Three.js / R3F   |
                         +------------+-------------+
                                      |
          +---------------------------+---------------------------+
          |                           |                           |
          v                           v                           v
  Globe and City Explorer      Investor Radar          Merchant Growth Intelligence
  Natural Earth + city data    Company filters,        Historical event aggregates
  company marker selection     comparison, watchlist   and opportunity workflow
          |                           |                           |
          +---------------------------+---------------------------+
                                      |
                                      v
                         Next.js Server API Routes
                                      |
             +------------------------+------------------------+
             |                        |                        |
             v                        v                        v
    Gemini via @google/genai   Ollama (local/hosted)   Deterministic demo fallback
    Server-side key only       Server-side endpoint    Clearly labelled in the UI
```

### Architecture Responsibilities

- **Client UI:** renders the globe, city views, company discovery, investor tools, and merchant workflows. Browser code never receives AI-provider secrets.
- **Local data layer:** serves bundled Natural Earth geometry, city datasets, imported company records, and historical merchant aggregates.
- **Next.js API layer:** validates requests, prepares compact company context, calls the configured provider server-side, validates structured JSON, and returns safe application responses.
- **AI provider layer:** supports Gemini for hosted generation and Ollama for local or reachable hosted inference. Both are selected through environment variables.
- **Fallback layer:** returns deterministic, company-specific demo output only after a real provider request cannot produce valid output. This keeps deployed flows usable without pretending mock output is live AI.
- **Persistence layer:** offers optional server-side persistence endpoints; browser-storage fallbacks keep lightweight UI state available during local/demo use.

## API Routes

| Method | Route | Purpose | Provider / Data |
| --- | --- | --- | --- |
| `POST` | `/api/ai/growth` | Structured company growth analysis. | AI provider or deterministic mock data. |
| `POST` | `/api/ai/risk` | Structured estimated company risk analysis. | AI provider or deterministic mock data. |
| `POST` | `/api/ai/growth-plan` | Structured growth goal and execution plan. | AI provider or deterministic mock data. |
| `POST` | `/api/ai/investor-brief` | Investor research brief for selected companies. | AI provider or deterministic mock data. |
| `POST` | `/api/merchant/growth` | Merchant growth opportunities from historical aggregates. | AI provider or deterministic derivation. |
| `POST` | `/api/commerce/action` | Demo Action Center result for a selected growth action. | Deterministic demo workflow. |
| `GET` | `/api/city-data` | Serves static city geography data. | Bundled city JSON. |
| `GET` | `/api/buildings` | Serves bundled building sample data. | Local sample data. |
| `GET` | `/api/persistence/workspace` | Starts or reads an optional signed persistence workspace. | Optional server-side persistence. |
| `GET`, `POST`, `DELETE` | `/api/persistence/watchlist` | Reads and updates an optional persisted watchlist. | Optional server-side persistence. |
| `POST` | `/api/persistence/records` | Stores optional analysis, plan, and action records. | Optional server-side persistence. |

## Data Sources

| Dataset | Location | Contents and Scope |
| --- | --- | --- |
| Natural Earth countries | `frontend/public/geodata/natural-earth-countries.geojson` | Local public country and coastline geometry used by the globe. |
| Company dataset | `frontend/public/company-data/companies.json` | 1,419 imported company records for Bengaluru, Hyderabad, Pune, Gurugram, and Delhi. Source metadata is in `companies.meta.json`. |
| Static city data | `frontend/public/city-data/*.json` | Bundled building, road, park, and water data for the five city-data endpoints. Separate from the active procedural city renderer. |
| Merchant summary | `frontend/src/data/merchant-events-summary.json` | Compact aggregate derived from supplied October and November 2019 e-commerce event files. Historical demo/public data only. |
| Company enrichment overlay | `data/companies/enrichment.json` | Empty-by-default verified overlay for websites, logos, and descriptions. It remains empty until verified enrichment is imported. |

## Technology Stack

- Next.js 15
- React 19
- TypeScript
- Three.js
- React Three Fiber
- Drei
- Tailwind CSS
- `@google/genai` for Gemini integration
- Ollama for local or hosted server-side inference
- pnpm package manager and Node.js 20+

## Project Structure

```text
TechAtlas AI/
  data/
    companies/                  # Source and verified enrichment overlay
  frontend/
    public/
      city-data/                # Five bundled static city datasets
      company-data/             # Imported company records and metadata
      geodata/                  # Natural Earth country geometry
    scripts/                    # Data preparation, enrichment, provider checks
    src/
      app/
        api/                    # AI, city, merchant, action, persistence routes
        investor-radar/         # Investor Radar page
        merchant-growth/        # Merchant Growth page
      components/
        company/                # Details, analysis, risk, planning, action center
        investor/               # Filters, lists, comparison, watchlist, brief UI
        map/                    # Globe, city, procedural city, markers, controls
        merchant/               # Merchant dashboard and opportunity UI
      data/                     # Merchant aggregate summary
      lib/                      # AI providers, data helpers, geography utilities
      types/                    # Shared TypeScript types
  scripts/
    import-company-data.mjs     # Company dataset importer
```

## Local Development

### Prerequisites

- Node.js 20–24
- pnpm
- Ollama only when using `AI_PROVIDER=ollama`

### Install and Run

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` and configure only the provider and optional services you use. Relevant variable names include:

```text
AI_PROVIDER
MOCK_AI_MODE
GEMINI_API_KEY
GEMINI_MODEL
OLLAMA_BASE_URL
OLLAMA_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PERSISTENCE_SESSION_SECRET
GOOGLE_PLACES_API_KEY
```

Do not expose server-side values through `NEXT_PUBLIC_*` variables. The application can run in deterministic mock mode without an external AI provider.

### Useful Commands

```bash
cd frontend
pnpm build
pnpm validate:city-data
pnpm import:merchant-data
pnpm enrich:companies -- --limit 25 --dry-run
pnpm test:gemini
```

## Deployment Notes

Set the Vercel project root directory to `frontend`.

- For a no-secret demo deployment, use `MOCK_AI_MODE=true`.
- For real server-side Gemini generation, configure `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` in Vercel.
- Vercel cannot access an Ollama server running on a local computer.
- Optional persistence requires separately configured server-side persistence variables and schema.

## Current Boundaries

TechAtlas AI is an ecosystem exploration, intelligence, and planning product. It does not connect to live merchant stores, customer systems, campaign systems, or payment providers. Demo execution is clearly labelled and does not perform external transactions.
