import type { LeaderboardEntry } from "@/lib/realtime/gameChannel";

interface Props {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
}

export default function Leaderboard({ entries, currentPlayerId }: Props) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Leaderboard
      </h3>
      <ol className="space-y-1">
        {entries.map((entry) => (
          <li
            key={entry.player_id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              entry.player_id === currentPlayerId
                ? "bg-indigo-900 text-indigo-100"
                : "bg-gray-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-gray-500 w-5 text-right">{entry.rank}</span>
              <span className="font-medium truncate max-w-[140px]">
                {entry.display_name}
              </span>
            </span>
            <span className="font-mono font-bold tabular-nums">
              {entry.score.toLocaleString()}
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-gray-500 text-sm px-3">No scores yet</li>
        )}
      </ol>
    </div>
  );
}
