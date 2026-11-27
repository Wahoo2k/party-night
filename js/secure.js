// Private messages between the TV and each phone. Everyone in a room shares one channel, so without this a
// curious player could read other players' secret roles in their browser's developer tools.
// Each side makes a key pair; the TV and each phone derive a shared secret (ECDH) and encrypt with AES-GCM.
const subtle = globalThis.crypto?.subtle;
export const canEncrypt = !!subtle;
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const EC = { name: 'ECDH', namedCurve: 'P-256' };

export async function newKeys() {
  if (!subtle) return null;
  const kp = await subtle.generateKey(EC, true, ['deriveKey']);
  return { pub: await subtle.exportKey('jwk', kp.publicKey), priv: await subtle.exportKey('jwk', kp.privateKey) };
}

// Only accept a well-formed public key, and keep just the fields we need.
export function cleanPub(p) {
  if (!p || p.kty !== 'EC' || p.crv !== 'P-256' || typeof p.x !== 'string' || typeof p.y !== 'string' || p.x.length > 64 || p.y.length > 64) return null;
  return { kty: 'EC', crv: 'P-256', x: p.x, y: p.y };
}
export const samePub = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;

const cache = new Map();
export function sharedKey(priv, pub) {
  const id = priv.x + '|' + pub.x + pub.y;
  if (!cache.has(id)) cache.set(id, (async () => {
    const mine = await subtle.importKey('jwk', priv, EC, false, ['deriveKey']);
    const theirs = await subtle.importKey('jwk', pub, EC, false, []);
    return subtle.deriveKey({ name: 'ECDH', public: theirs }, mine, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  })());
  return cache.get(id);
}

export async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}
export async function unseal(key, env) {
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv) }, key, unb64(env.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
