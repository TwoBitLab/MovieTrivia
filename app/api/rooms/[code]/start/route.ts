import type { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  const { data: room } = await service
    .from("rooms")
    .select("id, host_id, status, question_ids, settings")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (room.host_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (room.status !== "waiting" && room.status !== "paused") {
    return Response.json({ error: "Game already started" }, { status: 409 });
  }

  const settings = room.settings as { time_per_question_ms: number };
  const questionId = room.question_ids[0];

  const { data: question } = await service
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (!question) return Response.json({ error: "No questions available" }, { status: 500 });

  const startedAt = Date.now();
  const options = shuffleOptions(question.correct_answer, question.wrong_answers);

  // Update room status
  await service
    .from("rooms")
    .update({ status: "active", started_at: new Date(startedAt).toISOString(), current_question_index: 0 })
    .eq("id", room.id);

  // Broadcast question_start to room channel
  const { correct_answer: _omit, ...safeQuestion } = question as typeof question & { correct_answer: string };
  await service.channel(`room:${code.toUpperCase()}`).send({
    type: "broadcast",
    event: "question_start",
    payload: {
      question_index: 0,
      question: { ...safeQuestion, options },
      time_limit_ms: settings.time_per_question_ms,
      started_at: startedAt,
    },
  });

  return Response.json({ ok: true });
}

function shuffleOptions(correct: string, wrongs: string[]): string[] {
  const all = [correct, ...wrongs.slice(0, 3)];
  return all.sort(() => Math.random() - 0.5);
}
