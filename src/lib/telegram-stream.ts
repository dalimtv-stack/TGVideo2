// Solo navegador: puente página <-> Service Worker. Descarga de Telegram únicamente
// los trozos que el reproductor pide (incluidos saltos), con una caché pequeña en memoria.
const PART = 512 * 1024;
const CACHE_PARTS = 24;
type Stream = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  media: unknown;
  size: number;
  mime: string;
  cache: Map<number, Promise<Uint8Array>>;
};
const streams = new Map<string, Stream>();
let listening = false;

export async function streamingAvailable() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("/tgstream-sw.js");
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((res) => {
        const t = setTimeout(res, 3000);
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => {
            clearTimeout(t);
            res();
          },
          { once: true },
        );
      });
    listen();
    return Boolean(navigator.serviceWorker.controller);
  } catch {
    return false;
  }
}

function listen() {
  if (listening) return;
  listening = true;
  navigator.serviceWorker.addEventListener("message", async (ev) => {
    if (ev.data?.type !== "tgstream") return;
    const port = ev.ports[0]!;
    const s = streams.get(ev.data.id);
    if (!s) return port.postMessage({ error: "stream desconocido" });
    try {
      const start: number = ev.data.start;
      const end = Math.min(ev.data.end, s.size - 1);
      if (start >= s.size)
        return port.postMessage({ size: s.size, mime: s.mime, data: new ArrayBuffer(0) });
      const data = await readRange(s, start, end);
      port.postMessage({ size: s.size, mime: s.mime, data: data.buffer }, [data.buffer]);
    } catch (e) {
      port.postMessage({ error: e instanceof Error ? e.message : String(e) });
    }
  });
}

async function getPart(s: Stream, idx: number) {
  const hit = s.cache.get(idx);
  if (hit) {
    s.cache.delete(idx);
    s.cache.set(idx, hit);
    return hit;
  }
  const bigInt = (await import("big-integer")).default;
  const p = (async () => {
    for await (const chunk of s.client.iterDownload({
      file: s.media,
      offset: bigInt(idx * PART),
      requestSize: PART,
      limit: 1,
      fileSize: bigInt(s.size),
    }))
      return new Uint8Array(chunk);
    return new Uint8Array(0);
  })();
  p.catch(() => s.cache.delete(idx));
  s.cache.set(idx, p);
  while (s.cache.size > CACHE_PARTS) s.cache.delete(s.cache.keys().next().value!);
  return p;
}

async function readRange(s: Stream, start: number, end: number) {
  const first = Math.floor(start / PART);
  const last = Math.floor(end / PART);
  const parts = await Promise.all(
    Array.from({ length: last - first + 1 }, (_, i) => getPart(s, first + i)),
  );
  if ((last + 1) * PART < s.size) void getPart(s, last + 1);
  const out = new Uint8Array(end - start + 1);
  let pos = 0;
  parts.forEach((p, i) => {
    const base = (first + i) * PART;
    const from = Math.max(0, start - base);
    const to = Math.min(p.length, end - base + 1);
    if (to > from) {
      out.set(p.subarray(from, to), pos);
      pos += to - from;
    }
  });
  return out.slice(0, pos);
}

export function openStream(o: {
  client: unknown;
  media: unknown;
  size: number;
  mime: string;
  name: string;
}) {
  const id = Math.random().toString(36).slice(2);
  streams.set(id, { ...o, cache: new Map() } as Stream);
  return { url: `/tgstream/${id}/${encodeURIComponent(o.name)}`, close: () => streams.delete(id) };
}
