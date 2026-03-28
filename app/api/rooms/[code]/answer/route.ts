import type { NextRequest } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { calculatePoints } from "@/lib/scoring";

const bodySchema = z.object({
  question_id: z.string().uuid(),
  answer: z.string().min(1).max(500),
  time_taken_ms: z.number().int().min(0).max(120000),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { question_id, answer, time_taken_ms } = parsed.data;
  const service = createServiceClient();

  const { data: room } = await service
    .from("rooms")
    .select("id, status, settings")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "active") return Response.json({ error: "Game not active" }, { status: 409 });

  const { data: question } = await service
    .from("questions")
    .select("correct_answer")
    .eq("id", question_id)
    .single();

  if (!question) return Response.json({ error: "Question not found" }, { status: 404 });

  const settings = room.settings as { time_per_question_ms: number };
  const isCorrect = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
  const points = calculatePoints(isCorrect, time_taken_ms, settings.time_per_question_ms);

  // Insert answer (idempotent via unique constraint)
  const { error: insertErr } = await service.from("answers").upsert({
    room_id: room.id,
    question_id,
    player_id: user.id,
    answer: answer.trim(),
    is_correct: isCorrect,
    points,
    time_taken_ms,
  }, { onConflict: "room_id,question_id,player_id", ignoreDuplicates: true });

  if (insertErr) {
    return Response.json({ error: "Failed to record answer" }, { status: 500 });
  }

  // Broadcast that a player submitted (no answer content revealed)
  await service.channel(`room:${code.toUpperCase()}`).send({
    type: "broadcast",
    event: "answer_submitted",
    payload: { player_id: user.id },
  });

  return Response.json({ is_correct: isCorrect, points });
}
