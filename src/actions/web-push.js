"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

const PUSH_SERVER_URL = process.env.PUSH_SERVER_URL;
const PUSH_API_KEY = process.env.PUSH_API_KEY;

const pushHeaders = {
  "Content-Type": "application/json",
  ...(PUSH_API_KEY && { Authorization: `Bearer ${PUSH_API_KEY}` }),
};

export async function subscribePush(subscription, deviceName) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint,
      },
      update: {
        keys: subscription.keys,
        deviceName,
      },
      create: {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceName,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error subscribing to push:", error);
      return { error: "Error al suscribir", status: 500 };
    }
  }
}

export async function sendPush(payload) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: { endpoint: true, keys: true },
    });

    if (!subscriptions.length) {
      return { success: true, sent: 0 };
    }

    const res = await fetch(`${PUSH_SERVER_URL}/send-many`, {
      method: "POST",
      headers: pushHeaders,
      body: JSON.stringify({ subscriptions, payload }),
    });

    if (!res.ok) {
      throw new Error(`Push server responded with ${res.status}`);
    }

    return { success: true, sent: subscriptions.length };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error sending push:", error);
      return { error: "Error al enviar notificación", status: 500 };
    }
  }
}

export async function sendPushToSubscription(subscription, payload) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const res = await fetch(`${PUSH_SERVER_URL}/send`, {
      method: "POST",
      headers: pushHeaders,
      body: JSON.stringify({ subscription, payload }),
    });

    if (!res.ok) {
      throw new Error(`Push server responded with ${res.status}`);
    }

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error sending push:", error);
      return { error: "Error al enviar notificación", status: 500 };
    }
  }
}

export async function getUserSubscriptions() {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: { id: true, endpoint: true, deviceName: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, subscriptions };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error fetching subscriptions:", error);
      return { error: "Error al obtener suscripciones", status: 500 };
    }
  }
}

export async function deleteSubscription(id) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    await prisma.pushSubscription.delete({
      where: { id, userId: user.id },
    });

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error deleting subscription:", error);
      return { error: "Error al eliminar suscripción", status: 500 };
    }
  }
}

export async function deleteAllSubscriptions() {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    });

    return { success: true };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error deleting all subscriptions:", error);
      return { error: "Error al eliminar suscripciones", status: 500 };
    }
  }
}

export async function sendPushBroadcast(payload) {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      select: { endpoint: true, keys: true },
    });

    if (!subscriptions.length) {
      return { success: true, sent: 0 };
    }

    const res = await fetch(`${PUSH_SERVER_URL}/send-many`, {
      method: "POST",
      headers: pushHeaders,
      body: JSON.stringify({ subscriptions, payload }),
    });

    if (!res.ok) {
      throw new Error(`Push server responded with ${res.status}`);
    }

    return { success: true, sent: subscriptions.length };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error sending broadcast push:", error);
      return { error: "Error al enviar notificaciones", status: 500 };
    }
  }
}
