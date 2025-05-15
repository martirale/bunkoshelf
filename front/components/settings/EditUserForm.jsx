"use client";

import { useState, useEffect } from "react";
import { UserRoundPen } from "lucide-react";
import { useToast } from "@/ui/toast/ToastProvider";

export default function EditUserForm({ user, intl, onSuccess, currentUserId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error] = useState(null);

  const { addToast } = useToast();

  const isSelf = user?.id === currentUserId;

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPassword("");
      setName(user.name || "");
      setLastname(user.lastname || "");
      setBirthYear(user.birthYear?.toString() || "");
      setIsAdmin(user.isAdmin || false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      id: user.id,
      username,
      password: password.length > 0 ? password : undefined,
      name,
      lastname,
      birthYear: birthYear ? parseInt(birthYear) : null,
      isAdmin,
    };

    const res = await fetch("/api/users/adminUpdateUser", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (res.ok) {
      addToast({
        title: intl.alerts.successUserUpdate,
        variant: "success",
      });
      onSuccess(data.user);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.alerts.errorCreateUser,
        description: data.error || "",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm(intl.alerts.confirmDelete);
    if (!confirm) return;

    const res = await fetch("/api/users/deleteUser", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: user.id }),
    });

    const data = await res.json();

    if (res.ok) {
      addToast({
        title: intl.alerts.successDelete,
        variant: "success",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.alerts.errorDeleteUser,
        description: data.error || "",
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <UserRoundPen className="w-7 h-7 mr-2" />
        {intl.settings.updateUser}
      </h2>

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-x-4 space-y-4">
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
          placeholder={intl.settings.passwordNew}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
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
        {!isSelf && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={() => setIsAdmin(!isAdmin)}
              id="isAdmin"
            />
            <label htmlFor="isAdmin">{intl.settings.isAdmin}</label>
          </div>
        )}
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer"
        >
          {intl.settings.updateUser}
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={handleDelete}
            className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-red-700 border border-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer"
          >
            {intl.settings.deleteUser}
          </button>
        )}
      </form>
    </div>
  );
}
