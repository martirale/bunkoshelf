"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export const useAuth = ({ watchPathname = false } = {}) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isAdmin: false,
  });

  const pathname = usePathname();

  const fetchAuth = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  useEffect(() => {
    if (watchPathname) {
      fetchAuth();
    }
  }, [pathname, watchPathname, fetchAuth]);

  return { ...auth, refetchAuth: fetchAuth };
};
