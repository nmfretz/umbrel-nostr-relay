import { useEffect } from "react";

import { createStore } from "@/stores/createStore";
import { useSettings } from "@/services/settings";
import { relayPort } from "@/config";

/**
 * Create a Zustand store to manage relays state.
 */
const useRelaysStore = createStore((set, get) => ({
  relays: new Map(),
  addRelay: (id, socket) => {
    // Generate a random subscription ID
    const subscriptionID =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Set method passed to child passes the user itself as state.
    const childSet = (fn) => set((state) => fn(state.relays.get(id)));
    const remove = () => {
      set((state) => {
        state.relays.delete(id);
      });
    };
    const newRelay = createRelay({ remove, subscriptionID, socket }, childSet);
    set((state) => {
      state.relays.set(id, newRelay);
    });

    return newRelay;
  },
  getRelays: () => Array.from(get().relays.values()),
}));

/**
 * State of a relay.
 */
const createRelay = (props, set) => ({
  status: "disconnected",
  subscriptionID: null,
  socket: null,
  events: [],
  hasFetchedAllEvents: false,
  setStatus: (status) => {
    set((state) => {
      state.status = status;
    });
  },
  setHasFetchedAllEvents: () => {
    set((state) => {
      state.hasFetchedAllEvents = true;
    });
  },
  resetEvents: () => {
    set((state) => {
      state.events = [];
    });
  },
  addEvent: (event) => {
    set((state) => {
      state.events.push(event);
    });
  },
  ...props,
});

/**
 * Hook to use the relays store.
 * @returns {Relay[]} Array of relays
 */
export function useRelays() {
  const { addRelay, getRelays } = useRelaysStore();
  const { data: settings } = useSettings();

  useEffect(() => {
    // Websocket URL of the relay
    const webSocketProtocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const webSocketRelayUrl = `${webSocketProtocol}//192.168.1.116:${relayPort}`;

    // Merge public relays with the local relay
    const relaysUrl = [...(settings.publicRelays || []), webSocketRelayUrl];

    for (const relayUrl of relaysUrl) {
      const isPersonalRelay = webSocketRelayUrl === relayUrl;

      // Create websocket connection
      const socket = new WebSocket(relayUrl);

      const relay = addRelay(relayUrl, socket);

      // Handle websocket connection open event
      socket.onopen = () => {
        const filters = {
          limit: 10,
          // Only fetch events from the current user, except for personal relay where we fetch everything
          authors: isPersonalRelay ? undefined : [settings.npub],
        };

        relay.setStatus("connected");
        // Reset events array to clear previous events
        relay.resetEvents();
        // Request latest 100 events
        socket.send(JSON.stringify(["REQ", relay.subscriptionID, filters]));
      };

      // Handle websocket message event
      socket.onmessage = (message) => {
        // Parse the message data
        const data = JSON.parse(message.data);

        if (!data.length) {
          console.error("Error: No data length", data);
          return;
        }

        // Check if data is End of Stored Events Notice
        // https://github.com/nostr-protocol/nips/blob/master/15.md
        if (data[0] === "EOSE") {
          relay.setHasFetchedAllEvents();
          return;
        }

        // If the data is of type EVENT
        if (data[0] === "EVENT") {
          const { id, kind, created_at, content } = data[2];
          // Add the event to the events array
          relay.addEvent({ id, kind, created_at, content });
        }
      };

      // Handle websocket error
      socket.onerror = () => {
        relay.setStatus("error");
      };

      // // Handle websocket close
      socket.onclose = () => {
        relay.setStatus("disconnected");
      };
    }

    // Cleanup function to run on component unmount
    return () => {
      getRelays().forEach((relay) => {
        // Check if the websocket is open
        if (relay.socket.readyState === WebSocket.OPEN) {
          // Stop previous subscription and close the websocket
          relay.socket.send(JSON.stringify(["CLOSE", relay.subscriptionID]));
        }

        relay.socket.close();
      });
    };
  }, [settings.publicRelays, settings.npub, getRelays, addRelay]);

  return getRelays();
}
