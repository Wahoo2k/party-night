// Messaging between the TV (host) and phones.
// Default: Supabase Realtime broadcast on one channel per room code.
// Add ?local=1 to the URL to use the browser's BroadcastChannel instead (same browser, several tabs) for offline testing.
import { SUPABASE_URL, SUPABASE_KEY, CHANNEL_PREFIX } from './config.js';

const isLocal = () => new URLSearchParams(location.search).has('local');

let clientPromise;
async function client() {
  if (!clientPromise) {
    // The Supabase library ships with the app (js/vendor), so joining doesn't depend on an outside server.
    clientPromise = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = new URL('./vendor/supabase.js', import.meta.url).href;
      tag.onload = () => resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 40 } } }));
      tag.onerror = () => reject(new Error('Could not load the connection library'));
      document.head.append(tag);
    });
  }
  return clientPromise;
}

// onMessage(msg) gets every message from the other side. onStatus('live'|'connecting'|'offline').
export async function openRoom(code, onMessage, onStatus = () => {}) {
  const name = CHANNEL_PREFIX + code;
  if (isLocal()) {
    const bc = new BroadcastChannel(name);
    bc.onmessage = e => onMessage(e.data);
    onStatus('live');
    return { send: msg => bc.postMessage(msg), close: () => bc.close() };
  }
  onStatus('connecting');
  const sb = await client();
  const ch = sb.channel(name, { config: { broadcast: { self: false, ack: false } } });
  ch.on('broadcast', { event: 'm' }, ({ payload }) => onMessage(payload));
  ch.subscribe(status => {
    if (status === 'SUBSCRIBED') onStatus('live');
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') onStatus('offline');
  });
  return {
    send: msg => ch.send({ type: 'broadcast', event: 'm', payload: msg }),
    close: () => sb.removeChannel(ch),
  };
}
