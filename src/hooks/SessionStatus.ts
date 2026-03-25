"use client";

import { useEffect, useState } from "react";
import { checkSession } from "@/actions/session";

export default function SessionStatus(): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const result = await checkSession();
        setIsLoggedIn("loggedIn" in result && result.loggedIn === true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    check();
  }, []);

  return isLoggedIn;
}
