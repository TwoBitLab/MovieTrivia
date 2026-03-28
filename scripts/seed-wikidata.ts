/**
 * Seed trivia questions from Wikidata (Academy Award winners).
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-wikidata.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

async function sparql<T>(query: string): Promise<T[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MovieTriviaApp/1.0 (educational)" },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL error: ${res.status}`);
  const data = await res.json();
  return data.results.bindings as T[];
}

interface BestPictureResult {
  filmLabel: { value: string };
  year: { value: string };
}

interface SequelResult {
  filmLabel: { value: string };
  sequelLabel: { value: string };
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function seedBestPictureWinners() {
  const query = `
    SELECT ?filmLabel ?year WHERE {
      ?film wdt:P31 wd:Q11424 .
      ?film wdt:P166 wd:Q102427 .
      ?film wdt:P577 ?date .
      BIND(YEAR(?date) AS ?year)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY ?year
    LIMIT 200
  `;

  const results = await sparql<BestPictureResult>(query);
  console.log(`Best Picture winners: ${results.length}`);

  // All other movie titles for distractors
  const allTitles = results.map((r) => r.filmLabel.value);

  let inserted = 0;

  for (const r of results) {
    const title = r.filmLabel.value;
    const year = parseInt(r.year.value, 10);
    const decade = Math.floor(year / 10) * 10;

    const wrongs = allTitles
      .filter((t) => t !== title)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Q1: Did X win Best Picture?
    await supabase.from("questions").upsert({
      type: "trivia",
      difficulty: 2,
      genres: ["Drama"],
      decade,
      prompt: `Did "${title}" win the Academy Award for Best Picture?`,
      image_url: null,
      correct_answer: "Yes",
      wrong_answers: ["No", "It was nominated but didn't win", "It was not eligible"],
      source: "wikidata",
      tmdb_movie_id: null,
    }, { onConflict: "source,prompt", ignoreDuplicates: true });

    // Q2: Which of these films won Best Picture?
    if (wrongs.length === 3) {
      await supabase.from("questions").upsert({
        type: "trivia",
        difficulty: 3,
        genres: ["Drama"],
        decade,
        prompt: `Which of these films won the Academy Award for Best Picture in the ${decade}s?`,
        image_url: null,
        correct_answer: title,
        wrong_answers: wrongs,
        source: "wikidata",
        tmdb_movie_id: null,
      }, { onConflict: "source,prompt", ignoreDuplicates: true });
    }

    inserted += 2;
    if (inserted % 50 === 0) console.log(`  ${inserted} wikidata questions…`);
    await sleep(100);
  }

  return inserted;
}

async function seedSequelTrivia() {
  const query = `
    SELECT ?filmLabel ?sequelLabel WHERE {
      ?film wdt:P31 wd:Q11424 .
      ?film wdt:P156 ?sequel .
      ?sequel wdt:P31 wd:Q11424 .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 200
  `;

  await sleep(1000); // be polite to Wikidata

  const results = await sparql<SequelResult>(query);
  console.log(`Sequels: ${results.length}`);

  let inserted = 0;

  for (const r of results) {
    const film = r.filmLabel.value;
    const sequel = r.sequelLabel.value;

    const distractors = results
      .filter((x) => x.filmLabel.value !== film && x.sequelLabel.value !== sequel)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x.sequelLabel.value);

    if (distractors.length < 3) continue;

    await supabase.from("questions").upsert({
      type: "trivia",
      difficulty: 2,
      genres: ["Action", "Drama"],
      decade: null,
      prompt: `What is the direct sequel to "${film}"?`,
      image_url: null,
      correct_answer: sequel,
      wrong_answers: distractors,
      source: "wikidata",
      tmdb_movie_id: null,
    }, { onConflict: "source,prompt", ignoreDuplicates: true });

    inserted++;
    await sleep(50);
  }

  return inserted;
}

async function run() {
  const n1 = await seedBestPictureWinners();
  const n2 = await seedSequelTrivia();
  console.log(`Done. Wikidata questions: ${n1 + n2}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
