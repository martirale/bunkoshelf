"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/ui/toast/ToastProvider";

export default function ProfileForm({ user, intl }) {
  const router = useRouter();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/users/updateUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData((prevData) => ({ ...prevData, password: "" }));
      addToast({
        title: intl.toastUsers.successTt,
        description: intl.toastUsers.successUpdate,
        variant: "success",
      });
      router.refresh();
    } else {
      addToast({
        title: intl.toastUsers.errorTt,
        description: intl.toastUsers.errorUpdate,
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
          placeholder={intl.profile.name}
        />
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={intl.profile.lastname}
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={intl.profile.password}
        />
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300 cursor-pointer"
        >
          {intl.profile.save}
        </button>
      </form>
    </div>
  );
}
