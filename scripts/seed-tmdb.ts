/**
 * Seed movie questions from TMDB API.
 *
 * Usage:
 *   TMDB_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-tmdb.ts
 *
 * Generates question types:
 *   - image_id      (backdrop + 4 MC title choices)
 *   - director      (poster + 4 MC director choices)
 *   - actor_match   (actor profile photo + 4 MC character choices)
 *   - decade        (movie title + 4 MC decade choices)
 *   - box_office    (revenue / award trivia)
 */

import { createClient } from "@supabase/supabase-js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";
const API_KEY = process.env.TMDB_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing required env vars: TMDB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

interface Genre { id: number; name: string }
interface Movie {
  id: number;
  title: string;
  release_date: string;
  genre_ids: number[];
  backdrop_path: string | null;
  poster_path: string | null;
  revenue: number;
  budget: number;
  vote_average: number;
}
interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}
interface CrewMember { job: string; name: string }

const DECADE_RANGES = [
  { start: "1950-01-01", end: "1959-12-31", decade: 1950 },
  { start: "1960-01-01", end: "1969-12-31", decade: 1960 },
  { start: "1970-01-01", end: "1979-12-31", decade: 1970 },
  { start: "1980-01-01", end: "1989-12-31", decade: 1980 },
  { start: "1990-01-01", end: "1999-12-31", decade: 1990 },
  { start: "2000-01-01", end: "2009-12-31", decade: 2000 },
  { start: "2010-01-01", end: "2019-12-31", decade: 2010 },
  { start: "2020-01-01", end: "2029-12-31", decade: 2020 },
];

async function fetchMovies(genreId: number, decade: typeof DECADE_RANGES[number]): Promise<Movie[]> {
  const pages = [];
  for (let page = 1; page <= 3; page++) {
    const data = await tmdb<{ results: Movie[] }>("/discover/movie", {
      with_genres: String(genreId),
      "primary_release_date.gte": decade.start,
      "primary_release_date.lte": decade.end,
      sort_by: "popularity.desc",
      "vote_count.gte": "50",
      page: String(page),
    });
    pages.push(...data.results);
    await sleep(260); // respect 40 req/s limit
  }
  return pages;
}

