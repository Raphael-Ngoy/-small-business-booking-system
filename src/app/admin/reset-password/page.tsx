"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link");
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/admin/login"), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-md">
          <div className="border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Invalid Link</h1>
            <p className="text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
            <button
              onClick={() => router.push("/admin/login")}
              className="w-full bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-md">
          <div className="border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Password Reset</h1>
            <p className="text-green-400 mb-6">Password has been reset successfully. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        <div className="border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400 mb-8">Enter your new password</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-cyan-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 text-black font-semibold py-3 px-4 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const urlEmail = urlParams.get("email");
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
    }
  }, []);

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="w-full max-w-md">
          <div className="border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold text-white mb-4">Invalid Link</h1>
            <p className="text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
            <button
              onClick={() => router.push("/admin/login")}
              className="w-full bg-cyan-500 text-black font-semibold py-3 hover:bg-cyan-400 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}
