import { Fragment, useState, cloneElement, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { uniq } from "remeda";

import {
  fetchNip05Profile,
  isValidNip05,
  sanitizeRelays,
  startRelaySync,
  decodeNpub,
} from "@/services/nostr";
import { useSettings } from "@/services/settings";
import { usePublicRelays } from "@/stores/publicRelays";

import NewRelayModal from "./NewRelayModal";
import RelaysManager from "./RelaysManager";
import { equals } from "remeda";

export default function RelaySettingsModal({ openBtn }) {
  const { settings = {}, save: saveSettings } = useSettings();
  const { relays: syncedRelays } = usePublicRelays();
  const [relays, setRelays] = useState(syncedRelays);
  const [isNewRelayModalOpen, setNewRelayModalOpen] = useState(false);
  // State to store modal open/close state
  const [isOpen, setOpen] = useState(false);
  // State to store NIP-05 or npub address form field value
  const [address, setAddress] = useState("");
  // State to store error message
  const [error, setError] = useState(null);

  // Reset error message when modal is toggled or address changes
  useEffect(() => {
    setError(null);
  }, [isOpen, address]);

  // Set address to the value from settings when settings change
  useEffect(() => {
    setAddress(settings.npubOrnip05Address);
  }, [settings.npubOrnip05Address]);

  useEffect(() => {
    setRelays(syncedRelays);
  }, [syncedRelays]);

  const handleAddressChange = (e) => {
    setAddress(e.currentTarget.value);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleAddRelay = (relay) => {
    setRelays((r) => [
      ...r,
      syncedRelays.find((s) => s.url === relay.url) || relay,
    ]);
  };

  const handleRemoveRelay = (relay) => {
    setRelays((relays) => relays.filter((r) => r.url !== relay.url));
  };

  const toggleNewRelayModal = () => {
    setNewRelayModalOpen(!isNewRelayModalOpen);
    setOpen(!isOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const relaysUrl = relays.map((r) => r.url);
    const isNip05Address = isValidNip05(address);
    const isNpubAddress = address.startsWith("npub");

    if (!isNip05Address && !isNpubAddress) {
      setError("Invalid address");
      return;
    }

    if (isNip05Address) {
      const profile = await fetchNip05Profile(address);

      if (!profile.pubkey) {
        setError("Pubkey not found");
        return;
      }

      if (!profile.relays) {
        setError("Relays not found");
        return;
      }

      // if address and relays didn't change, do nothing
      if (
        address === settings.npubOrnip05Address &&
        equals(syncedRelays, relays)
      ) {
        setOpen(false);
        return;
      }

      if (!relays.length || !syncedRelays.length) {
        const profileRelays = sanitizeRelays(profile.relays);

        await saveSettings({
          pubkey: profile.pubkey,
          npubOrnip05Address: address,
          publicRelays: uniq(relaysUrl, profileRelays),
        });
        setOpen(false);
        return;
      }

      await saveSettings({
        pubkey: profile.pubkey,
        npubOrnip05Address: address,
        publicRelays: relaysUrl,
      });
    }

    if (isNpubAddress) {
      const { data } = decodeNpub(address);

      await saveSettings({
        pubkey: data,
        npubOrnip05Address: address,
        publicRelays: relaysUrl,
      });
    }

    await startRelaySync();
    setOpen(false);
  };

  return (
    <>
      {cloneElement(openBtn, { onClick: () => setOpen(true) })}

      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden col-1 md:col-span-2 xl:col-span-1 bg-white/60 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-xl dark:shadow-gray-900 ring-1 ring-gray-900/5 dark:ring-white/10 rounded-xl bg-white text-left transition-all sm:my-8 sm:w-full sm:max-w-lg">
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-flow-row auto-rows-max gap-6 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="text-center sm:text-left">
                        <Dialog.Title
                          as="h3"
                          className="text-slate-700 dark:text-slate-50 text-xl font-semibold"
                        >
                          Sync to Public Relays
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-body mb-3">
                            Enter your NIP-05 or npub address to sync with your
                            public relays.
                          </p>
                        </div>
                        <input
                          type="text"
                          name="nip-npub-address"
                          className={clsx(
                            "block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
                            error && "ring-red-500",
                          )}
                          placeholder="NIP-05 or npub address"
                          onChange={handleAddressChange}
                          value={address}
                        />
                        {error && (
                          <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                      </div>
                      {relays.length > 0 && (
                        <div className="text-center sm:text-left text-body">
                          <RelaysManager
                            relays={relays}
                            onRemoveRelay={handleRemoveRelay}
                          />
                        </div>
                      )}
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 px-4 py-3 flex flex-col sm:flex-row sm:px-6">
                      <button
                        type="button"
                        className="sm:mr-auto shrink-0 border border-violet-600/40 self-start bg-slate-900  hover:bg-slate-700 text-white text-sm h-10 px-3 rounded-md w-full flex items-center justify-center dark:bg-violet-800 dark:highlight-white/20 dark:hover:from-fuchsia-600 dark:hover:to-purple-700 bg-gradient-to-br from-fuchsia-700 to-violet-800 sm:w-auto disabled:opacity-40"
                        disabled={!settings.npubOrnip05Address && !address}
                        onClick={toggleNewRelayModal}
                      >
                        New Relay
                      </button>
                      <button
                        type="submit"
                        className="md:order-3 mt-3 border border-violet-600/40 self-start bg-slate-900  hover:bg-slate-700 text-white text-sm h-10 px-3 rounded-md w-full flex items-center justify-center dark:bg-violet-800 dark:highlight-white/20 dark:hover:from-fuchsia-600 dark:hover:to-purple-700 bg-gradient-to-br from-fuchsia-700 to-violet-800 sm:ml-3 sm:mt-0 sm:w-auto disabled:opacity-40"
                        disabled={!!error || !address}
                      >
                        Sync to Relays
                      </button>
                      <button
                        type="button"
                        className="sm:ml-auto md:order-2 mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 h-10 text-sm font-semibold text-gray-900 shadow-sm ring-1 items-center ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      <NewRelayModal
        isOpen={isNewRelayModalOpen}
        onClose={toggleNewRelayModal}
        onAddRelay={handleAddRelay}
      />
    </>
  );
}
