-- Adds the lineup change log (the match timeline). Paste into Supabase > SQL Editor > Run.
create table if not exists lineup_events (
  id bigint generated always as identity primary key,
  fixture_id integer not null references fixtures(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  kind text not null,
  from_status text,
  to_status text not null,
  formation text,
  players_in text[] not null default '{}',
  players_out text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists lineup_events_fixture on lineup_events (fixture_id, created_at);
alter table lineup_events enable row level security;
grant select, insert, update, delete on lineup_events to service_role;
grant usage, select on all sequences in schema public to service_role;
