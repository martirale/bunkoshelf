"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user, intl }) {
  const router = useRouter();

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
      router.refresh();
    } else {
      console.error("Error al actualizar los datos");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="text-sand bg-onix border border-sand rounded-lg w-full px-5 py-3"
          placeholder={intl.profile.name}
        />
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="text-sand bg-onix border border-sand rounded-lg w-full px-5 py-3"
          placeholder={intl.profile.lastname}
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="text-sand bg-onix border border-sand rounded-lg w-full px-5 py-3"
          placeholder={intl.profile.password}
        />
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-blackamber hover:text-onix hover:bg-pearl transition-all duration-300 cursor-pointer"
        >
          {intl.profile.save}
        </button>
      </form>
    </div>
  );
}
