"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/actions/login";
import type { Dictionary, Locale } from "@/lib/types";

interface LoginFormProps {
  lang: Locale;
  intl: Dictionary;
}

export default function LoginForm({ lang, intl }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login({ username, password, lang });
      window.location.href = `/${lang}/`;
    } catch {
      setErrorMessage(intl.alerts.loginFail as string);
      setUsername("");
      setPassword("");
    }
  };

  return (
    <div className="mt-8 w-full max-w-sm">
      <form onSubmit={handleLogin} className="max-w-screen md:max-w-sm w-full">
        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder={intl.login.username as string}
            className="text-sand bg-onix border border-neutral-700 rounded-lg w-full px-5 py-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            name="password"
            placeholder={intl.login.password as string}
            className="text-sand bg-onix border border-neutral-700 rounded-lg w-full px-5 py-3"
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
            {intl.login.login as string}
          </button>
        </div>
      </form>
    </div>
  );
}
