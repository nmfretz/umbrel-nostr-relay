import fs from "fs";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { relayPort, settingsFilePath } from "./config.mjs";

let reconnectInterval = 1000; // Interval for reconnection attempts in milliseconds
let settings;

const relays = [];
const webSocketRelayUrl = `ws://localhost:${relayPort}`;
const privateRelaySocket = new WebSocket(webSocketRelayUrl);

const server = new WebSocketServer({ port: 3002 });

server.on("connection", (socket) => {
  console.log("Server web socket connection open");
  socket.send(serializeRelays(relays));
});

function sendStatusUpdate() {
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serializeRelays(relays));
    }
  });
}

privateRelaySocket.onopen = () => {
  console.log("Private relay websocket connection open");
};

export function sync() {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFilePath, "utf8"));
  } catch (error) {
    console.log(error);
    // Not settings saved yet, do nothing
  }

  if (settings?.publicRelays) {
    if (!relays.length) {
      for (const relayUrl of settings.publicRelays) {
        const relay = new Relay(relayUrl);
        relay.connect();
        relays.push(relay);
      }
    } else {
      for (const relay of relays) {
        relay.disconnect();
      }
    }
  }
}

class Relay {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.subscriptionID = crypto.randomUUID();
    this.status = "disconnected";
  }

  connect() {
    this.socket.onopen = () => {
      const filters = {
        // Only fetch events from the current user
        authors: [settings.pubkey],
      };

      this.status = "connected";
      sendStatusUpdate();

      this.socket.send(JSON.stringify(["REQ", this.subscriptionID, filters]));
    };

    // Handle websocket message event
    this.socket.onmessage = (message) => {
      // Parse the message data
      const data = JSON.parse(message.data);

      if (!data.length) {
        console.error("Error: No data length", data);
        return;
      }

      // If the data is of type EVENT
      if (data[0] === "EVENT") {
        // Send data to private relay
        privateRelaySocket.send(JSON.stringify(["EVENT", data[2]]));
      }
    };

    this.socket.on("error", function (error) {
      console.error("WebSocket error:", error);
      this.status = "error";
      sendStatusUpdate();
    });

    this.socket.on("close", function () {
      this.status = "disconnected";
      sendStatusUpdate();

      if (!this.socket) return;

      console.log("WebSocket connection closed:", this.socket.url);
      // Stop previous subscription and close the websocket
      // TODO: Is this needed since the socket is already closed?
      this.socket.send(JSON.stringify(["CLOSE", this.subscriptionID]));
      setTimeout(connect, reconnectInterval);
    });
  }

  disconnect() {
    this.socket.close();
  }
}

/**
 * Serialize relays for sending over websocket
 * @param {*} relays
 * @returns {string}
 */
function serializeRelays(relays) {
  const relayData = relays.map((relay) => ({
    url: relay.socket.url,
    status: relay.status,
  }));
  return JSON.stringify(relayData);
}
