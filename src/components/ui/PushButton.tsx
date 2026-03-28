"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { subscribePush, sendPushToSubscription } from "@/actions/web-push";
import type { DictionarySection } from "@/lib/types";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = "Navegador";
  let os = "";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  return os ? `${browser} - ${os}` : browser;
}

interface PushButtonProps {
  lang: string;
  intl: DictionarySection;
  vapidPublicKey?: string;
}

export default function PushButton({ lang, intl, vapidPublicKey }: PushButtonProps) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setHasSubscription(!!sub);
        setReady(true);
      })
      .catch((err) => {
        console.error("Error al registrar SW", err);
        setReady(true);
      });
  }, []);

  async function subscribeUser() {
    if (!supported) return alert("Push no es soportado en este navegador");
    if (!vapidPublicKey) return;

    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return alert("Permiso denegado");
    }

    if (Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const sub = subscription.toJSON();
        const subInput = { endpoint: sub.endpoint ?? "", keys: sub.keys ?? {} };
        await subscribePush(subInput, getDeviceName());
        setHasSubscription(true);

        const push = intl.push as DictionarySection;
        await sendPushToSubscription(subInput, {
          title: push.ttSubscription as string,
          body: push.bodySubscription as string,
          url: `/${lang}/`,
        });
      } catch (err) {
        console.error("Error al subscribir:", err);
      }
    }
  }

  if (!ready || !supported || (permission === "granted" && hasSubscription)) return null;

  return (
    <button
      onClick={subscribeUser}
      className="text-onix p-2 rounded-lg border border-neutral-300 hover:border-lilah transition-all duration-300 cursor-pointer"
    >
      <BellIcon size={20} />
    </button>
  );
}
