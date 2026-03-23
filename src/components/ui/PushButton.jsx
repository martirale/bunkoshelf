"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { subscribePush, sendPushToSubscription } from "@/actions/admin-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushButton({ lang, intl }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        setSupported(true);
        setPermission(Notification.permission);

        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registrado", registration);
          })
          .catch((err) => {
            console.error("Error al registrar SW", err);
          });
      }
    }
  }, []);

  async function subscribeUser() {
    if (!supported) return alert("Push no es soportado en este navegador");

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
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log("Suscripción obtenida:", subscription);

        const sub = subscription.toJSON();
        await subscribePush(sub);

        await sendPushToSubscription(sub, {
          title: intl.push.ttSubscription,
          body: intl.push.bodySubscription,
          url: `/${lang}/`,
        });
      } catch (err) {
        console.error("Error al subscribir:", err);
      }
    }
  }

  if (!supported || permission === "granted") return null;

  return (
    <button
      onClick={subscribeUser}
      className="text-onix p-2 rounded-lg border border-neutral-300 hover:border-lilah transition-all duration-300 cursor-pointer"
    >
      <BellIcon size={20} />
    </button>
  );
}
