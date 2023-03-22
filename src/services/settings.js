import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { defaultSettings } from "@/config.mjs";

// fetch and post from API: /api/settings
async function fetchSettings() {
  const response = await fetch("/api/settings");
  const json = await response.json();
  return json;
}

function postSettings(data) {
  return fetch("/api/settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    initialData: defaultSettings,
  });

  const mutation = useMutation({
    mutationFn: postSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    data: query.data,
    post: mutation.mutateAsync,
  };
}
