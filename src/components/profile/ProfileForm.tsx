"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { updateUser } from "@/actions/users";
import type { Session, DictionarySection } from "@/lib/types";

interface ProfileFormProps {
  user: Session | null;
  intl: DictionarySection;
}

export default function ProfileForm({ user, intl }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  if (!toast) throw new Error("ProfileForm must be used within ToastProvider");
  const { addToast } = toast;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    password: "",
  });

  const profile = intl.profile as DictionarySection;
  const toastUsers = intl.toastUsers as DictionarySection;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await updateUser(formData);

    if (result.success) {
      setFormData((prevData) => ({ ...prevData, password: "" }));
      addToast({
        title: toastUsers.successTt as string,
        description: toastUsers.successUpdate as string,
        variant: "success",
      });
      router.refresh();
    } else {
      addToast({
        title: toastUsers.errorTt as string,
        description: toastUsers.errorUpdate as string,
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.name as string}
        />
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.lastname as string}
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.password as string}
        />
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300 cursor-pointer"
        >
          {profile.save as string}
        </button>
      </form>
    </div>
  );
}
