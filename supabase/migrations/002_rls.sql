-- ─────────────────────────────────────────
-- Enable RLS on all tables
-- ─────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.questions    enable row level security;
alter table public.rooms        enable row level security;
alter table public.room_players enable row level security;
alter table public.answers      enable row level security;
alter table public.game_results enable row level security;

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
-- Any authenticated user can read display_name & scores (for leaderboards)
create policy "profiles_select_any"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Handled by the trigger, but allow insert for the trigger function (security definer)
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ─────────────────────────────────────────
-- questions
-- ─────────────────────────────────────────
-- All authenticated users (including anon) can read questions
create policy "questions_select_authenticated"
  on public.questions for select
  to authenticated
  using (true);

-- No client-side inserts/updates/deletes — service role only

-- ─────────────────────────────────────────
-- rooms
-- ─────────────────────────────────────────
-- Any authenticated user can read rooms (needed to join by code)
create policy "rooms_select_authenticated"
  on public.rooms for select
  to authenticated
  using (true);

-- Only the host can update their room
create policy "rooms_update_host"
  on public.rooms for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

-- Room creation goes through the API (service role), but allow authenticated insert
create policy "rooms_insert_authenticated"
  on public.rooms for insert
  to authenticated
  with check (host_id = auth.uid());

-- ─────────────────────────────────────────
-- room_players
-- ─────────────────────────────────────────
-- Members of a room can see who else is in it
create policy "room_players_select_in_room"
  on public.room_players for select
  to authenticated
  using (
    exists (
      select 1 from public.room_players rp2
      where rp2.room_id = room_players.room_id
        and rp2.player_id = auth.uid()
    )
  );

-- A player can add themselves to a room
create policy "room_players_insert_self"
  on public.room_players for insert
  to authenticated
  with check (player_id = auth.uid());

-- A player can remove themselves from a room
create policy "room_players_delete_self"
  on public.room_players for delete
  to authenticated
  using (player_id = auth.uid());

-- ─────────────────────────────────────────
-- answers — written only by service role
-- ─────────────────────────────────────────
-- Players in the same room can read answers (to see results)
create policy "answers_select_in_room"
  on public.answers for select
  to authenticated
  using (
    exists (
      select 1 from public.room_players rp
      where rp.room_id = answers.room_id
        and rp.player_id = auth.uid()
    )
  );

-- No client INSERT — handled exclusively by the /api/rooms/[code]/answer route
-- using the service role client

-- ─────────────────────────────────────────
-- game_results — written only by service role
-- ─────────────────────────────────────────
-- Players in the same room can see the final results
create policy "game_results_select_in_room"
  on public.game_results for select
  to authenticated
  using (
    exists (
      select 1 from public.room_players rp
      where rp.room_id = game_results.room_id
        and rp.player_id = auth.uid()
    )
  );

-- All-time leaderboard: allow reading any player's aggregated results
create policy "game_results_select_public_leaderboard"
  on public.game_results for select
  to authenticated
  using (true);
