"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = mode === "login" ? `${API}/login` : `${API}/register`;
      const body = mode === "login" ? { email, password } : { email, password, name };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      localStorage.setItem("iars_token", d.access_token);
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0f19] text-white">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold">IARS Account</h1>
        <p className="mt-2 text-slate-400">Sign in or create an account to download detailed reports.</p>
        <div className="mt-6 flex gap-2">
          <button onClick={() => setMode("login")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-cyan-500 text-black" : "border border-slate-700"}`}>Sign in</button>
          <button onClick={() => setMode("register")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode === "register" ? "bg-cyan-500 text-black" : "border border-slate-700"}`}>Create account</button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "register" && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <a href="/" className="mt-6 block text-sm text-cyan-400">Back to dashboard</a>
      </div>
    </main>
  );
}