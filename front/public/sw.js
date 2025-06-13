self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};

  const title = payload.title || "Notificación";
  const options = {
    body: payload.body || "Tienes una nueva notificación.",
    icon: "/pwa/bunkoshelf-icon-192.png",
    badge: "/pwa/bunkoshelf-icon-192.png",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
