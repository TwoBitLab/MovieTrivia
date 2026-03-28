/**
 * Seed quote-completion questions from a CSV dataset.
 *
 * Expected CSV format (header row):
 *   quote,movie,year,character,genre
 *
 * Dataset recommendation:
 *   https://www.kaggle.com/datasets/preprocessiing/movie-quotes-dataset
 *   Download as movie_quotes.csv → place at scripts/data/movie_quotes.csv
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-quotes.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const CSV_PATH = path.join(import.meta.dirname ?? __dirname, "data", "movie_quotes.csv");

if (!fs.existsSync(CSV_PATH)) {
  console.error(`CSV not found at ${CSV_PATH}. Download from Kaggle and place it there.`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function makeBlankPrompt(quote: string): { prompt: string; correct: string } | null {
  const words = quote.split(" ");
  if (words.length < 5) return null;

  // Redact a meaningful word (4+ chars, not stop words)
  const stopWords = new Set(["that", "this", "with", "from", "have", "will", "been", "what", "your", "they", "their"]);
  const candidates = words
    .map((w, i) => ({ w: w.replace(/[^a-zA-Z']/g, ""), i }))
    .filter(({ w }) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  if (!candidates.length) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  const blanked = [...words];
  blanked[pick.i] = "______";
  return { prompt: blanked.join(" "), correct: pick.w };
}

function generateWrongAnswers(correct: string, allWords: string[]): string[] {
  const pool = [...new Set(allWords.filter((w) => w !== correct && w.length >= 3))];
  return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}

async function run() {
  const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH) });
  const rows: string[][] = [];
  let header = true;

  for await (const line of rl) {
    if (header) { header = false; continue; }
    // Simple CSV parse (quotes-escaped fields not handled — use papaparse for production)
    rows.push(line.split(","));
  }

  console.log(`Read ${rows.length} quotes.`);

  const allWords = rows
    .map((r) => r[0]?.split(" ") ?? [])
    .flat()
    .map((w) => w.replace(/[^a-zA-Z']/g, ""))
    .filter((w) => w.length >= 4);

  const GENRE_MAP: Record<string, string[]> = {
    drama: ["Drama"],
    comedy: ["Comedy"],
    action: ["Action"],
    romance: ["Romance"],
    horror: ["Horror"],
    "sci-fi": ["Science Fiction"],
  };

  let inserted = 0;

  for (const [quote, movie, year, , genreRaw] of rows) {
    if (!quote || !movie) continue;
    const made = makeBlankPrompt(quote.trim());
    if (!made) continue;

    const { prompt, correct } = made;
    const wrongs = generateWrongAnswers(correct, allWords);
    if (wrongs.length < 3) continue;

    const genreKey = (genreRaw ?? "").toLowerCase().trim();
    const genres = GENRE_MAP[genreKey] ?? ["Drama"];
    const yearNum = parseInt(year ?? "0", 10);
    const decade = yearNum >= 1950 ? Math.floor(yearNum / 10) * 10 : null;

    await supabase.from("questions").upsert({
      type: "quote_fill",
      difficulty: 2,
      genres,
      decade,
      prompt: `Complete this quote from "${movie}": "${prompt}"`,
      image_url: null,
      correct_answer: correct,
      wrong_answers: wrongs,
      source: "quotes_dataset",
      tmdb_movie_id: null,
    }, { onConflict: "source,prompt", ignoreDuplicates: true });

    inserted++;
    if (inserted % 100 === 0) console.log(`  ${inserted} quote questions inserted…`);
  }

  console.log(`Done. Total quote questions: ${inserted}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
