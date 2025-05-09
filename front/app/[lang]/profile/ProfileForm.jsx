"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({ user, lang, intl }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder={intl.profile.name}
        />
      </div>

      <div>
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder={intl.profile.lastname}
        />
      </div>

      <div>
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder={intl.profile.password}
        />
      </div>

      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        {intl.profile.save}
      </button>
    </form>
  );
}
