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
