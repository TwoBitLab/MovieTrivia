-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 32),
  is_anonymous  boolean not null default false,
  total_score   integer not null default 0,
  games_played  integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_anonymous)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Player'),
    coalesce((new.raw_user_meta_data->>'is_anonymous')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- questions
-- ─────────────────────────────────────────
create table public.questions (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in (
    'image_id','quote_fill','trivia','actor_match','decade','director','box_office'
  )),
  difficulty     smallint not null check (difficulty in (1,2,3)),
  genres         text[] not null default '{}',
  decade         smallint,          -- e.g. 1990, 2000, 2010
  prompt         text not null,
  image_url      text,
  correct_answer text not null,
  wrong_answers  text[] not null default '{}',
  metadata       jsonb,             -- actor photos, extra context, etc.
  source         text not null,     -- 'tmdb' | 'wikidata' | 'quotes_dataset'
  tmdb_movie_id  integer,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- rooms
-- ─────────────────────────────────────────
create table public.rooms (
  id                     uuid primary key default gen_random_uuid(),
  code                   char(6) unique not null,
  host_id                uuid not null references public.profiles(id),
  status                 text not null default 'waiting' check (status in (
    'waiting','active','paused','finished'
  )),
  settings               jsonb not null,
  current_question_index integer not null default 0,
  question_ids           uuid[] not null default '{}',
  created_at             timestamptz not null default now(),
  started_at             timestamptz,
  finished_at            timestamptz
);

-- ─────────────────────────────────────────
-- room_players
-- ─────────────────────────────────────────
create table public.room_players (
  room_id    uuid not null references public.rooms(id) on delete cascade,
  player_id  uuid not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  is_host    boolean not null default false,
  primary key (room_id, player_id)
);

-- ─────────────────────────────────────────
-- answers
-- ─────────────────────────────────────────
create table public.answers (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms(id) on delete cascade,
  question_id   uuid not null references public.questions(id),
  player_id     uuid not null references public.profiles(id),
  answer        text not null,
  is_correct    boolean not null,
  points        integer not null default 0,
  answered_at   timestamptz not null default now(),
  time_taken_ms integer not null,
  unique (room_id, question_id, player_id)  -- one answer per player per question
);

-- ─────────────────────────────────────────
-- game_results
-- ─────────────────────────────────────────
create table public.game_results (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms(id) on delete cascade,
  player_id    uuid not null references public.profiles(id),
  total_score  integer not null,
  rank         smallint not null,
  played_at    timestamptz not null default now(),
  unique (room_id, player_id)
);
