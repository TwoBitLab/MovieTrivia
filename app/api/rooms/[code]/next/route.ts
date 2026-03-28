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
    .select("id, host_id, status, current_question_index, question_ids, settings")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) return Response.json({ error: "Room not found" }, { status: 404 });
  if (room.host_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const settings = room.settings as { time_per_question_ms: number };
  const nextIndex = room.current_question_index + 1;

  // Compute current leaderboard
  const { data: answers } = await service
    .from("answers")
    .select("player_id, points, profiles(display_name)")
    .eq("room_id", room.id);

  const scoreMap: Record<string, { display_name: string; score: number }> = {};
  for (const a of answers ?? []) {
    const pid = a.player_id;
    if (!scoreMap[pid]) {
      scoreMap[pid] = {
        display_name: (a.profiles as unknown as { display_name: string } | null)?.display_name ?? "?",
        score: 0,
      };
    }
    scoreMap[pid].score += a.points;
  }

  const leaderboard = Object.entries(scoreMap)
    .map(([player_id, { display_name, score }]) => ({ player_id, display_name, score }))
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  // Fetch current question for reveal
  const currentQuestionId = room.question_ids[room.current_question_index];
  const { data: currentQ } = await service
    .from("questions")
    .select("correct_answer")
    .eq("id", currentQuestionId)
    .single();

  // Broadcast question_end with correct answer + leaderboard
  await service.channel(`room:${code.toUpperCase()}`).send({
    type: "broadcast",
    event: "question_end",
    payload: {
      question_index: room.current_question_index,
      correct_answer: currentQ?.correct_answer ?? "",
      leaderboard,
    },
  });

  // Last question?
  if (nextIndex >= room.question_ids.length) {
    await service.from("rooms").update({ status: "finished", finished_at: new Date().toISOString() }).eq("id", room.id);

    // Write game_results
    for (const entry of leaderboard) {
      await service.from("game_results").upsert({
        room_id: room.id,
        player_id: entry.player_id,
        total_score: entry.score,
        rank: entry.rank,
      }, { onConflict: "room_id,player_id", ignoreDuplicates: false });

      // Update profile totals
      await service.rpc("increment_profile_score", {
        p_player_id: entry.player_id,
        p_score: entry.score,
      });
    }

    await service.channel(`room:${code.toUpperCase()}`).send({
      type: "broadcast",
      event: "game_finished",
      payload: { final_leaderboard: leaderboard },
    });

    return Response.json({ finished: true });
  }

  // Advance to next question
  const nextQuestionId = room.question_ids[nextIndex];
  const { data: nextQ } = await service
    .from("questions")
    .select("*")
    .eq("id", nextQuestionId)
    .single();

  if (!nextQ) return Response.json({ error: "Question not found" }, { status: 500 });

  const startedAt = Date.now();
  const options = [nextQ.correct_answer, ...nextQ.wrong_answers.slice(0, 3)].sort(
    () => Math.random() - 0.5
  );

  await service.from("rooms").update({ current_question_index: nextIndex }).eq("id", room.id);

  const { correct_answer: _omit, ...safeQ } = nextQ;
  await service.channel(`room:${code.toUpperCase()}`).send({
    type: "broadcast",
    event: "question_start",
    payload: {
      question_index: nextIndex,
      question: { ...safeQ, options },
      time_limit_ms: settings.time_per_question_ms,
      started_at: startedAt,
    },
  });

  return Response.json({ ok: true, next_index: nextIndex });
}
