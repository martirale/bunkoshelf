"use client";

import { useState, useEffect } from "react";
import { UserRoundPenIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { adminUpdateUser, deleteUser } from "@/actions/users";
import type { Dictionary } from "@/lib/types";
import type { Role } from "@/lib/types/auth";

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
  role: string;
  name: string | null;
  lastname: string | null;
  birthYear: number | null;
}

interface EditUserFormProps {
  user: UserData | null;
  intl: Dictionary;
  onSuccess: (updatedUser: UserData) => void;
  currentUserId: string | undefined;
}

export default function EditUserForm({
  user,
  intl,
  onSuccess,
  currentUserId,
}: EditUserFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<Role>("MEMBER");
  const [error] = useState<string | null>(null);

  const { addToast } = useToast()!;

  const isSelf = user?.id === currentUserId;

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setPassword("");
      setName(user.name || "");
      setLastname(user.lastname || "");
      setBirthYear(user.birthYear?.toString() || "");
      setIsAdmin(user.isAdmin || false);
      setRole((user.role as Role) || "MEMBER");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userData = {
      id: user!.id,
      username,
      password: password.length > 0 ? password : undefined,
      name,
      lastname,
      birthYear: birthYear ? parseInt(birthYear) : null,
      isAdmin,
      role,
    };

    const result = await adminUpdateUser(userData);

    if (result?.success) {
      addToast({
        title: intl.toastUsers.successTt as string,
        description: intl.toastUsers.successUpdate as string,
        variant: "success",
      });
      onSuccess(result.user as unknown as UserData);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.toastUsers.errorTt as string,
        description: intl.toastUsers.errorUpdate as string,
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(intl.alerts.confirmDelete as string);
    if (!confirmed) return;

    const result = await deleteUser({ id: user!.id });

    if (result?.success) {
      addToast({
        title: intl.toastUsers.errorTt as string,
        description: intl.toastUsers.successDel as string,
        variant: "success",
      });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.toastUsers.errorTt as string,
        description: intl.toastUsers.errorDel as string,
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <UserRoundPenIcon size={28} className="mr-2" />
        {intl.settings.updateUser as string}
      </h2>

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-x-4 space-y-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={intl.settings.username as string}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={intl.settings.passwordNew as string}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={intl.settings.nameOpt as string}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <input
          type="text"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          placeholder={intl.settings.lastnameOpt as string}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder={intl.settings.birthYearOpt as string}
          className="bg-pearl border border-onix rounded-lg w-full px-5 py-3"
        />
        {!isSelf && (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={() => setIsAdmin(!isAdmin)}
                id="isAdmin"
              />
              <label htmlFor="isAdmin">{intl.settings.isAdmin as string}</label>
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="role">{intl.settings.role as string}</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="bg-pearl border border-onix rounded-lg px-5 py-3"
              >
                <option value="ADMIN">{intl.settings.roleAdmin as string}</option>
                <option value="MEMBER">{intl.settings.roleMember as string}</option>
                <option value="GUEST">{intl.settings.roleGuest as string}</option>
              </select>
            </div>
          </>
        )}
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-onix bg-sand border border-sand hover:text-sand hover:bg-onix hover:border-onix transition-all duration-300 cursor-pointer"
        >
          {intl.settings.updateUser as string}
        </button>
        {!isSelf && (
          <button
            type="button"
            onClick={handleDelete}
            className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-red-700 border border-red-700 hover:bg-red-800 transition-all duration-300 cursor-pointer"
          >
            {intl.settings.deleteUser as string}
          </button>
        )}
      </form>
    </div>
  );
}
