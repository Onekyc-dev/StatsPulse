-- StatPulse database. Paste this whole file into Supabase > SQL Editor > Run.
-- Safe to run more than once.

create table if not exists teams (
  id integer primary key,                 -- provider team id
  name text not null,
  short text not null,
  color text not null,
  updated_at timestamptz not null default now()
);

create table if not exists fixtures (
  id integer primary key,                 -- provider match id
  league_id integer not null,
  season_id integer,
  round_number integer,
  kickoff timestamptz not null,
  status text not null,
  home_team_id integer not null references teams(id),
  away_team_id integer not null references teams(id),
  home_score integer,
  away_score integer,
  venue_id integer,
  updated_at timestamptz not null default now()
);
create index if not exists fixtures_league_kickoff on fixtures (league_id, kickoff);
create index if not exists fixtures_status_kickoff on fixtures (status, kickoff);

create table if not exists absences (
  fixture_id integer not null references fixtures(id) on delete cascade,
  side text not null check (side in ('home', 'away')),
  player_id integer not null,
  player_name text not null,
  status text,
  reason text,
  updated_at timestamptz not null default now(),
  primary key (fixture_id, side, player_id)
);

create table if not exists lineups (
  fixture_id integer primary key references fixtures(id) on delete cascade,
  lineup_status text not null,
  raw jsonb,
  updated_at timestamptz not null default now()
);

-- The data provider's own prediction, kept only as a second opinion.
create table if not exists provider_predictions (
  fixture_id integer primary key references fixtures(id) on delete cascade,
  raw jsonb not null,
  fetched_at timestamptz not null default now()
);

-- StatPulse's own predictions: the ledger. Rows are frozen once locked_at is set.
create table if not exists predictions (
  fixture_id integer not null references fixtures(id) on delete cascade,
  model_version text not null,
  home_xg numeric not null,
  away_xg numeric not null,
  p_home integer not null,
  p_draw integer not null,
  p_away integer not null,
  btts integer not null,
  over25 integer not null,
  likely_home integer not null,
  likely_away integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz,
  primary key (fixture_id, model_version)
);

-- Lock the tables down: only the server (secret key) can read or write.
alter table teams enable row level security;
alter table fixtures enable row level security;
alter table absences enable row level security;
alter table lineups enable row level security;
alter table provider_predictions enable row level security;
alter table predictions enable row level security;
