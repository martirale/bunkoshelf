"use client";

import { useState, useEffect } from "react";
import { Trash2Icon, BellOffIcon } from "lucide-react";
import { deleteSubscription, deleteAllSubscriptions } from "@/actions/web-push";
import type { PushSubscriptionEntry, DictionarySection } from "@/lib/types";

async function unsubscribeFromPushManager() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  } catch {}
}

async function getCurrentEndpoint(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub?.endpoint || null;
  } catch {
    return null;
  }
}

interface SubscriptionsTableProps {
  subscriptions: PushSubscriptionEntry[];
  intl: DictionarySection;
}

export default function SubscriptionsTable({ subscriptions: initial, intl }: SubscriptionsTableProps) {
  const [subscriptions, setSubscriptions] = useState(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const profile = intl.profile as DictionarySection;

  useEffect(() => {
    getCurrentEndpoint().then(setCurrentEndpoint);
  }, []);

  const handleDelete = async (id: string, endpoint: string) => {
    setIsLoading(true);
    const result = await deleteSubscription(id);
    if (result?.success) {
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      if (endpoint === currentEndpoint) {
        await unsubscribeFromPushManager();
        setCurrentEndpoint(null);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteAll = async () => {
    setIsLoading(true);
    const result = await deleteAllSubscriptions();
    if (result?.success) {
      setSubscriptions([]);
      await unsubscribeFromPushManager();
      setCurrentEndpoint(null);
    }
    setIsLoading(false);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {subscriptions.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleDeleteAll}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase bg-red-600 hover:bg-red-700 text-sand transition-all duration-300 cursor-pointer disabled:opacity-50"
          >
            <BellOffIcon size={16} />
            {profile.unsubscribeAll as string}
          </button>
        </div>
      )}

      <div className="bg-blackamber p-4 rounded-lg">
        {subscriptions.length === 0 ? (
          <p className="text-center py-8 text-neutral-400">
            {profile.noSubscriptions as string}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px] xl:min-w-full">
              <div className="flex sticky top-0 z-10">
                <div className="grid grid-cols-2 flex-1 font-bold uppercase bg-onix rounded-l-md">
                  <div className="p-4 text-left">
                    {profile.device as string}
                  </div>
                  <div className="p-4 text-center">
                    {profile.subscribedAt as string}
                  </div>
                </div>
                <div className="w-24 shrink-0 sticky right-0 bg-onix rounded-r-md p-4 text-center uppercase font-bold">
                  {profile.unsubscribe as string}
                </div>
              </div>

              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex">
                  <div className="grid grid-cols-2 flex-1">
                    <div className="p-4 text-sm">
                      {sub.deviceName || (profile.unknownDevice as string)}
                      {sub.endpoint === currentEndpoint && (
                        <span className="ml-2 text-xs bg-lilah rounded px-1.5 py-0.5 uppercase">
                          {profile.thisDevice as string}
                        </span>
                      )}
                    </div>
                    <div className="p-4 text-center text-sm">
                      {formatDate(sub.createdAt)}
                    </div>
                  </div>
                  <div className="w-24 shrink-0 sticky right-0 bg-blackamber p-4 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => !isLoading && handleDelete(sub.id, sub.endpoint)}
                      disabled={isLoading}
                      title={profile.unsubscribe as string}
                      className="border border-neutral-800 hover:text-danger-alt rounded-lg p-2 cursor-pointer transition-all duration-300 hover:border-danger-alt disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2Icon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
