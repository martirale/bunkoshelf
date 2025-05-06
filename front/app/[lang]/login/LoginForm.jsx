"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ lang, intl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error de autenticación");

      router.push(`/${lang}/`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-8 w-full max-w-sm">
      <form onSubmit={handleLogin} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            value={username}
            placeholder={intl.login.username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-sand bg-blackamber border border-sand rounded-lg w-full px-8 py-3 transition-all duration-300"
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={password}
            placeholder={intl.login.password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-sand bg-blackamber border border-sand rounded-lg w-full px-8 py-3 transition-all duration-300"
            required
          />
        </div>

        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-blackamber bg-sand border border-sand hover:bg-pearl transition-all duration-300 cursor-pointer"
          >
            {intl.login.loginbtn}
          </button>
        </div>
      </form>
    </div>
  );
}
