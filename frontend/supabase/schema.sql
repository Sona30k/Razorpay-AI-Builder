-- Run once in the Supabase SQL editor. All access is through server-side routes.
create table if not exists public.techatlas_watchlist (
  workspace_id uuid not null,
  company_id text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, company_id)
);

create table if not exists public.techatlas_records (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  kind text not null check (kind in ('growth-analysis', 'risk-analysis', 'growth-plan', 'action-outcome')),
  company_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists techatlas_records_workspace_created_idx on public.techatlas_records (workspace_id, created_at desc);

alter table public.techatlas_watchlist enable row level security;
alter table public.techatlas_records enable row level security;
-- Do not add browser-facing policies. The service-role key is used only in server routes.
