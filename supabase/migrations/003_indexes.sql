-- Speed up question filtering by genre/decade/type
create index questions_genres_gin    on public.questions using gin(genres);
create index questions_decade        on public.questions(decade);
create index questions_type          on public.questions(type);
create index questions_difficulty    on public.questions(difficulty);

-- Room lookups by code
create index rooms_code              on public.rooms(code);
create index rooms_host_id           on public.rooms(host_id);

-- Answer lookups
create index answers_room_id         on public.answers(room_id);
create index answers_player_id       on public.answers(player_id);

-- Game results leaderboard queries
create index game_results_player_id  on public.game_results(player_id);
create index game_results_room_id    on public.game_results(room_id);
create index game_results_score      on public.game_results(total_score desc);

-- Profile leaderboard
create index profiles_total_score    on public.profiles(total_score desc);
