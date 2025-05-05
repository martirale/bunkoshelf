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
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error de autenticación");

      // Stores the token as a secure cookie
      document.cookie = `token=${data.token}; path=/; SameSite=Lax`;

      router.push(`/${lang}/`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex md:justify-center mt-16">
      <form onSubmit={handleLogin} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            value={username}
            placeholder={intl.login.username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-blackamber bg-sand border border-sand hover:bg-pearl rounded-lg w-full py-2 px-3"
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            value={password}
            placeholder={intl.login.password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-blackamber bg-sand border border-sand hover:bg-pearl rounded-lg w-full py-2 px-3"
            required
          />
        </div>

        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="font-bold px-8 py-4 rounded-lg leading-none bg-onix border border-blackamber hover:bg-blackamber hover:border-pearl transition-all duration-300 focus:outline-none cursor-pointer"
          >
            {intl.login.loginbtn}
          </button>
        </div>
      </form>
    </div>
  );
}
