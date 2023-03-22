import { useEffect } from "react";

import { createStore } from "@/stores/createStore";
import { useSettings } from "@/services/settings";
import { relayPort } from "@/config.mjs";

/**
 * Create a Zustand store to manage relay state.
 */
const useRelayStore = createStore((set) => ({
  status: "disconnected",
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
}));

/**
 * Hook to use the relay store.
 * @returns Relay
 */
export function useRelay() {
  const { data: settings } = useSettings();
  const { setStatus, setHasFetchedAllEvents, addEvent, resetEvents } =
    useRelayStore.getState();

  useEffect(() => {
    // Websocket URL of the relay
    const webSocketProtocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";
    const webSocketRelayUrl = `${webSocketProtocol}//localhost:${relayPort}`;
    // Generate a random subscription ID
    const subscriptionID =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Merge public relays with the local relay

    // Create websocket connection
    const socket = new WebSocket(webSocketRelayUrl);

    // Handle websocket connection open event
    socket.onopen = () => {
      setStatus("connected");
      // Reset events array to clear previous events
      resetEvents();
      // Request latest 100 events
      socket.send(
        JSON.stringify([
          "REQ",
          subscriptionID,
          {
            limit: 100,
          },
        ]),
      );
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
        setHasFetchedAllEvents();
        return;
      }

      // If the data is of type EVENT
      if (data[0] === "EVENT") {
        const { id, kind, created_at, content } = data[2];
        // Add the event to the events array
        addEvent({ id, kind, created_at, content });
      }
    };

    // Handle websocket error
    socket.onerror = () => {
      setStatus("error");
    };

    // // Handle websocket close
    socket.onclose = () => {
      setStatus("disconnected");
    };

    // Cleanup function to run on component unmount
    return () => {
      // Check if the websocket is open
      if (socket.readyState === WebSocket.OPEN) {
        // Stop previous subscription and close the websocket
        socket.send(JSON.stringify(["CLOSE", subscriptionID]));
      }

      socket.close();
    };
  }, [
    settings.publicRelays,
    settings.npub,
    setStatus,
    setHasFetchedAllEvents,
    addEvent,
    resetEvents,
  ]);

  return {
    events: useRelayStore((state) => state.events),
    status: useRelayStore((state) => state.status),
    hasFetchedAllEvents: useRelayStore((state) => state.hasFetchedAllEvents),
  };
}
