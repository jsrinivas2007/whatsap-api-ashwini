"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/internal-ops/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials or locked out");
      }

      router.push("/ops-x7f9a2b4c8d1");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-navy-deep font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-2xl border border-border">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/images/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-xl shadow-sm" />
            <span className="text-lg font-bold text-navy-deep tracking-tight">Ashwini Innovations</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-deep tracking-tight">System Operations</h1>
          <p className="text-text-muted text-sm mt-2">Restricted Access Only</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1.5">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-sea focus:ring-2 focus:ring-sea/20 transition"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-navy-deep text-white font-semibold py-2.5 rounded-lg hover:bg-navy-mid transition-colors mt-2 disabled:opacity-60"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );
}
