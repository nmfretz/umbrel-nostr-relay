import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  });

  const mutation = useMutation({
    mutationFn: postSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
  };
}
