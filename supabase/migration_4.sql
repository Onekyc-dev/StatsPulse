-- Stores each Premier League player's season statistics, so a player can be compared with others in the same position.
-- Paste into Supabase > SQL Editor > Run.
create table if not exists player_season (
  player_id integer primary key,
  season_id integer not null,
  team_id integer,
  name text not null,
  position text,
  minutes numeric not null default 0,
  matches integer not null default 0,
  per90 jsonb,
  stats_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists player_season_position on player_season (position);
alter table player_season enable row level security;
grant select, insert, update, delete on player_season to service_role;
