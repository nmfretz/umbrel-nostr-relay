import clsx from "clsx";

export default function RelaysManager({ relays, onRemoveRelay }) {
  return (
    <div>
      <h3 className="text-slate-700 dark:text-slate-50 text-xl font-semibold">
        Public Relays
      </h3>
      <ul className="mt-2 grid grid-flow-row auto-rows-max max-h-[250px] gap-1 overflow-y-auto overflow-x-hidden !scrollbar-thin !scrollbar-w-1 !scrollbar-thumb-rounded-full !scrollbar-track-transparent !scrollbar-thumb-black/10 dark:!scrollbar-thumb-white/10">
        {relays.map((relay) => (
          <Relay key={relay.url} relay={relay} onRemove={onRemoveRelay} />
        ))}
      </ul>
    </div>
  );
}

function getStatusColor(status) {
  switch (status) {
    case "connected":
      return "fill-green-500";
    case "disconnected":
      return "fill-red-500";
    default:
      return "fill-orange-300";
  }
}

function Relay({ relay, onRemove }) {
  const handleRemoveClick = () => {
    onRemove(relay);
  };

  return (
    <li className="flex items-center ml-[2px]" title={relay.status}>
      <button
        type="button"
        className="mr-2 flex-initial inline-flex justify-center rounded-md w-[20px] pb-[2px] h-[20px] mt-[2px] text-sm text-orange-700 font-semibold shadow-sm ring-1 items-center ring-inset ring-orange-700 hover:bg-orange-900/30"
        onClick={handleRemoveClick}
        title="Remove relay"
      >
        ×
      </button>
      {relay.url}
      <svg
        width="10"
        height="10"
        className={clsx(
          "ml-2 shrink-0 mt-[2px]",

          getStatusColor(relay.status),
        )}
      >
        <circle cx="5" cy="5" r="5" />
      </svg>
    </li>
  );
}
