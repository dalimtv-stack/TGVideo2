// Solo navegador: GramJS se importa dinámicamente para que SSR nunca lo evalúe.
import { parseCaption, parseChannel, parseFileName, sectionFor } from "./tgstorage";
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
  const g = globalThis as unknown as { Buffer?: unknown; process?: unknown };
  if (!g.Buffer) g.Buffer = (await import("buffer")).Buffer;
  if (!g.process) g.process = { env: {}, browser: true, version: "" };
  const { TelegramClient } = await import("telegram");
  const { StringSession } = await import("telegram/sessions");
  client = new TelegramClient(new StringSession(cfg.session), Number(cfg.apiId), cfg.apiHash, {
    connectionRetries: 3,
    useWSS: true,
    deviceModel: "TGVideo Web",
    systemVersion: "1.0",
    appVersion: "1.0",
    langCode: "es",
    systemLangCode: "es",
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

function tmdbFetch(path: string, params: Record<string, string>) {
  const key = loadConfig().tmdbKey;
  const bearer = key.length > 40;
  const q = new URLSearchParams({
    language: "es-ES",
    ...params,
    ...(bearer ? {} : { api_key: key }),
  });
  return fetch(
    `https://api.themoviedb.org/3/${path}?${q}`,
    bearer ? { headers: { Authorization: `Bearer ${key}` } } : undefined,
  );
}
async function tmdb(kind: "movie" | "tv", id: string, query: string, year: number) {
  if (!loadConfig().tmdbKey) return null;
  const cacheKey = `tgvideo.tmdb2.${kind}.${id || `${query}|${year}`}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  let tmdbId = id;
  if (!tmdbId && query) {
    const params: Record<string, string> = { query };
    if (year) params[kind === "tv" ? "first_air_date_year" : "year"] = String(year);
    let r = await tmdbFetch(`search/${kind}`, params);
    let hit = r.ok ? (await r.json()).results?.[0] : null;
    if (!hit && year) {
      r = await tmdbFetch(`search/${kind}`, { query });
      hit = r.ok ? (await r.json()).results?.[0] : null;
    }
    if (!hit) {
      localStorage.setItem(cacheKey, "null");
      return null;
    }
    tmdbId = String(hit.id);
  }
  if (!tmdbId) return null;
  const r = await tmdbFetch(`${kind}/${tmdbId}`, { append_to_response: "credits" });
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
    const seriesChannel = /serie/i.test(channel.category);
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
      const name = f["Nombre de archivo"] || fileName || `Mensaje ${m.id}`;
      const info = parseFileName(name);
      const hasSection = Boolean(f["Sección"]) || !channel.macro;
      const series = seriesChannel || info.episode !== null;
      // Serie: agrupar por Sección (o canal dedicado); si no hay, por el nombre limpio del archivo.
      const showName = hasSection ? sectionFor(channel, caption) : info.title;
      const episode: Episode = {
        channelId,
        messageId: m.id,
        name:
          info.episode !== null
            ? `T${info.season} · E${String(info.episode).padStart(2, "0")}`
            : name.replace(/\.[^.]+$/, "").replace(/[._]+/g, " "),
        size: Number(doc.size),
        mime: String(doc.mimeType),
      };
      const key = series ? `${channelId}_${showName.toLowerCase()}` : `${channelId}_${m.id}`;
      const existing = titles.get(key);
      if (existing) {
        existing.episodes!.push(episode);
        continue;
      }
      const title = series ? showName : info.title;
      titles.set(key, {
        id: key.replace(/[^a-z0-9_-]+/gi, "-"),
        title,
        original: title.toUpperCase(),
        type: series ? "series" : "movie",
        year: info.year || 0,
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
  for (const t of list)
    t.episodes!.sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true }));
  return enrichLibrary(list, onStatus);
}

// Completa carátula, fondo, sinopsis y reparto desde TMDB (por ID o buscando por título).
export async function enrichLibrary(list: Title[], onStatus: (s: string) => void = () => {}) {
  if (!loadConfig().tmdbKey) return list;
  let done = 0;
  for (const t of list) {
    onStatus(`Buscando carátulas en TMDB… ${++done}/${list.length}`);
    try {
      const info = await tmdb(
        t.type === "series" ? "tv" : "movie",
        t.tmdbId || "",
        t.title,
        t.year,
      );
      if (!info) continue;
      t.tmdbId = String(info.id);
      t.title = info.title || info.name || t.title;
      t.original = (info.original_title || info.original_name || t.title).toUpperCase();
      t.synopsis = info.overview || t.synopsis;
      if (info.poster_path) t.image = `https://image.tmdb.org/t/p/w500${info.poster_path}`;
      if (info.backdrop_path) t.backdrop = `https://image.tmdb.org/t/p/w1280${info.backdrop_path}`;
      t.year = Number((info.release_date || info.first_air_date || "").slice(0, 4)) || t.year;
      if (info.vote_average) t.rating = info.vote_average.toFixed(1);
      t.genre =
        info.genres
          ?.map((g: { name: string }) => g.name)
          .slice(0, 2)
          .join(", ") || t.genre;
      t.director =
        t.director ||
        info.credits?.crew?.find((p: { job: string }) => p.job === "Director")?.name ||
        info.created_by?.map((p: { name: string }) => p.name).join(", ") ||
        "";
      t.cast =
        t.cast ||
        info.credits?.cast
          ?.slice(0, 4)
          .map((p: { name: string }) => p.name)
          .join(", ") ||
        "";
      if (info.runtime) t.duration = `${Math.floor(info.runtime / 60)} h ${info.runtime % 60} min`;
      if (info.number_of_seasons)
        t.duration = `${info.number_of_seasons} temporada${info.number_of_seasons > 1 ? "s" : ""}`;
    } catch {
      /* TMDB opcional */
    }
  }
  return list;
}

// Reproducción por streaming: el vídeo empieza en segundos y se pueden hacer saltos,
// sin descargar el archivo completo.
export async function openVideo(ep: Episode) {
  const { streamingAvailable, openStream } = await import("./telegram-stream");
  if (!(await streamingAvailable()))
    throw new Error(
      "Este navegador no permite reproducir en streaming. Prueba con Chrome, Edge o Firefox.",
    );
  const c = await getClient();
  if (!entitiesLoaded) {
    await c.getDialogs({ limit: 500 });
    entitiesLoaded = true;
  }
  const entity = await c.getEntity(BigInt(ep.channelId) as unknown as string);
  const [msg] = await c.getMessages(entity, { ids: [ep.messageId] });
  if (!msg?.document) throw new Error("El mensaje ya no contiene el vídeo.");
  const mime = ep.mime === "video/x-matroska" ? "video/webm" : ep.mime || "video/mp4";
  return openStream({ client: c, media: msg.media, size: ep.size, mime, name: ep.name });
}
