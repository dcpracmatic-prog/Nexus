/**
 * NEXUS package envelope (MVP cryptographic primitive).
 * Purpose: persist user-created state as an opaque package outside the runtime.
 * This is not a complete production key-management system.
 */
export interface NexusPackageEnvelope {
  format: "nexus.pkg";
  version: 2;
  userId: string;
  createdAt: string;
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}
function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function deriveKey(passphrase: string, userId: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", encoder.encode(`${userId}:${passphrase}`), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptNexusPackage(userId: string, passphrase: string, payload: unknown): Promise<NexusPackageEnvelope> {
  if (!userId || !passphrase) throw new Error("userId y passphrase son obligatorios");
  const iterations = 310000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, userId, salt, iterations);
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(userId) }, key, plaintext);
  return { format: "nexus.pkg", version: 2, userId, createdAt: new Date().toISOString(), kdf: "PBKDF2-SHA-256", iterations, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

export async function decryptNexusPackage<T>(envelope: NexusPackageEnvelope, passphrase: string): Promise<T> {
  const key = await deriveKey(passphrase, envelope.userId, fromBase64(envelope.salt), envelope.iterations);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(envelope.iv), additionalData: encoder.encode(envelope.userId) }, key, fromBase64(envelope.ciphertext));
  return JSON.parse(decoder.decode(plaintext)) as T;
}
