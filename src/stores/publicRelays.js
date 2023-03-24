import { useCallback, useEffect, useMemo, useRef } from "react";

import { createStore } from "@/stores/createStore";
import { useSettings } from "@/services/settings";

/**
 * Create a Zustand store to manage public relays state.
 */
const usePublicRelaysStore = createStore((set, get) => ({
  relays: new Map(),
  addRelay: (id) => {
    if (get().relays.has(id)) return get().relays.get(id);

    // Set method passed to child passes the user itself as state.
    const childSet = (fn) => set((state) => fn(state.relays.get(id)));
    const remove = () => {
      set((state) => {
        state.relays.delete(id);
      });
    };
    const newRelay = createPublicRelay({ remove, url: id }, childSet);
    set((state) => {
      state.relays.set(id, newRelay);
    });

    return newRelay;
  },
}));

/**
 * State of a public relay.
 */
const createPublicRelay = (props, set) => ({
  status: "disconnected",
  url: null,
  setStatus: (status) => {
    set((state) => {
      state.status = status;
    });
  },
  ...props,
});

/**
 * Hook to use the relays store.
 * @returns {Relay[]} Array of relays
 */
export function usePublicRelays() {
  const wsRef = useRef();
  const { settings = {}, isLoading } = useSettings();
  const { addRelay } = usePublicRelaysStore();
  const relaysMap = usePublicRelaysStore((state) => state.relays);
  const relays = useMemo(() => Array.from(relaysMap.values()), [relaysMap]);

  const handleSocketStatusChange = useCallback(
    (message) => {
      const data = JSON.parse(message.data);

      for (const relay of relays) {
        const socket = data.find((socket) => socket.url === relay.url);

        if (socket) {
          relay.setStatus(socket.status);
        }
      }
    },
    [relays],
  );

  const subscribeToUpdates = useCallback(() => {
    if (wsRef.current) return;
    wsRef.current = new WebSocket("ws://localhost:3002");
    wsRef.current.onmessage = handleSocketStatusChange;
  }, [handleSocketStatusChange]);

  const unsubscribeToUpdates = useCallback(() => {
    if (!wsRef.current) return;
    wsRef.current.close();
    wsRef.current = null;
  }, []);

  // Add relays to store from settings when they change
  useEffect(() => {
    if (isLoading) return;

    for (const relayUrl of settings.publicRelays) {
      addRelay(relayUrl);
    }
  }, [isLoading, settings.publicRelays, addRelay]);

  return {
    relays,
    add: addRelay,
    subscribeToUpdates,
    unsubscribeToUpdates,
  };
}
