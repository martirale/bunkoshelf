"use client";

import { useState } from "react";

export default function LoginForm({ lang, intl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    const data = {
      username,
      password,
      lang,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMessage(result.error || "Server error");
        return;
      }

      window.location.href = `/${lang}/`;
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="mt-8 w-full max-w-sm">
      <form onSubmit={handleLogin} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder={intl.login.username}
            className="text-sand text-lg bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            name="password"
            placeholder={intl.login.password}
            className="text-sand text-lg bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm">{errorMessage}</div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="font-bold text-lg px-8 py-4 rounded-lg leading-none uppercase text-blackamber bg-sand border border-sand hover:bg-pearl transition-all duration-300 cursor-pointer"
          >
            {intl.login.login}
          </button>
        </div>
      </form>
    </div>
  );
}
