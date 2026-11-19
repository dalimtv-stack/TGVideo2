export type Channel = { name: string | null; group: string; category: string; macro: boolean };
export function parseChannel(title: string): Channel | null {
  if (!title.endsWith("::tgstorage")) return null;
  const parts = title.slice(0, -11).split("::");
  if (parts.length !== 2) return null;
  const [identity, category] = parts;
  if (!identity || !category) return null;
  const colon = identity.lastIndexOf(":");
  if (colon === -1)
    return { name: null, group: identity.trim(), category: category.trim(), macro: true };
  const name = identity.slice(0, colon).trim();
  const group = identity.slice(colon + 1).trim();
  return name && group ? { name, group, category: category.trim(), macro: false } : null;
}
export function parseCaption(caption: string) {
  const result: Record<string, string> = {};
  for (const line of caption.split("\n")) {
    const pos = line.indexOf(":");
    if (pos > 0) result[line.slice(0, pos).trim()] = line.slice(pos + 1).trim();
  }
  return result;
}
export function sectionFor(channel: Channel, caption: string) {
  return channel.macro
    ? parseCaption(caption)["Sección"] || "(Sin sección)"
    : channel.name || "(Sin sección)";
}
export function safeCaption(header: string, synopsis: string) {
  const prefix = `${header.trim()}\nSinopsis: `;
  if (prefix.length > 1024) throw new Error("La cabecera supera el límite de Telegram.");
  const available = Math.min(350, 1024 - prefix.length);
  let shortened = synopsis.slice(0, available);
  const final = shortened.charCodeAt(shortened.length - 1);
  if (final >= 0xd800 && final <= 0xdbff) shortened = shortened.slice(0, -1);
  return prefix + shortened;
}
export const completedPlayback = (time: number, duration: number) =>
  duration > 0 && time / duration > 0.9;
export const allowedAge = (rating: number | null, limit: number) =>
  rating !== null && rating <= limit;
// Limpia un nombre de archivo y detecta año y episodio (S01E02 / 1x02).
export function parseFileName(raw: string) {
  let s = raw.replace(/\.[a-z0-9]{2,4}$/i, "").replace(/[._]+/g, " ");
  let season: number | null = null;
  let episode: number | null = null;
  const ep = /\bS(\d{1,2})\s?E(\d{1,3})\b|\b(\d{1,2})x(\d{2,3})\b/i.exec(s);
  if (ep) {
    season = Number(ep[1] ?? ep[3]);
    episode = Number(ep[2] ?? ep[4]);
    s = s.slice(0, ep.index);
  }
  let year: number | null = null;
  const y = /[([]?\b(19\d{2}|20\d{2})\b[)\]]?/.exec(s);
  if (y && y.index > 0) {
    year = Number(y[1]);
    s = s.slice(0, y.index);
  }
  s = s
    .replace(
      /\b(2160p|1080p|720p|480p|4k|uhd|hdr|x26[45]|h ?26[45]|hevc|bluray|brrip|web[- ]?dl|webrip|dvdrip|castellano|spanish|esp|dual|latino|aac|ac3|dts)\b.*$/i,
      "",
    )
    .replace(/[-–\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return { title: s || raw, year, season, episode };
}
