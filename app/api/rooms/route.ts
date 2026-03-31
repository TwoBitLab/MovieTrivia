import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/roomCode";
import type { RoomSettings, QuestionType } from "@/lib/supabase/types";

const QUESTION_TYPES: QuestionType[] = [
  "image_id", "quote_fill", "trivia", "actor_match", "decade", "director", "box_office",
];

const settingsSchema = z.object({
  genres: z.array(z.string().min(1)).min(1),
  decade_start: z.number().int().min(1900).max(2030),
  decade_end: z.number().int().min(1900).max(2030),
  question_count: z.number().int().min(5).max(100),
  time_per_question_ms: z.number().int().min(5000).max(60000),
  difficulty: z.enum(["easy", "mixed", "hard"]),
  question_types: z.array(z.enum(QUESTION_TYPES as [QuestionType, ...QuestionType[]])).min(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body?.settings);
  if (!parsed.success) {
    return Response.json({ error: "Invalid settings", details: parsed.error.flatten() }, { status: 400 });
  }

  const settings: RoomSettings = parsed.data;
  const service = createServiceClient();

  // Build difficulty filter
  const difficulties =
    settings.difficulty === "easy"
      ? [1]
      : settings.difficulty === "hard"
      ? [3]
      : [1, 2, 3];

  // Fetch matching question IDs
  const { data: questions, error: qErr } = await service
    .from("questions")
    .select("id")
    .overlaps("genres", settings.genres)
    .gte("decade", settings.decade_start)
    .lte("decade", settings.decade_end)
    .in("difficulty", difficulties)
    .in("type", settings.question_types);

  if (qErr) {
    console.error("[POST /api/rooms] fetch questions error:", qErr);
    return Response.json(
      { error: "Failed to fetch questions", detail: qErr.message },
      { status: 500 }
    );
  }

  if (!questions || questions.length < 5) {
    const isEmpty = !questions || questions.length === 0;
    return Response.json(
      {
        error: isEmpty
          ? "The question bank is empty. Run `npm run seed:sample` (quick test) or `npm run seed:all` (full library) to populate it."
          : "Not enough questions match these filters. Try selecting more genres, a wider decade range, or more question types.",
      },
      { status: 422 }
    );
  }

  // Shuffle and take the requested count
  const shuffled = questions
    .map((q) => ({ id: q.id, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, settings.question_count)
    .map((q) => q.id);

  // Generate a unique room code
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await service
      .from("rooms")
      .select("code")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const { data: room, error: roomErr } = await service
    .from("rooms")
    .insert({
      code,
      host_id: user.id,
      status: "waiting",
      settings,
      question_ids: shuffled,
    })
    .select("id, code")
    .single();

  if (roomErr || !room) {
    console.error("[POST /api/rooms] create room error:", roomErr);
    return Response.json({ error: "Failed to create room" }, { status: 500 });
  }

  // Add host to room_players — use the id returned from the insert above
  await service.from("room_players").insert({
    room_id: room.id,
    player_id: user.id,
    is_host: true,
  });

  return Response.json({ code: room.code }, { status: 201 });
}
