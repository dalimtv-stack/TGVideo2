import { useEffect, useRef } from "react";
import { toast } from "sonner";
export function VideoPlayer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let player:
      | { destroy: (remove: boolean) => void; on: (event: string, callback: () => void) => void }
      | undefined;
    void import("artplayer")
      .then(({ default: Artplayer }) => {
        if (disposed || !ref.current) return;
        player = new Artplayer({
          container: ref.current,
          url,
          volume: 0.7,
          autoplay: false,
          fullscreen: true,
          pip: true,
          playbackRate: true,
          setting: true,
          lang: "es",
        });
        player.on("video:error", () =>
          toast.error("No se puede reproducir el vídeo. Comprueba el formato y la dirección."),
        );
      })
      .catch(() => toast.error("No se pudo cargar el reproductor."));
    return () => {
      disposed = true;
      player?.destroy(false);
    };
  }, [url]);
  return <div className="player-container" ref={ref} />;
}
