import { Fragment, useRef, useState, cloneElement, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";

import { usePublicRelays } from "@/stores/publicRelays";
import { isValidRelayUrl } from "@/services/nostr";

export default function RelaySettingsModal({ openBtn, isOpen, onClose }) {
  const { add: addRelay } = usePublicRelays();
  // State to store modal open/close state
  const [_isOpen, setOpen] = useState(false);
  // State to store NIP-05 or npub address form field value
  const [address, setAddress] = useState("");
  // State to store error message
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Reset error message when modal is toggled or address changes
  useEffect(() => {
    setError(null);
  }, [_isOpen, address]);

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  const handleAddressChange = (e) => {
    setAddress(e.currentTarget.value);
  };

  const handleCancel = () => {
    close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isValidRelayUrl(address)) {
      addRelay(address);
      close();
    } else {
      setError("Invalid relay url");
    }
  };

  return (
    <>
      {openBtn && cloneElement(openBtn, { onClick: () => setOpen(true) })}
      <Transition.Root show={_isOpen} as={Fragment}>
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
                          Add New Relay
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-body mb-3">
                            The url where the relay is hosted.
                          </p>
                        </div>
                        <input
                          type="url"
                          name="relay-url"
                          className={clsx(
                            "block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
                            error && "ring-red-500",
                          )}
                          placeholder="wss://relay.example.com"
                          onChange={handleAddressChange}
                          value={address}
                        />
                        {error && (
                          <p className="text-red-500 text-sm mt-2">{error}</p>
                        )}
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 px-4 py-3 sm:flex sm:px-6 justify-end">
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 h-10 text-sm font-semibold text-gray-900 shadow-sm ring-1 items-center ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="mt-3 border border-violet-600/40 self-start bg-slate-900  hover:bg-slate-700 text-white text-sm h-10 px-3 rounded-md w-full flex items-center justify-center dark:bg-violet-800 dark:highlight-white/20 dark:hover:from-fuchsia-600 dark:hover:to-purple-700 bg-gradient-to-br from-fuchsia-700 to-violet-800 sm:ml-3 sm:mt-0 sm:w-auto"
                      >
                        Add Relays
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
