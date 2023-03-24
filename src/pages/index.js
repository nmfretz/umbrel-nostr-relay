import Head from "next/head";
import { useEffect, useState } from "react";
import { uniqBy } from "remeda";

import Layout from "@/components/Layout";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Card from "@/components/utility/Card";
import CopyText from "@/components/utility/CopyText";
import ConnectClient from "@/components/ConnectClient";
import TotalBackups from "@/components/TotalBackups";
import LatestActions from "@/components/LatestActions";
import RelaySettingsModal from "@/components/RelaySettingsModal";

import { useRelay } from "@/stores/relay";
import { useLocation } from "@/utils/useLocation";
import { relayPort } from "@/config.mjs";
import { usePublicRelays } from "@/stores/publicRelays";

// Event kinds that we want to render in the UI
const supportedEventKinds = {
  0: {
    icon: "📝",
    name: "Profile Update",
  },
  1: {
    icon: "💭",
    name: "Post",
    showContent: true,
  },
  2: {
    icon: "📶",
    name: "Relay Update",
  },
  3: {
    icon: "🤝",
    name: "Following Update",
  },
  4: {
    icon: "🔏",
    name: "Encrypted DM",
  },
  5: {
    icon: "🗑",
    name: "Deleted Action",
  },
  6: {
    icon: "🔁",
    name: "Repost",
  },
  7: {
    icon: "🤙",
    name: "Reaction",
  },
  40: {
    icon: "🧙‍♂️",
    name: "Channel Creation",
    showContent: true,
    contentKey: "name",
  },
  41: {
    icon: "🪄",
    name: "Channel Update",
    showContent: true,
    contentKey: "name",
  },
  42: {
    icon: "📢",
    name: "Channel Message",
    showContent: true,
  },
  43: {
    icon: "🙈",
    name: "Hid Message",
  },
  44: {
    icon: "🙊",
    name: "Muted User",
  },
  22242: {
    icon: "🔓",
    name: "Authenticated Relay",
  },
  other: {
    icon: "🛠",
    name: "Other Action",
  },
};

// Total events we want to render in the activity list
const eventsToRenderLimit = 300;

const Home = () => {
  const location = useLocation();
  const { events, status, hasFetchedAllEvents } = useRelay();
  const { relays, subscribeToUpdates, unsubscribeToUpdates } =
    usePublicRelays();

  // State to store the relay info as per NIP-11: https://github.com/nostr-protocol/nips/blob/master/11.md
  const [relayInformationDocument, setRelayInformationDocument] = useState({});

  const webSocketProtocol = location?.protocol === "https:" ? "wss:" : "ws:";
  const webSocketRelayUrl = location
    ? `${webSocketProtocol}//${location.hostname}:${relayPort}`
    : "";

  useEffect(() => {
    if (!location) return;

    // HTTP URL of the relay
    const HttpRelayUrl = `${location.protocol}//${location.hostname}:${relayPort}`;

    // get nostr-rs-relay version
    fetch(HttpRelayUrl, {
      method: "GET",
      headers: {
        Accept: "application/nostr+json",
      },
    }).then(async (response) => {
      if (response.ok) {
        const relayInfoDoc = await response.json();
        setRelayInformationDocument(relayInfoDoc);
      }
    });
  }, [location]);

  useEffect(() => {
    subscribeToUpdates();
    return unsubscribeToUpdates;
  }, [subscribeToUpdates, unsubscribeToUpdates]);

  return (
    <Layout>
      <Head>
        <title>Nostr Relay — Umbrel</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <div className="container mx-auto px-4 pb-10">
        <Header isConnected={status === "connected"}>
          <div className="flex flex-col space-y-2 justify-center">
            <div className="relay-url-container shiny-border flex self-center after:bg-white dark:after:bg-slate-900 p-3 rounded-md after:rounded-md">
              <span className="text-sm text-slate-900 dark:text-slate-50">
                Relay URL:&nbsp;&nbsp;
              </span>
              <CopyText value={webSocketRelayUrl} />
            </div>
            <RelaySettingsModal
              openBtn={
                <button className="border border-violet-600/40 self-start bg-slate-900  hover:bg-slate-700 text-white text-sm h-10 px-3 rounded-md w-full flex items-center justify-center sm:w-auto dark:bg-violet-800 dark:highlight-white/20 dark:hover:from-fuchsia-600 dark:hover:to-purple-700 bg-gradient-to-br from-fuchsia-700 to-violet-800">
                  {relays.length
                    ? `Synced to ${
                        relays.filter((relay) => relay.status === "connected")
                          .length
                      }/${relays.length} Public Relays`
                    : "Sync to Public Relays"}
                </button>
              }
            />
          </div>
        </Header>

        <main className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-5 xl:grid-cols-3 gap-6 sm:gap-8">
            <Card
              className="order-last xl:order-first md:col-span-5 xl:col-span-1"
              heading="Connect your Nostr client"
            >
              <ConnectClient relayPort={relayPort} />
            </Card>

            <Card
              className="col-1 md:col-span-2 xl:col-span-1"
              heading="Total actions"
            >
              <TotalBackups
                loading={!hasFetchedAllEvents}
                events={events}
                supportedEventKinds={supportedEventKinds}
              />
            </Card>

            <Card
              className="col-1 md:col-span-3 xl:col-span-1"
              heading="Latest actions"
            >
              <LatestActions
                loading={!hasFetchedAllEvents}
                events={events}
                eventsToRenderLimit={eventsToRenderLimit}
                supportedEventKinds={supportedEventKinds}
              />
            </Card>
          </div>
        </main>

        <Footer
          leftContent={<>&copy; Umbrel 2023.</>}
          rightContent={
            <>
              Powered by{" "}
              <a
                href="https://github.com/scsibug/nostr-rs-relay"
                target="_blank"
                className="underline underline-offset-2"
                rel="noreferrer"
              >
                nostr-rs-relay
                {relayInformationDocument.version
                  ? ` ${relayInformationDocument.version}`
                  : ""}
              </a>
              .
            </>
          }
        />
      </div>
    </Layout>
  );
};

export default Home;

export async function getStaticProps() {
  return { props: {} };
}
