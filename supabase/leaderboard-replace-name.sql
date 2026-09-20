-- Run this once in the Supabase SQL editor so a player name can replace
-- its previous score. The game deletes matching rows, then inserts the new one.

alter table leaderboard enable row level security;

drop policy if exists "Anyone can delete leaderboard rows" on leaderboard;
create policy "Anyone can delete leaderboard rows"
  on leaderboard for delete
  to anon, authenticated
  using (true);

delete from leaderboard a
  using leaderboard b
  where a.ctid < b.ctid
    and lower(a.player_name) = lower(b.player_name);

create unique index if not exists leaderboard_player_name_ci
  on leaderboard (lower(player_name));
