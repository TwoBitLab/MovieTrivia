"use client";

import { useState } from "react";

export default function RoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(
      `${window.location.origin}/join?code=${code}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-400">Share this code with friends</p>
      <button
        onClick={copy}
        className="font-mono text-4xl font-bold tracking-widest rounded-xl bg-gray-800 px-6 py-4 hover:bg-gray-700 transition-colors"
        title="Click to copy"
      >
        {code}
      </button>
      <span className="text-xs text-gray-500">
        {copied ? "Copied!" : "Click to copy invite link"}
      </span>
    </div>
  );
}
