import { uniq } from "remeda";

/**
 * Split NIP-05 address into local part and domain. See: https://github.com/nostr-protocol/nips/blob/master/05.md#nip-05
 *
 * @param {string} nip05
 * @returns { { localPart: string, domain: string } }
 */
export function decodeNip05(nip05) {
  const [localPart, domain] = nip05.split("@");

  return {
    localPart,
    domain,
  };
}

/**
 * Sanitize relay URLs, making sure they are valid and removing duplicates.
 *
 * @param {string[]} relayUrls
 * @returns {string[]}
 */
export function sanitizeRelays(relayUrls) {
  // Remove invalid URLs
  let sanitizedRelayUrls = relayUrls.filter((relayUrl) => {
    try {
      new URL(relayUrl);
      return true;
    } catch (e) {
      return false;
    }
  });

  // Remove duplicate URLs
  sanitizedRelayUrls = uniq(sanitizedRelayUrls);

  return sanitizedRelayUrls;
}

/**
 * See: https://github.com/nostr-protocol/nips/blob/master/05.md
 *
 * @param {string} localPart
 * @param {string} domain
 * @returns {{"names": { string: string }, "relays": { string: string[] }}}
 */
export async function fetchNip05Metadata(localPart, domain) {
  const response = await fetch(
    `https://${domain}/.well-known/nostr.json?name=${localPart}`,
  );
  const json = await response.json();

  return json;
}

export async function startRelaySync() {
  await fetch("/relay/sync");
}
