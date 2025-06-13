"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY =
  "BI7ycHYWezzuK3ulcjtiz7OEk4P_ZFCB0i4IUa8m5Bfh1snde-6L-fUdnfPKu-s11Uc3AAv7qPuggLv0ppmnFPQ";

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

export default function PushNotificationsClient() {
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

        await fetch("https://push.amlab.site/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription,
            payload: "¡Suscripción exitosa! Esto es una prueba",
          }),
        });

        alert("Suscripción push enviada al servidor");
      } catch (err) {
        console.error("Error al subscribir:", err);
        alert("Error al subscribir al push");
      }
    }
  }

  return (
    <div>
      <p>Soporte Push: {supported ? "Sí" : "No"}</p>
      <p>Permiso: {permission}</p>
      <button onClick={subscribeUser} disabled={permission === "granted"}>
        {permission === "granted"
          ? "Suscrito a notificaciones"
          : "Suscribirse a notificaciones"}
      </button>
    </div>
  );
}
