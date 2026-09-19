"use client";

import {
  useCallback,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

export type ResourceKind =
  | "manga-volume"
  | "manga-series"
  | "book-volume"
  | "book-series";

export interface ResourceState {
  isFavorite?: boolean;
  isRead?: boolean;
  personalRating?: number | null;
  progression?: number | null;
  status?: string | null;
}

interface ResourceMutation<T> {
  resource: ResourceKind;
  id: string;
  patch: ResourceState;
  mutate: () => Promise<T>;
  isSuccess: (result: T) => boolean;
  getConfirmedPatch?: (result: T) => ResourceState | undefined;
  refresh?: boolean;
}

const emptyState: ResourceState = Object.freeze({});
const states = new Map<string, ResourceState>();
const listeners = new Map<string, Set<() => void>>();

function getKey(resource: ResourceKind, id: string) {
  return `${resource}:${id}`;
}

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function restoreState(key: string, state: ResourceState | undefined) {
  if (state) states.set(key, state);
  else states.delete(key);
  emit(key);
}

export function publishResourceState(
  resource: ResourceKind,
  id: string,
  patch: ResourceState,
) {
  const key = getKey(resource, id);
  states.set(key, { ...states.get(key), ...patch });
  emit(key);
}

export function useResourceState<T extends ResourceState>(
  resource: ResourceKind,
  id: string,
  initialState: T,
) {
  const key = getKey(resource, id);
  const subscribe = useCallback((listener: () => void) => {
    const resourceListeners = listeners.get(key) ?? new Set<() => void>();
    resourceListeners.add(listener);
    listeners.set(key, resourceListeners);

    return () => {
      resourceListeners.delete(listener);
      if (!resourceListeners.size) listeners.delete(key);
    };
  }, [key]);
  const getSnapshot = useCallback(() => states.get(key) ?? emptyState, [key]);
  const patch = useSyncExternalStore(subscribe, getSnapshot, () => emptyState);

  return { ...initialState, ...patch } as ResourceState & T;
}

export function useResourceRefresh() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return useCallback(() => {
    startTransition(() => router.refresh());
  }, [router, startTransition]);
}

export function useResourceMutation() {
  const refresh = useResourceRefresh();

  return useCallback(async <T,>({
    resource,
    id,
    patch,
    mutate,
    isSuccess,
    getConfirmedPatch,
    refresh: shouldRefresh = true,
  }: ResourceMutation<T>) => {
    const key = getKey(resource, id);
    const previousState = states.get(key);
    publishResourceState(resource, id, patch);

    try {
      const result = await mutate();
      if (!isSuccess(result)) {
        restoreState(key, previousState);
        return result;
      }

      const confirmedPatch = getConfirmedPatch?.(result);
      if (confirmedPatch) publishResourceState(resource, id, confirmedPatch);
      if (shouldRefresh) refresh();
      return result;
    } catch (error) {
      restoreState(key, previousState);
      throw error;
    }
  }, [refresh]);
}
