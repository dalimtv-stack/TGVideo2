// Solo navegador: GramJS se importa dinámicamente para que SSR nunca lo evalúe.
import { parseCaption, parseChannel, sectionFor } from "./tgstorage";
import type { Title, Episode } from "./catalog";

const KEY = "tgvideo.config";
export type TGConfig = { apiId: string; apiHash: string; session: string; tmdbKey: string };
export function loadConfig(): TGConfig {
  try {
    return {
      apiId: "",
      apiHash: "",
      session: "",
      tmdbKey: "",
      ...JSON.parse(localStorage.getItem(KEY) || "{}"),
    };
  } catch {
    return { apiId: "", apiHash: "", session: "", tmdbKey: "" };
  }
}
export function saveConfig(patch: Partial<TGConfig>) {
  const next = { ...loadConfig(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;
let entitiesLoaded = false;

async function getClient() {
  const cfg = loadConfig();
  if (!cfg.apiId || !cfg.apiHash) throw new Error("Introduce tu API ID y API HASH de Telegram.");
  if (client) return client;
  const { TelegramClient } = await import("telegram");
  const { StringSession } = await import("telegram/sessions");
  client = new TelegramClient(new StringSession(cfg.session), Number(cfg.apiId), cfg.apiHash, {
    connectionRetries: 3,
    useWSS: true,
  });
  await client.connect();
  return client;
}
export async function resetClient() {
  try {
    await client?.disconnect();
  } catch {
    /* ignore */
  }
  client = null;
  entitiesLoaded = false;
}
export async function isAuthorized() {
  if (!loadConfig().session) return false;
  try {
    return Boolean(await (await getClient()).checkAuthorization());
  } catch {
    return false;
  }
}

let codeHash = "";
export async function sendCode(phone: string) {
  const c = await getClient();
  const cfg = loadConfig();
  const r = await c.sendCode({ apiId: Number(cfg.apiId), apiHash: cfg.apiHash }, phone);
  codeHash = r.phoneCodeHash;
}
export async function signIn(phone: string, code: string, password?: string) {
  const c = await getClient();
  const { Api } = await import("telegram");
  try {
    await c.invoke(
      new Api.auth.SignIn({ phoneNumber: phone, phoneCodeHash: codeHash, phoneCode: code }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("SESSION_PASSWORD_NEEDED")) throw e;
    if (!password) throw new Error("PASSWORD_NEEDED");
    const cfg = loadConfig();
    await c.signInWithPassword(
      { apiId: Number(cfg.apiId), apiHash: cfg.apiHash },
      {
        password: async () => password,
        onError: (err: Error) => {
          throw err;
        },
      },
    );
  }
  saveConfig({ session: c.session.save() as string });
}
export async function logout() {
  try {
    const c = await getClient();
    await c.invoke(new (await import("telegram")).Api.auth.LogOut());
  } catch {
    /* ignore */
  }
  saveConfig({ session: "" });
  await resetClient();
}

const VIDEO_EXT = /\.(mp4|mkv|webm|avi|mov|m4v|ts)$/i;
function ageFrom(v?: string) {
  const n = Number((v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

async function tmdb(kind: "movie" | "tv", id: string) {
  const key = loadConfig().tmdbKey;
  if (!key || !id) return null;
  const cacheKey = `tgvideo.tmdb.${kind}.${id}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  const bearer = key.length > 40;
  const url = `https://api.themoviedb.org/3/${kind}/${id}?language=es-ES&append_to_response=credits${bearer ? "" : `&api_key=${key}`}`;
  const r = await fetch(url, bearer ? { headers: { Authorization: `Bearer ${key}` } } : undefined);
  if (!r.ok) return null;
  const data = await r.json();
  localStorage.setItem(cacheKey, JSON.stringify(data));
  return data;
}
export async function testTmdb(key: string) {
  const bearer = key.length > 40;
  const r = await fetch(
    `https://api.themoviedb.org/3/configuration${bearer ? "" : `?api_key=${key}`}`,
    bearer ? { headers: { Authorization: `Bearer ${key}` } } : undefined,
  );
  return r.ok;
}

export async function scanLibrary(onStatus: (s: string) => void): Promise<Title[]> {
  const c = await getClient();
  onStatus("Buscando canales tgstorage…");
  const dialogs = await c.getDialogs({ limit: 500 });
  entitiesLoaded = true;
  const titles = new Map<string, Title>();
  for (const d of dialogs) {
    const channel = parseChannel(d.title || "");
    if (!channel) continue;
    const channelId = String(d.id);
    const series = /serie/i.test(channel.category);
    onStatus(`Leyendo ${d.title}…`);
    for await (const m of c.iterMessages(d.entity, { limit: 3000 })) {
      const doc = m.document;
      if (!doc) continue;
      const fileAttr = doc.attributes?.find(
        (a: { className: string }) => a.className === "DocumentAttributeFilename",
      );
      const fileName: string = fileAttr?.fileName || "";
      if (!String(doc.mimeType).startsWith("video/") && !VIDEO_EXT.test(fileName)) continue;
      const caption: string = m.message || "";
      const f = parseCaption(caption);
      const section = sectionFor(channel, caption);
      const episode: Episode = {
        channelId,
        messageId: m.id,
        name: f["Nombre de archivo"] || fileName || `Mensaje ${m.id}`,
        size: Number(doc.size),
        mime: String(doc.mimeType),
      };
      const key = series ? `${channelId}_${section}` : `${channelId}_${m.id}`;
      const existing = titles.get(key);
      if (existing) {
        existing.episodes!.push(episode);
        continue;
      }
      titles.set(key, {
        id: key,
        title: series
          ? section
          : f["Nombre de archivo"]?.replace(/\.[^.]+$/, "").replace(/_/g, " ") ||
            fileName ||
            section,
        original: (series ? section : fileName).toUpperCase(),
        type: series ? "series" : "movie",
        year: 0,
        rating: f["Puntuación"] || "–",
        age: ageFrom(f["Edad"]),
        genre: channel.category,
        duration: "",
        image: "",
        synopsis: f["Sinopsis"] || "",
        director: f["Director"] || "",
        cast: f["Casting"] || "",
        group: channel.group,
        tmdbId: f["ID TMDB"] || "",
        episodes: [episode],
        source: "telegram",
      });
    }
  }
  const list = [...titles.values()];
  onStatus("Completando datos con TMDB…");
  for (const t of list) {
    t.episodes!.sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
    try {
      const info = await tmdb(t.type === "series" ? "tv" : "movie", t.tmdbId || "");
      if (!info) continue;
      t.title = info.title || info.name || t.title;
      t.synopsis = info.overview || t.synopsis;
      t.image = info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : t.image;
      t.backdrop = info.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${info.backdrop_path}`
        : "";
      t.year = Number((info.release_date || info.first_air_date || "").slice(0, 4)) || 0;
      t.rating = info.vote_average ? info.vote_average.toFixed(1) : t.rating;
      t.genre =
        info.genres
          ?.map((g: { name: string }) => g.name)
          .slice(0, 2)
          .join(", ") || t.genre;
      t.cast =
        t.cast ||
        info.credits?.cast
          ?.slice(0, 4)
          .map((p: { name: string }) => p.name)
          .join(", ") ||
        "";
      if (info.runtime) t.duration = `${Math.floor(info.runtime / 60)} h ${info.runtime % 60} min`;
    } catch {
      /* TMDB opcional */
    }
  }
  return list;
}

export async function downloadVideo(
  ep: Episode,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
) {
  const c = await getClient();
  if (!entitiesLoaded) {
    await c.getDialogs({ limit: 500 });
    entitiesLoaded = true;
  }
  const entity = await c.getEntity(BigInt(ep.channelId) as unknown as string);
  const [msg] = await c.getMessages(entity, { ids: [ep.messageId] });
  if (!msg?.document) throw new Error("El mensaje ya no contiene el vídeo.");
  const chunks: BlobPart[] = [];
  let received = 0;
  for await (const chunk of c.iterDownload({ file: msg.media, requestSize: 512 * 1024 })) {
    if (signal.aborted) throw new Error("Descarga cancelada");
    chunks.push(chunk as BlobPart);
    received += chunk.length;
    onProgress(Math.min(100, Math.round((received / ep.size) * 100)));
  }
  const mime = ep.mime === "video/x-matroska" ? "video/webm" : ep.mime;
  return URL.createObjectURL(new Blob(chunks, { type: mime }));
}