async function fetchCredits(movieId: number) {
  const data = await tmdb<{ cast: CastMember[]; crew: CrewMember[] }>(`/movie/${movieId}/credits`);
  await sleep(260);
  return data;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function decadeOptions(correct: number): string[] {
  const all = DECADE_RANGES.map((d) => `${d.decade}s`);
  const correctLabel = `${correct}s`;
  const wrongs = all.filter((d) => d !== correctLabel);
  const picked = wrongs.sort(() => Math.random() - 0.5).slice(0, 3);
  return [correctLabel, ...picked].sort(() => Math.random() - 0.5);
}

async function run() {
  const genresData = await tmdb<{ genres: Genre[] }>("/genre/movie/list");
  const genres = genresData.genres;

  const allMovies: Map<number, Movie & { genres: string[]; decade: number }> = new Map();

  for (const genre of genres) {
    for (const decade of DECADE_RANGES) {
      console.log(`Fetching ${genre.name} / ${decade.decade}s…`);
      const movies = await fetchMovies(genre.id, decade);
      for (const m of movies) {
        if (!allMovies.has(m.id)) {
          allMovies.set(m.id, {
            ...m,
            genres: m.genre_ids.map((id) => genres.find((g) => g.id === id)?.name ?? "").filter(Boolean),
            decade: decade.decade,
          });
        }
      }
    }
  }

  console.log(`Total unique movies: ${allMovies.size}`);

  const movieList = [...allMovies.values()];
  const movieTitles = movieList.map((m) => m.title);

  let inserted = 0;

  for (const movie of movieList) {
    const credits = await fetchCredits(movie.id);

    const director = credits.crew.find((c) => c.job === "Director")?.name;
    const topCast = credits.cast.filter((c) => c.order < 5 && c.profile_path);

    // 1. Image identification
    if (movie.backdrop_path) {
      const wrongs = movieTitles
        .filter((t) => t !== movie.title)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      await supabase.from("questions").upsert({
        type: "image_id",
        difficulty: 2,
        genres: movie.genres,
        decade: movie.decade,
        prompt: "Which movie is this scene from?",
        image_url: `${TMDB_IMG}/w780${movie.backdrop_path}`,
        correct_answer: movie.title,
        wrong_answers: wrongs,
        source: "tmdb",
        tmdb_movie_id: movie.id,
      }, { onConflict: "tmdb_movie_id,type,prompt", ignoreDuplicates: true });
      inserted++;
    }

    // 2. Director identification
    if (director && movie.poster_path) {
      const directorPool = movieList
        .map((m2) => credits.crew.find((c) => c.job === "Director")?.name)
        .filter(Boolean)
        .filter((d) => d !== director);
      const wrongDirs = [...new Set(directorPool)].sort(() => Math.random() - 0.5).slice(0, 3) as string[];

      if (wrongDirs.length === 3) {
        await supabase.from("questions").upsert({
          type: "director",
          difficulty: 2,
          genres: movie.genres,
          decade: movie.decade,
          prompt: `Who directed "${movie.title}"?`,
          image_url: `${TMDB_IMG}/w342${movie.poster_path}`,
          correct_answer: director,
          wrong_answers: wrongDirs,
          source: "tmdb",
          tmdb_movie_id: movie.id,
        }, { onConflict: "tmdb_movie_id,type,prompt", ignoreDuplicates: true });
        inserted++;
      }
    }

    // 3. Actor → character match
    if (topCast.length >= 2) {
      const actor = topCast[0];
      const wrongChars = topCast.slice(1, 4).map((c) => c.character);
      if (wrongChars.length >= 1) {
        await supabase.from("questions").upsert({
          type: "actor_match",
          difficulty: 2,
          genres: movie.genres,
          decade: movie.decade,
          prompt: `In "${movie.title}", which character did ${actor.name} play?`,
          image_url: null,
          correct_answer: actor.character,
          wrong_answers: wrongChars,
          metadata: {
            actors: [
              {
                actor_name: actor.name,
                character_name: actor.character,
                image_url: actor.profile_path
                  ? `${TMDB_IMG}/w185${actor.profile_path}`
                  : null,
              },
            ],
          },
          source: "tmdb",
          tmdb_movie_id: movie.id,
        }, { onConflict: "tmdb_movie_id,type,prompt", ignoreDuplicates: true });
        inserted++;
      }
    }

    // 4. Decade guess
    {
      const options = decadeOptions(movie.decade);
      await supabase.from("questions").upsert({
        type: "decade",
        difficulty: 1,
        genres: movie.genres,
        decade: movie.decade,
        prompt: `In which decade was "${movie.title}" released?`,
        image_url: movie.poster_path ? `${TMDB_IMG}/w185${movie.poster_path}` : null,
        correct_answer: `${movie.decade}s`,
        wrong_answers: options.filter((o) => o !== `${movie.decade}s`),
        source: "tmdb",
        tmdb_movie_id: movie.id,
      }, { onConflict: "tmdb_movie_id,type,prompt", ignoreDuplicates: true });
      inserted++;
    }

    // 5. Box office trivia
    if (movie.revenue > 0) {
      const threshold = 100_000_000;
      const correct = movie.revenue >= threshold ? "Yes" : "No";
      await supabase.from("questions").upsert({
        type: "box_office",
        difficulty: 2,
        genres: movie.genres,
        decade: movie.decade,
        prompt: `Did "${movie.title}" gross over $100 million at the box office?`,
        image_url: null,
        correct_answer: correct,
        wrong_answers: [correct === "Yes" ? "No" : "Yes", "Unknown", "Not released theatrically"],
        source: "tmdb",
        tmdb_movie_id: movie.id,
      }, { onConflict: "tmdb_movie_id,type,prompt", ignoreDuplicates: true });
      inserted++;
    }

    if (inserted % 100 === 0) console.log(`  ${inserted} questions inserted so far…`);
  }

  console.log(`Done. Total questions inserted/updated: ${inserted}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
