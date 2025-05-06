"use client";

import { useEffect, useState } from "react";

export const useAuth = () => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isAdmin: false,
  });

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/session/check", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Auth failed");

        const data = await res.json();

        setAuth({
          isAuthenticated: data.isAuthenticated,
          isAdmin: data.isAdmin,
        });
      } catch (err) {
        setAuth({ isAuthenticated: false, isAdmin: false });
      }
    };

    fetchAuth();
  }, []);

  return auth;
};
