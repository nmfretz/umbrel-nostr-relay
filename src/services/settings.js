import { useQuery, useMutation } from "@tanstack/react-query";

const initialState = {
  npub: null,
  npubOrnip05Address: "",
  publicRelays: [],
};

// fetch and post from API: /api/settings
async function fetchSettings() {
  const response = await fetch("/api/settings");
  const json = await response.json();
  return json;
}

async function postSettings(data) {
  return fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function useSettings() {
  const query = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    initialData: initialState,
  });
  // const [settings, setSettings] = useState(initialState);
  const mutation = useMutation({
    mutationFn: postSettings,
  });

  return {
    data: query.data,
    post: mutation.mutate,
  };
}
