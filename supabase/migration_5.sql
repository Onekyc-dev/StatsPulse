-- Adds a leagues table, so the app knows which leagues exist and which are switched on.
-- Paste into Supabase > SQL Editor > Run. Fill in real ids after running /api/probe-leagues.
create table if not exists leagues (
  id integer primary key,          -- BSD's league_id
  name text not null,              -- "Premier League"
  short_name text not null,        -- "EPL", shown in tight spaces
  country text not null,           -- "England"
  tier integer not null default 1, -- 1 = top flight
  color text not null default '#18e6a4',
  enabled boolean not null default false, -- we sync and show this league
  updated_at timestamptz not null default now()
);
alter table leagues enable row level security;
grant select, insert, update, delete on leagues to service_role;

-- Premier League stays on. Nothing else changes behaviour until you flip enabled = true for it.
insert into leagues (id, name, short_name, country, tier, color, enabled)
values (1, 'Premier League', 'EPL', 'England', 1, '#18e6a4', true)
on conflict (id) do update set enabled = true;
