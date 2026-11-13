import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Grid2X2, Rows3, Send, LogOut, Upload, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTG } from "@/components/tgvideo-provider";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
import { safeCaption } from "@/lib/tgstorage";
const Player = lazy(() =>
  import("@/components/video-player").then((m) => ({ default: m.VideoPlayer })),
);
export const Route = createFileRoute("/ajustes")({
  head: () => pageHead("Ajustes", "Personaliza TGVideo, conecta Telegram y gestiona tu cuenta."),
  component: Settings,
});
function Settings() {
  const { skin, setSkin, user } = useTG();
  const [editor, setEditor] = useState(false);
  const [filename, setFilename] = useState("");
  const [section, setSection] = useState("");
  const [tmdb, setTmdb] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("");
  function preview(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCaption(
        safeCaption(
          `Nombre de archivo: ${filename}\nSección: ${section}\nID TMDB: ${tmdb}`,
          synopsis,
        ),
      );
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caption inválido");
    }
  }
  return (
    <main className="page-content">
      <span className="eyebrow">A TU MANERA</span>
      <h1>Ajustes</h1>
      <div className="settings-sections">
        <section className="settings-section">
          <h2>Telegram</h2>
          <p>Conecta tus canales para descubrir tu biblioteca personal.</p>
          <div className="settings-row">
            <span className="status-note">
              Sin conectar · credenciales de aplicación pendientes
            </span>
            <Button disabled>
              <Send /> Conectar Telegram
            </Button>
          </div>
          <p className="status-note">
            La conexión requiere configurar de forma segura las credenciales de la aplicación
            Telegram. Nunca compartas códigos ni contraseñas en el chat.
          </p>
        </section>
        <section className="settings-section">
          <h2>Apariencia</h2>
          <p>Una biblioteca con tu estilo.</p>
          <div className="skin-options">
            {[
              ["cinema", "Cinematográfica", Rows3],
              ["grid", "Cuadrícula", Grid2X2],
            ].map(([v, l, Icon]) => {
              const I = Icon as typeof Rows3;
              return (
                <Button
                  key={String(v)}
                  variant="ghost"
                  className={`skin-choice ${skin === v ? "selected" : ""}`}
                  onClick={() => setSkin(String(v))}
                >
                  <I />
                  {String(l)}
                </Button>
              );
            })}
          </div>
        </section>
        <section className="settings-section">
          <h2>Tu cuenta</h2>
          <div className="settings-row">
            <p>
              {user
                ? "Sesión iniciada · historial sincronizado"
                : "Inicia sesión para sincronizar tus perfiles e historial."}
            </p>
            {user ? (
              <Button variant="outline" onClick={() => void supabase.auth.signOut()}>
                <LogOut /> Cerrar sesión
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </section>
        <section className="settings-section">
          <h2>Preparar una subida</h2>
          <p>Organiza el nombre, la sección y los metadatos de tu vídeo.</p>
          <Button variant="outline" onClick={() => setEditor(!editor)}>
            <Upload /> {editor ? "Cerrar editor" : "Preparar caption"}
          </Button>
          {editor && (
            <form className="form-stack mt-6" onSubmit={preview}>
              <label>
                Nombre de archivo
                <input
                  required
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="S01E01_The_Target.mkv"
                />
              </label>
              <label>
                Sección
                <input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="The Wire"
                />
              </label>
              <label>
                ID TMDB
                <input value={tmdb} onChange={(e) => setTmdb(e.target.value)} inputMode="numeric" />
              </label>
              <label>
                Sinopsis
                <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
              </label>
              <Button type="submit">Preparar</Button>
              {error && <p className="error-note">{error}</p>}
              {caption && (
                <>
                  <pre className="caption-preview">{caption}</pre>
                  <p className="status-note">
                    {caption.length} / 1024 unidades UTF-16 · envío pendiente de conexión Telegram
                  </p>
                </>
              )}
            </form>
          )}
        </section>
        <section className="settings-section">
          <h2>Reproductor</h2>
          <p>Vídeo MP4 o WebM desde una dirección HTTPS accesible.</p>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const parsed = new URL(url);
                if (parsed.protocol !== "https:") throw new Error();
                setSource(url);
                setError("");
              } catch {
                setError("Introduce una dirección HTTPS válida.");
              }
            }}
          >
            <label>
              Dirección del vídeo
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <Button type="submit">
              <Play /> Abrir vídeo
            </Button>
          </form>
          {source && (
            <ClientOnly>
              <Suspense fallback={<p>Cargando vídeo…</p>}>
                <Player url={source} />
              </Suspense>
            </ClientOnly>
          )}
        </section>
        <section className="settings-section">
          <h2>Android y Android TV</h2>
          <p>
            La descarga estará disponible cuando se publique el primer APK firmado en GitHub
            Releases.
          </p>
          <Button variant="outline" disabled>
            Descargar App para Android / TV
          </Button>
        </section>
      </div>
    </main>
  );
}
