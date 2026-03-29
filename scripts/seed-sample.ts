/**
 * Seed a small set of hardcoded sample questions for every question type.
 * Use this to test the full game flow without needing a TMDB API key.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-sample.ts
 *   — or —
 *   npm run seed:sample
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const SAMPLE_QUESTIONS = [
  // ── image_id ────────────────────────────────────────────────────────────────
  {
    type: "image_id",
    difficulty: 1,
    genres: ["Science Fiction"],
    decade: 1970,
    prompt: "Which movie is this iconic scene from?",
    image_url: "https://image.tmdb.org/t/p/w780/qvktm0BHcnmDpul4Hz01GIazWPr.jpg",
    correct_answer: "Star Wars",
    wrong_answers: ["2001: A Space Odyssey", "Close Encounters of the Third Kind", "Alien"],
    source: "sample",
  },
  {
    type: "image_id",
    difficulty: 2,
    genres: ["Drama"],
    decade: 1990,
    prompt: "Which movie is this iconic scene from?",
    image_url: "https://image.tmdb.org/t/p/w780/rzdPqYx7Um4FUZeD8wpXqjAUcEp.jpg",
    correct_answer: "The Shawshank Redemption",
    wrong_answers: ["The Green Mile", "Schindler's List", "Forrest Gump"],
    source: "sample",
  },

  // ── quote_fill ───────────────────────────────────────────────────────────────
  {
    type: "quote_fill",
    difficulty: 1,
    genres: ["Science Fiction"],
    decade: 1970,
    prompt: 'Complete this quote from Star Wars: "May the ______ be with you."',
    image_url: null,
    correct_answer: "Force",
    wrong_answers: ["Power", "Light", "Courage"],
    source: "sample",
  },
  {
    type: "quote_fill",
    difficulty: 1,
    genres: ["Action"],
    decade: 1980,
    prompt: 'Complete this quote from The Terminator: "I\'ll be ______."',
    image_url: null,
    correct_answer: "back",
    wrong_answers: ["gone", "there", "watching"],
    source: "sample",
  },
  {
    type: "quote_fill",
    difficulty: 2,
    genres: ["Drama"],
    decade: 1990,
    prompt: 'Complete this quote from Forrest Gump: "Life is like a box of ______."',
    image_url: null,
    correct_answer: "chocolates",
    wrong_answers: ["surprises", "candy", "memories"],
    source: "sample",
  },

  // ── trivia ───────────────────────────────────────────────────────────────────
  {
    type: "trivia",
    difficulty: 2,
    genres: ["Action", "Science Fiction"],
    decade: 1990,
    prompt: "In The Matrix (1999), what color pill does Neo take to see the truth?",
    image_url: null,
    correct_answer: "Red",
    wrong_answers: ["Blue", "Green", "White"],
    source: "sample",
  },
  {
    type: "trivia",
    difficulty: 2,
    genres: ["Horror"],
    decade: 1980,
    prompt: "In The Shining (1980), what does Jack Torrance type over and over?",
    image_url: null,
    correct_answer: "All work and no play makes Jack a dull boy",
    wrong_answers: ["Here's Johnny", "Redrum", "Come play with us"],
    source: "sample",
  },
  {
    type: "trivia",
    difficulty: 1,
    genres: ["Animation"],
    decade: 1990,
    prompt: "What is the name of the toy cowboy in Toy Story (1995)?",
    image_url: null,
    correct_answer: "Woody",
    wrong_answers: ["Buzz", "Rex", "Hamm"],
    source: "sample",
  },
  {
    type: "trivia",
    difficulty: 2,
    genres: ["Crime", "Drama"],
    decade: 1990,
    prompt: "In Pulp Fiction (1994), what dance do Vincent Vega and Mia Wallace perform?",
    image_url: null,
    correct_answer: "The Twist",
    wrong_answers: ["The Hustle", "The Jive", "The Charleston"],
    source: "sample",
  },

  // ── actor_match ──────────────────────────────────────────────────────────────
  {
    type: "actor_match",
    difficulty: 1,
    genres: ["Action", "Science Fiction"],
    decade: 1980,
    prompt: 'In The Terminator (1984), which character did Arnold Schwarzenegger play?',
    image_url: null,
    correct_answer: "The Terminator (T-800)",
    wrong_answers: ["John Connor", "Kyle Reese", "Miles Dyson"],
    metadata: {
      actors: [
        {
          actor_name: "Arnold Schwarzenegger",
          character_name: "The Terminator (T-800)",
          image_url: "https://image.tmdb.org/t/p/w185/zCaukf1kHBzCbVvJYwl3ZTDFNiW.jpg",
        },
      ],
    },
    source: "sample",
  },
  {
    type: "actor_match",
    difficulty: 1,
    genres: ["Science Fiction"],
    decade: 1990,
    prompt: 'In The Matrix (1999), which character did Keanu Reeves play?',
    image_url: null,
    correct_answer: "Neo",
    wrong_answers: ["Morpheus", "Agent Smith", "Trinity"],
    metadata: {
      actors: [
        {
          actor_name: "Keanu Reeves",
          character_name: "Neo",
          image_url: "https://image.tmdb.org/t/p/w185/4D0PpNI0kmP58hgrwGC3wCjxhnm.jpg",
        },
      ],
    },
    source: "sample",
  },

  // ── decade ───────────────────────────────────────────────────────────────────
  {
    type: "decade",
    difficulty: 1,
    genres: ["Action", "Adventure"],
    decade: 1980,
    prompt: 'In which decade was "Raiders of the Lost Ark" released?',
    image_url: null,
    correct_answer: "1980s",
    wrong_answers: ["1970s", "1990s", "2000s"],
    source: "sample",
  },
  {
    type: "decade",
    difficulty: 2,
    genres: ["Drama"],
    decade: 1970,
    prompt: 'In which decade was "The Godfather" released?',
    image_url: null,
    correct_answer: "1970s",
    wrong_answers: ["1960s", "1980s", "1990s"],
    source: "sample",
  },
  {
    type: "decade",
    difficulty: 1,
    genres: ["Animation"],
    decade: 1990,
    prompt: 'In which decade was "The Lion King" released?',
    image_url: null,
    correct_answer: "1990s",
    wrong_answers: ["1980s", "2000s", "2010s"],
    source: "sample",
  },

  // ── director ─────────────────────────────────────────────────────────────────
  {
    type: "director",
    difficulty: 2,
    genres: ["Science Fiction"],
    decade: 1970,
    prompt: 'Who directed "Star Wars" (1977)?',
    image_url: null,
    correct_answer: "George Lucas",
    wrong_answers: ["Steven Spielberg", "Francis Ford Coppola", "Stanley Kubrick"],
    source: "sample",
  },
  {
    type: "director",
    difficulty: 2,
    genres: ["Horror"],
    decade: 1980,
    prompt: 'Who directed "The Shining" (1980)?',
    image_url: null,
    correct_answer: "Stanley Kubrick",
    wrong_answers: ["Steven Spielberg", "Ridley Scott", "John Carpenter"],
    source: "sample",
  },
  {
    type: "director",
    difficulty: 1,
    genres: ["Action", "Science Fiction"],
    decade: 1990,
    prompt: 'Who directed "The Matrix" (1999)?',
    image_url: null,
    correct_answer: "The Wachowskis",
    wrong_answers: ["James Cameron", "Ridley Scott", "Christopher Nolan"],
    source: "sample",
  },

  // ── box_office ───────────────────────────────────────────────────────────────
  {
    type: "box_office",
    difficulty: 1,
    genres: ["Action", "Science Fiction"],
    decade: 1990,
    prompt: 'Did "Titanic" (1997) gross over $1 billion at the worldwide box office?',
    image_url: null,
    correct_answer: "Yes",
    wrong_answers: ["No", "Exactly $1 billion", "It was never released theatrically"],
    source: "sample",
  },
  {
    type: "box_office",
    difficulty: 2,
    genres: ["Drama"],
    decade: 1990,
    prompt: 'Did "The Shawshank Redemption" (1994) win the Academy Award for Best Picture?',
    image_url: null,
    correct_answer: "No",
    wrong_answers: ["Yes", "It was not nominated", "It won Best Director instead"],
    source: "sample",
  },
  {
    type: "box_office",
    difficulty: 2,
    genres: ["Animation"],
    decade: 1990,
    prompt: 'How many Academy Awards did "Schindler\'s List" (1993) win?',
    image_url: null,
    correct_answer: "7",
    wrong_answers: ["3", "5", "12"],
    source: "sample",
  },
];

async function run() {
  console.log(`Inserting ${SAMPLE_QUESTIONS.length} sample questions…`);

  const { error } = await supabase.from("questions").upsert(
    SAMPLE_QUESTIONS,
    { onConflict: "source,prompt", ignoreDuplicates: true }
  );

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  console.log(`Done. Total questions in DB: ${count}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
