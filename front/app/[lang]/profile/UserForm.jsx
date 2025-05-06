"use client";

import { useEffect, useState } from "react";

export default function ProfileForm({ user, lang, intl }) {
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    password: "",
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setFormData({
      name: user.name || "",
      lastname: user.lastname || "",
      password: "",
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3001/api/users/me/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Error al actualizar el perfil");
      setMessage("Perfil actualizado correctamente");
    } catch (err) {
      setMessage("Hubo un error al actualizar");
    }
  };

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            {intl.profile.name}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            {intl.profile.lastname}
          </label>
          <input
            type="text"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            {intl.profile.password}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          {intl.profile.save}
        </button>

        {message && <p className="text-sm mt-2 text-gray-700">{message}</p>}
      </form>
    </div>
  );
}
