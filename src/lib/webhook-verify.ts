// Svix webhook signature verification using Web Crypto API

const TOLERANCE_IN_SECONDS = 5 * 60; // 5 minutes

export async function verifyWebhookSignature(
  payload: string,
  headers: {
    "svix-id": string | null;
    "svix-timestamp": string | null;
    "svix-signature": string | null;
  },
  secret: string
): Promise<boolean> {
  const msgId = headers["svix-id"];
  const msgTimestamp = headers["svix-timestamp"];
  const msgSignature = headers["svix-signature"];

  if (!msgId || !msgTimestamp || !msgSignature) {
    return false;
  }

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(msgTimestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > TOLERANCE_IN_SECONDS) {
    return false;
  }

  // Strip "whsec_" prefix from secret
  const rawSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;

  // Decode base64 secret
  const secretBytes = Uint8Array.from(atob(rawSecret), (c) => c.charCodeAt(0));

  // Build signed content
  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
  const encoder = new TextEncoder();

  // Sign with HMAC-SHA256 using Web Crypto
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent)
  );

  // Convert to base64
  const expectedSig =
    "v1," +
    btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // The header may contain multiple signatures separated by spaces
  const signatures = msgSignature.split(" ");
  return signatures.some((sig) => sig.trim() === expectedSig);
}
