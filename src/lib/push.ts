import "server-only";

import { query } from "@/lib/db/query";

export interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  url?: string;
}

const pushServerUrl = process.env.PUSH_SERVER_URL;
const pushApiKey = process.env.PUSH_API_KEY;

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!pushServerUrl) return 0;

  const subscriptions = await query<{ endpoint: string; keys: Record<string, unknown> }>(`
    SELECT endpoint, keys
    FROM push_subscriptions
    WHERE user_id = $1`, [userId]);
  if (!subscriptions.length) return 0;

  const response = await fetch(`${pushServerUrl}/send-many`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(pushApiKey && { Authorization: `Bearer ${pushApiKey}` }),
    },
    body: JSON.stringify({ subscriptions, payload }),
  });
  if (!response.ok) throw new Error(`Push server responded with ${response.status}`);

  return subscriptions.length;
}
