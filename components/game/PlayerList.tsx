interface Player {
  player_id: string;
  display_name: string;
}

interface Props {
  players: Player[];
  hostId?: string;
}

export default function PlayerList({ players, hostId }: Props) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Players ({players.length})
      </h3>
      <ul className="space-y-1">
        {players.map((p) => (
          <li
            key={p.player_id}
            className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="truncate">{p.display_name}</span>
            {p.player_id === hostId && (
              <span className="ml-auto text-xs text-indigo-400 font-semibold">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
