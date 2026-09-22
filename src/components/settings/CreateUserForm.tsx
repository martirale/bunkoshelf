"use client";

import { useState } from "react";
import { UserRoundPlusIcon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { createUser } from "@/actions/users";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import type { Dictionary } from "@/lib/types";
import type { Role } from "@/lib/types/auth";

interface CreateUserFormProps {
  intl: Dictionary;
}

export default function CreateUserForm({ intl }: CreateUserFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<Role>("MEMBER");
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast()!;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const userData = {
      username,
      password,
      name,
      lastname,
      birthYear: birthYear ? parseInt(birthYear) : null,
      birthMonth: birthMonth ? parseInt(birthMonth) : null,
      birthDay: birthDay ? parseInt(birthDay) : null,
      isAdmin,
      role,
    };

    const result = await createUser(userData);

    if (result?.success) {
      addToast({
        title: intl.toastUsers.successTt as string,
        description: intl.toastUsers.successCreate as string,
        variant: "success",
      });
      setUsername("");
      setPassword("");
      setName("");
      setLastname("");
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
      setIsAdmin(false);
      setRole("MEMBER");
      setError(null);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      addToast({
        title: intl.alerts.errorTt as string,
        description: intl.toastUsers.errorCreate as string,
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2">
      <h2 className="flex items-center mb-4">
        <UserRoundPlusIcon size={28} className="mr-2" />
        {intl.settings.createUser as string}
      </h2>

      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={intl.settings.username as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={intl.settings.password as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={intl.settings.nameOpt as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" />
          <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder={intl.settings.lastnameOpt as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input type="number" min="1" max="31" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} placeholder={intl.settings.birthDay as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" required />
          <input type="number" min="1" max="12" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} placeholder={intl.settings.birthMonth as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" required />
          <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder={intl.settings.birthYearOpt as string} className="bg-pearl border border-onix rounded-lg w-full px-5 py-3" required />
        </div>
        <div className="grid items-center gap-4 md:grid-cols-2">
          <select aria-label={intl.settings.role as string} value={role} onChange={(e) => setRole(e.target.value as Role)} className="bg-pearl border border-onix rounded-lg px-5 py-3"><option value="ADMIN">{intl.settings.roleAdmin as string}</option><option value="MEMBER">{intl.settings.roleMember as string}</option></select>
          <div className="flex items-center justify-between gap-4 px-5 py-3"><span>{intl.settings.isAdmin as string}</span><Switch checked={isAdmin} onCheckedChange={setIsAdmin} /></div>
        </div>
        <Button type="submit" variant="lightAlt" className="px-8 py-4">{intl.settings.createUser as string}</Button>
      </form>
    </div>
  );
}
