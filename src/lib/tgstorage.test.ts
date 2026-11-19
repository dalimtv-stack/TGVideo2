import { describe, expect, it } from "vitest";
import { parseChannel, sectionFor, safeCaption, completedPlayback, allowedAge } from "./tgstorage";
describe("tgstorage rules", () => {
  it("parses dedicated channel names", () =>
    expect(parseChannel("Green Lantern:HBO::Series::tgstorage")).toEqual({
      name: "Green Lantern",
      group: "HBO",
      category: "Series",
      macro: false,
    }));
  it("parses macro channels", () =>
    expect(parseChannel("2000-2010::Películas::tgstorage")).toEqual({
      name: null,
      group: "2000-2010",
      category: "Películas",
      macro: true,
    }));
  it("rejects channels without the suffix", () => expect(parseChannel("HBO::Series")).toBeNull());
  it("uses Sección as virtual folder, not genre", () =>
    expect(
      sectionFor(
        { name: null, group: "HBO", category: "Series", macro: true },
        "Sección: The Wire\nGénero: Drama",
      ),
    ).toBe("The Wire"));
  it("groups unsectioned messages explicitly", () =>
    expect(
      sectionFor(
        { name: null, group: "HBO", category: "Series", macro: true },
        "Nombre de archivo: video.mkv",
      ),
    ).toBe("(Sin sección)"));
  it("preserves the caption header within 1024 UTF-16 units", () => {
    const header = "Nombre de archivo: " + "x".repeat(900);
    const value = safeCaption(header, "😀".repeat(350));
    expect(value.startsWith(header + "\nSinopsis: ")).toBe(true);
    expect(value.length).toBeLessThanOrEqual(1024);
    expect(value.endsWith("\ud83d")).toBe(false);
  });
  it("rejects an oversized header", () =>
    expect(() => safeCaption("x".repeat(1024), "hello")).toThrow());
  it("limits synopsis to 350 UTF-16 units", () =>
    expect(safeCaption("Sección: The Wire", "x".repeat(400))).toBe(
      "Sección: The Wire\nSinopsis: " + "x".repeat(350),
    ));
  it("does not complete at exactly 90 percent", () =>
    expect(completedPlayback(90, 100)).toBe(false));
  it("completes above 90 percent", () => expect(completedPlayback(91, 100)).toBe(true));
  it("does not complete unknown durations", () => expect(completedPlayback(10, 0)).toBe(false));
  it("hides +16 content from a +12 profile", () => expect(allowedAge(16, 12)).toBe(false));
  it("allows content at the profile age limit", () => expect(allowedAge(12, 12)).toBe(true));
  it("hides unclassified content", () => expect(allowedAge(null, 12)).toBe(false));
});

import { parseFileName } from "./tgstorage";
describe("parseFileName", () => {
  it("limpia película con año y calidad", () => {
    expect(parseFileName("Dune.Parte.Dos.2024.1080p.WEB-DL.mkv")).toEqual({
      title: "Dune Parte Dos",
      year: 2024,
      season: null,
      episode: null,
    });
  });
  it("detecta episodio S01E03", () => {
    const r = parseFileName("The_Wire_S01E03_The_Buys.mkv");
    expect([r.title, r.season, r.episode]).toEqual(["The Wire", 1, 3]);
  });
  it("detecta episodio 2x05", () => {
    const r = parseFileName("Dark 2x05.mp4");
    expect([r.title, r.season, r.episode]).toEqual(["Dark", 2, 5]);
  });
});
