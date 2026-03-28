"use client";

import { useEffect, useState } from "react";

interface Props {
  startedAt: number; // epoch ms
  timeLimitMs: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ startedAt, timeLimitMs, onExpire }: Props) {
  const [remaining, setRemaining] = useState(timeLimitMs);

  useEffect(() => {
    setRemaining(timeLimitMs - (Date.now() - startedAt));

    const id = setInterval(() => {
      const r = timeLimitMs - (Date.now() - startedAt);
      if (r <= 0) {
        clearInterval(id);
        setRemaining(0);
        onExpire?.();
      } else {
        setRemaining(r);
      }
    }, 100);

    return () => clearInterval(id);
  }, [startedAt, timeLimitMs, onExpire]);

  const pct = Math.max(0, remaining / timeLimitMs);
  const seconds = Math.ceil(remaining / 1000);
  const color =
    pct > 0.5 ? "bg-green-500" : pct > 0.25 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Time</span>
        <span className={`font-mono font-bold ${pct <= 0.25 ? "text-red-400" : ""}`}>
          {seconds}s
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
