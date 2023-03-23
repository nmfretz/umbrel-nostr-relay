import { useEffect, useMemo } from "react";
import { equals } from "remeda";

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
const createPublicRelay = (props) => ({
  status: "disconnected",
  url: null,
  ...props,
});

/**
 * Hook to use the relays store.
 * @returns {Relay[]} Array of relays
 */
export function usePublicRelays() {
  const { settings = {}, isLoading, save } = useSettings();
  const { addRelay } = usePublicRelaysStore();
  const relaysMap = usePublicRelaysStore((state) => state.relays);
  const relays = useMemo(() => Array.from(relaysMap.values()), [relaysMap]);

  // Add relays to store from settings when they change
  useEffect(() => {
    if (isLoading) return;

    for (const relayUrl of settings.publicRelays) {
      addRelay(relayUrl);
    }
  }, [isLoading, settings.publicRelays, addRelay]);

  // Save relays to settings when the store change
  // useEffect(() => {
  //   if (isLoading) return;

  //   save({
  //     publicRelays: relays.map((relay) => relay.url),
  //   });
  // }, [isLoading, settings, relays, save]);

  return {
    relays,
    add: addRelay,
  };
}
