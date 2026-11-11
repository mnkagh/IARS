"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
    >
      ← Back
    </button>
  );
}
