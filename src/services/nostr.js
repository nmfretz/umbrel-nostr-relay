export function decodeNip05(nip05) {
  const [localPart, domain] = nip05.split("@");

  return {
    localPart,
    domain,
  };
}

export async function fetchNip05Metadata(localPart, domain) {
  const response = await fetch(
    `https://${domain}/.well-known/nostr.json?name=${localPart}`,
  );
  const json = await response.json();

  return json;
}
