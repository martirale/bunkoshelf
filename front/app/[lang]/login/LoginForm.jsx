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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    let result = {};
    try {
      result = await res.json();
    } catch {
      setErrorMessage(intl.alerts.serverError);
      setUsername("");
      setPassword("");
      return;
    }

    if (!res.ok) {
      setErrorMessage(intl.alerts.loginFail);
      setUsername("");
      setPassword("");
      return;
    }

    window.location.href = `/${lang}/`;
  };

  return (
    <div className="mt-8 w-full max-w-sm">
      <form onSubmit={handleLogin} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder={intl.login.username}
            className="text-sand bg-onix border border-sand rounded-lg w-full px-5 py-3"
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
            className="text-sand bg-onix border border-sand rounded-lg w-full px-5 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm mb-2">{errorMessage}</div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300 cursor-pointer"
          >
            {intl.login.login}
          </button>
        </div>
      </form>
    </div>
  );
}
