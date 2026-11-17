import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { Play, Check, Plus, Star, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { catalog, type Episode } from "@/lib/catalog";
import { pageHead } from "@/lib/page-head";
import { useTG } from "@/components/tgvideo-provider";
import { Button } from "@/components/ui/button";
import feature from "@/assets/desert-feature.jpg";
const Player = lazy(() =>
  import("@/components/video-player").then((m) => ({ default: m.VideoPlayer })),
);
export const Route = createFileRoute("/titulo/$id")({
  head: ({ params }) => {
    const i = catalog.find((i) => String(i.id) === params.id);
    return pageHead(
      i?.title || "Ficha del título",
      i?.synopsis || "Ficha y reproducción de un título de tus canales de Telegram en TGVideo.",
    );
  },
  component: Detail,
});
function formatSize(b: number) {
  return b > 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${Math.round(b / 1e6)} MB`;
}
function Detail() {
  const { id } = Route.useParams();
  const { mark, entryFor, profile, items, history, saveProgress } = useTG();
  const item = items.find((i) => String(i.id) === id);
  const [playing, setPlaying] = useState<{ ep: Episode; url: string; start: number } | null>(null);
  const [loading, setLoading] = useState<{ ep: Episode; pct: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  if (!item || (profile && item.age > profile.age_limit))
    return (
      <main className="page-content">
        <h1>Título no disponible</h1>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </main>
    );
  const watched = Boolean(entryFor(item)?.is_completed);
  const epEntry = (ep: Episode) =>
    history.find((h) => h.channel_id === ep.channelId && h.message_id === ep.messageId);
  async function play(ep: Episode) {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading({ ep, pct: 0 });
    try {
      const { downloadVideo } = await import("@/lib/telegram-client");
      const url = await downloadVideo(ep, (pct) => setLoading({ ep, pct }), ctrl.signal);
      if (playing) URL.revokeObjectURL(playing.url);
      const h = epEntry(ep);
      setPlaying({ ep, url, start: h && !h.is_completed ? Number(h.current_time) : 0 });
    } catch (e) {
      if (!ctrl.signal.aborted)
        toast.error(e instanceof Error ? e.message : "No se pudo descargar el vídeo.");
    } finally {
      setLoading(null);
    }
  }
  return (
    <main className="page-content">
      <Button variant="ghost" asChild>
        <Link to="/">
          <ArrowLeft /> Volver
        </Link>
      </Button>
      {playing && (
        <section className="settings-section">
          <div className="settings-row">
            <strong>{playing.ep.name}</strong>
            <Button variant="ghost" size="icon" title="Cerrar" onClick={() => setPlaying(null)}>
              <X />
            </Button>
          </div>
          <ClientOnly>
            <Suspense fallback={<p>Cargando reproductor…</p>}>
              <Player
                url={playing.url}
                startAt={playing.start}
                onProgress={(t, d) =>
                  void saveProgress(playing.ep.channelId, playing.ep.messageId, t, d)
                }
              />
            </Suspense>
          </ClientOnly>
        </section>
      )}
      <div className="detail-layout">
        <img
          className="detail-poster"
          src={item.image || feature}
          alt={item.title}
          width={500}
          height={750}
        />
        <div>
          <span className="eyebrow">
            {item.type === "series" ? "SERIE" : "PELÍCULA"} ·{" "}
            {item.source ? item.group.toUpperCase() : "CATÁLOGO DE MUESTRA"}
          </span>
          <h1>{item.title}</h1>
          <div className="feature-meta">
            <span className="rating">
              <Star fill="currentColor" size={15} />
              {item.rating}
            </span>
            {item.year > 0 && <span>{item.year}</span>}
            <span className="age-label">{item.age ? `+${item.age}` : "TP"}</span>
            {item.duration && <span>{item.duration}</span>}
          </div>
          <p>{item.synopsis}</p>
          <div className="detail-buttons">
            {item.episodes?.length ? (
              <Button onClick={() => void play(item.episodes![0]!)} disabled={Boolean(loading)}>
                <Play fill="currentColor" />{" "}
                {item.type === "series" ? "Ver primer episodio" : "Reproducir"}
              </Button>
            ) : (
              <Button asChild>
                <Link to="/ajustes">
                  <Play fill="currentColor" /> Conectar para reproducir
                </Link>
              </Button>
            )}
            <Button variant="secondary" onClick={() => void mark(item, !watched)}>
              {watched ? <Check /> : <Plus />}
              {watched ? "Marcar como no visto" : "Marcar como visto"}
            </Button>
          </div>
          {loading && (
            <div className="status-note">
              Descargando desde Telegram {loading.pct}% · {formatSize(loading.ep.size)}{" "}
              <Button variant="ghost" size="sm" onClick={() => abort.current?.abort()}>
                Cancelar
              </Button>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${loading.pct}%` }} />
              </div>
            </div>
          )}
          <div className="detail-data">
            {item.director && (
              <div>
                <strong>Dirección</strong> {item.director}
              </div>
            )}
            {item.cast && (
              <div>
                <strong>Reparto</strong> {item.cast}
              </div>
            )}
            <div>
              <strong>Género</strong> {item.genre}
            </div>
            <div>
              <strong>Colección</strong> {item.group}
            </div>
          </div>
          {item.type === "series" && item.episodes && (
            <div className="form-stack mt-6">
              <h2>Episodios</h2>
              {item.episodes.map((ep) => {
                const h = epEntry(ep);
                return (
                  <Button
                    key={ep.messageId}
                    variant="secondary"
                    className="justify-between"
                    disabled={Boolean(loading)}
                    onClick={() => void play(ep)}
                  >
                    <span>
                      <Play size={14} /> {ep.name}
                    </span>
                    <span>
                      {h?.is_completed
                        ? "Visto"
                        : h?.duration
                          ? `${Math.round((Number(h.current_time) / Number(h.duration)) * 100)}%`
                          : formatSize(ep.size)}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
