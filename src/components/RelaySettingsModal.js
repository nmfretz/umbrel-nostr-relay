import { Fragment, useRef, useState, cloneElement, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";

import {
  fetchNip05Profile,
  isValidNip05,
  decodeNip05,
  sanitizeRelays,
  startRelaySync,
} from "@/services/nostr";
import { useSettings } from "@/services/settings";

export default function RelaySettingsModal({ openBtn }) {
  const { data, post: saveSettings } = useSettings();
  // State to store modal open/close state
  const [open, setOpen] = useState(false);
  // State to store NIP-05 or npub address form field value
  const [address, setAddress] = useState(data.npubOrnip05Address);
  // State to store error message
  const [error, setError] = useState(null);

  const cancelButtonRef = useRef(null);

  // Reset error message when modal is toggled
  useEffect(() => {
    setError(null);
  }, [open]);

  // Set address to the value from settings when settings change
  useEffect(() => {
    setAddress(data.npubOrnip05Address);
  }, [data.npubOrnip05Address]);

  const handleAddressChange = (e) => {
    setAddress(e.currentTarget.value);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      await saveSettings({
        pubkey: profile.pubkey,
        npubOrnip05Address: address,
        publicRelays: sanitizeRelays(profile.relays),
      });
      await startRelaySync();
    }

    if (isNpubAddress) {
      //   onSubmitNpub(address);
    }

    setOpen(false);
  };

  return (
    <>
      {cloneElement(openBtn, { onClick: () => setOpen(true) })}
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          initialFocus={cancelButtonRef}
          onClose={setOpen}
        >
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
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:text-left ">
                          <Dialog.Title
                            as="h3"
                            className="text-slate-700 dark:text-slate-50 text-xl font-semibold"
                          >
                            Sync to Public Relays
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                              Enter your NIP-05 or npub address to sync with
                              your public relays.
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
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                      <button
                        type="submit"
                        className="border border-violet-600/40 self-start bg-slate-900  hover:bg-slate-700 text-white text-sm h-10 px-3 rounded-md w-full flex items-center justify-center dark:bg-violet-800 dark:highlight-white/20 dark:hover:from-fuchsia-600 dark:hover:to-purple-700 bg-gradient-to-br from-fuchsia-700 to-violet-800 sm:ml-3 sm:w-auto"
                      >
                        Sync to Relays
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 h-10 text-sm font-semibold text-gray-900 shadow-sm ring-1 items-center ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={handleCancel}
                        ref={cancelButtonRef}
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
    </>
  );
}
