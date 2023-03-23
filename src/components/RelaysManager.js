export default function RelaysManager({ relays }) {
  return (
    <div>
      <h3 className="text-slate-700 dark:text-slate-50 text-xl font-semibold">
        Public Relays
      </h3>
      <ul className="mt-2 grid grid-flow-row auto-rows-max max-h-[250px] gap-1 overflow-y-auto overflow-x-hidden !scrollbar-thin !scrollbar-w-1 !scrollbar-thumb-rounded-full !scrollbar-track-transparent !scrollbar-thumb-black/10 dark:!scrollbar-thumb-white/10">
        {relays.map((relay) => (
          <li key={relay.url} className="flex items-center">
            <button
              type="button"
              className="mr-2 flex-initial inline-flex justify-center rounded-md px-[5px] pb-[2px] h-[19px] mt-[1px] text-sm text-orange-700 font-semibold shadow-sm ring-1 items-center ring-inset ring-orange-700 hover:bg-orange-900/30 sm:w-auto"
              onClick={relay.remove}
            >
              ×
            </button>
            {relay.url}
          </li>
        ))}
      </ul>
    </div>
  );
}
