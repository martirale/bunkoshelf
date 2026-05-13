"use server";

import { createId } from "@paralleldrive/cuid2";
import { verifySession } from "@/lib/auth/verifySession";
import { execute, query } from "@/lib/db/query";

interface PushSubscriptionInput {
  endpoint: string;
  keys: Record<string, unknown>;
}

interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  url?: string;
}

const PUSH_SERVER_URL = process.env.PUSH_SERVER_URL;
const PUSH_API_KEY = process.env.PUSH_API_KEY;

const pushHeaders: HeadersInit = {
  "Content-Type": "application/json",
  ...(PUSH_API_KEY && { Authorization: `Bearer ${PUSH_API_KEY}` }),
};

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  keys: Record<string, unknown>;
  device_name: string | null;
  created_at: Date;
  user_id: string;
}

export async function subscribePush(subscription: PushSubscriptionInput, deviceName: string) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    await execute(
      `
        INSERT INTO push_subscriptions (
          id,
          endpoint,
          keys,
          device_name,
          user_id
        )
        VALUES ($1, $2, $3::jsonb, $4, $5)
        ON CONFLICT (endpoint)
        DO UPDATE SET
          keys = EXCLUDED.keys,
          device_name = EXCLUDED.device_name,
          user_id = EXCLUDED.user_id
      `,
      [createId(), subscription.endpoint, JSON.stringify(subscription.keys), deviceName, user.id]
    );

    return { success: true };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error subscribing to push:", error);
      return { error: "Error al suscribir", status: 500 };
    }
  }
}

export async function sendPush(payload: PushPayload) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const subscriptions = await query<{
      endpoint: string;
      keys: Record<string, unknown>;
    }>(
      `
        SELECT endpoint, keys
        FROM push_subscriptions
        WHERE user_id = $1
      `,
      [user.id]
    );

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
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error sending push:", error);
      return { error: "Error al enviar notificación", status: 500 };
    }
  }
}

export async function sendPushToSubscription(subscription: PushSubscriptionInput, payload: PushPayload) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
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
    error = err as Error;
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

  let error: Error | null = null;
  try {
    const subscriptions = await query<PushSubscriptionRow>(
      `
        SELECT id, endpoint, keys, device_name, created_at, user_id
        FROM push_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [user.id]
    );

    return {
      success: true,
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        endpoint: subscription.endpoint,
        deviceName: subscription.device_name,
        createdAt: subscription.created_at,
      })),
    };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error fetching subscriptions:", error);
      return { error: "Error al obtener suscripciones", status: 500 };
    }
  }
}

export async function deleteSubscription(id: string) {
  const user = await verifySession();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    await execute(
      `
        DELETE FROM push_subscriptions
        WHERE id = $1
          AND user_id = $2
      `,
      [id, user.id]
    );

    return { success: true };
  } catch (err) {
    error = err as Error;
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

  let error: Error | null = null;
  try {
    await execute(
      `
        DELETE FROM push_subscriptions
        WHERE user_id = $1
      `,
      [user.id]
    );

    return { success: true };
  } catch (err) {
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error deleting all subscriptions:", error);
      return { error: "Error al eliminar suscripciones", status: 500 };
    }
  }
}

export async function sendPushBroadcast(payload: PushPayload) {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error: Error | null = null;
  try {
    const subscriptions = await query<{
      endpoint: string;
      keys: Record<string, unknown>;
    }>(
      `
        SELECT endpoint, keys
        FROM push_subscriptions
      `
    );

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
    error = err as Error;
  } finally {
    if (error) {
      console.error("Error sending broadcast push:", error);
      return { error: "Error al enviar notificaciones", status: 500 };
    }
  }
}
