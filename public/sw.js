self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  const title = payload.title || "Notificación";
  const options = {
    body: payload.body || "Tienes una notificación",
    icon: "/icons/bunkoshelf-icon-maskable.png",
    badge: "/icons/bunkoshelf-icon-maskable.png",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
