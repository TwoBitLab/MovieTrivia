-- RPC to safely increment a player's total score and games_played
create or replace function public.increment_profile_score(
  p_player_id uuid,
  p_score     integer
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set
    total_score  = total_score + p_score,
    games_played = games_played + 1
  where id = p_player_id;
end;
$$;
