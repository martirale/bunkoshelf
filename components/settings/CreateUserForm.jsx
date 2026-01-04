"use client";

import { useState } from "react";
import { UserRoundPlusIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { createUser } from "@/actions/users";

export default function CreateUserForm({ intl }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  const { addToast } = useToast();

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

    const result = await createUser(userData);

    if (result.success) {
      addToast({
        title: intl.toastUsers.successTt,
        description: intl.toastUsers.successCreate,
        variant: "success",
      });
      setUsername("");
      setPassword("");
      setName("");
      setLastname("");
      setBirthYear("");
      setIsAdmin(false);
      setError(null);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.alerts.errorTt,
        description: intl.toastUsers.errorCreate,
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <UserRoundPlusIcon size={28} className="mr-2" />
        {intl.settings.createUser}
      </h2>

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={intl.settings.username}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={intl.settings.password}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={intl.settings.nameOpt}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          placeholder={intl.settings.lastnameOpt}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder={intl.settings.birthYearOpt}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={() => setIsAdmin(!isAdmin)}
            id="isAdmin"
          />
          <label htmlFor="isAdmin">{intl.settings.isAdmin}</label>
        </div>
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer"
        >
          {intl.settings.createUser}
        </button>
      </form>
    </div>
  );
}
