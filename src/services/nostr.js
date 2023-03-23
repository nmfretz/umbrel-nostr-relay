import { uniq } from "remeda";
import { nip05 } from "nostr-tools";

/**
 * Check NIP-05 is valid. See: https://github.com/nostr-protocol/nips/blob/master/05.md#nip-05
 *
 * @param {string} nip05
 * @returns { boolean }
 */
export function isValidNip05(nip05) {
  return nip05.match(/^[a-z0-9\-_.]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
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
 * @param {string} address
 */
export async function fetchNip05Profile(address) {
  const profile = await nip05.queryProfile(address);
  return profile;
}

export async function startRelaySync() {
  await fetch("/relay/sync");
}
