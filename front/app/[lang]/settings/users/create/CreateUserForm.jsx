"use client";

import { useState } from "react";

export default function CreateUserForm({ intl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      username,
      password,
      name,
      lastname,
      birthYear: birthYear ? parseInt(birthYear) : null,
      isAdmin,
    };

    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (res.ok) {
      alert(intl.alerts.successCreateUser);
      setUsername("");
      setPassword("");
      setName("");
      setLastname("");
      setBirthYear("");
      setIsAdmin(false);
      setError(null);
    } else {
      console.error(intl.alerts.errorCreateUser);
      setError(data?.error || intl.alerts.errorCreateUser);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-blackamber rounded-lg">
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={intl.settings.username}
          className="text-sand bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={intl.settings.password}
          className="text-sand bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={intl.settings.nameOpt}
          className="text-sand bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          placeholder={intl.settings.lastnameOpt}
          className="text-sand bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
        />
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder={intl.settings.birthYearOpt}
          className="text-sand bg-blackamber border border-sand rounded-lg w-full px-5 py-3 transition-all duration-300"
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={() => setIsAdmin(!isAdmin)}
            id="isAdmin"
            className="text-sand"
          />
          <label htmlFor="isAdmin" className="text-sand">
            {intl.settings.isAdmin}
          </label>
        </div>
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-blackamber bg-sand border border-sand hover:bg-pearl transition-all duration-300 cursor-pointer"
        >
          {intl.settings.createUser}
        </button>
      </form>
    </div>
  );
}
