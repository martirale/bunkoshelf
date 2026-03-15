"use server";

import { verifySession } from "@/lib/auth/verifySession";
import prisma from "@/lib/prisma";

export async function getPushSubscriptions() {
  const user = await verifySession();
  if (!user || !user.isAdmin) {
    return { error: "Unauthorized", status: 401 };
  }

  let error = null;
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      select: {
        endpoint: true,
        keys: true,
      },
    });

    return { subscriptions };
  } catch (err) {
    error = err;
  } finally {
    if (error) {
      console.error("Error getting push subscriptions:", error);
      return { error: "Error al obtener suscripciones", status: 500 };
    }
  }
}

export async function subscribePush(subscription) {
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
      },
      create: {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
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
