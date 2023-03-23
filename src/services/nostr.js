import { uniq } from "remeda";
import { nip05, nip19 } from "nostr-tools";

/**
 * Check NIP-05 is valid. See: https://github.com/nostr-protocol/nips/blob/master/05.md#nip-05
 *
 * @param {string} nip05
 * @returns { boolean }
 */
export function isValidNip05(nip05) {
  return nip05.match(/^[a-z0-9\-_.]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
}

export function isValidRelayUrl(relayUrl) {
  try {
    new URL(relayUrl);
    return relayUrl.startsWith("ws://") || relayUrl.startsWith("wss://");
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function decodeNpub(npub) {
  return nip19.decode(npub);
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
      isValidRelayUrl(relayUrl);
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
