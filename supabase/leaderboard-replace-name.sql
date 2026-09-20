-- Run this once in the Supabase SQL editor.
-- Lets the game replace a name's previous score even when direct DELETE is blocked.

alter table leaderboard enable row level security;

grant select, insert, update, delete on table leaderboard to anon, authenticated;

drop policy if exists "Anyone can delete leaderboard rows" on leaderboard;
create policy "Anyone can delete leaderboard rows"
  on leaderboard for delete
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can update leaderboard rows" on leaderboard;
create policy "Anyone can update leaderboard rows"
  on leaderboard for update
  to anon, authenticated
  using (true)
  with check (true);

delete from leaderboard a
  using leaderboard b
  where a.ctid < b.ctid
    and lower(a.player_name) = lower(b.player_name);

create unique index if not exists leaderboard_player_name_ci
  on leaderboard (lower(player_name));

create or replace function replace_leaderboard_score(p_name text, p_score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 20 then
    raise exception 'invalid name';
  end if;
  delete from leaderboard where lower(player_name) = lower(trim(p_name));
  insert into leaderboard (player_name, score) values (trim(p_name), p_score);
end;
$$;

revoke all on function replace_leaderboard_score(text, integer) from public;
grant execute on function replace_leaderboard_score(text, integer) to anon, authenticated;
