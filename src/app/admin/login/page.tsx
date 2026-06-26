"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      
      if (data.resetUrl) {
        // Development mode: redirect directly
        window.location.href = data.resetUrl;
      } else {
        // Always show same message to prevent email enumeration
        setForgotSuccess(true);
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Home Page
          </a>
        </div>
        <div className="border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-gray-400 mb-8">Sign in to manage bookings</p>

          {mode === "login" && (
            <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20">
              <p className="text-xs text-gray-400 mb-2">Demo credentials:</p>
              <p className="text-sm text-gray-300">Email: <span className="text-cyan-400">user@gmail.com</span></p>
              <p className="text-sm text-gray-300">Password: <span className="text-cyan-400">Admin123#</span></p>
              <p className="text-xs text-gray-500 mt-2">Or login with any email. New emails are automatically created as USER accounts.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3">
              {error}
            </div>
          )}

          {forgotSuccess && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 mb-6">
              If an account exists for this email, a reset link has been sent.
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 text-black font-semibold py-3 px-4 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 px-4 py-3">
                Please enter your email address to reset your password.
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                  placeholder="admin@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 text-black font-semibold py-3 px-4 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot-password");
                  setError("");
                  setForgotSuccess(false);
                }}
                className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Forgot Password?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setForgotSuccess(false);
                }}
                className="text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}