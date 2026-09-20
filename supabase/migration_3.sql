-- Stores the latest backtest so the site can show confidence-tier results. Paste into Supabase > SQL Editor > Run.
create table if not exists model_stats (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table model_stats enable row level security;
grant select, insert, update, delete on model_stats to service_role;
