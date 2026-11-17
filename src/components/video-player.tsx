import { useEffect, useRef } from "react";
import { toast } from "sonner";
type Props = {
  url: string;
  startAt?: number;
  onProgress?: (time: number, duration: number) => void;
};
export function VideoPlayer({ url, startAt = 0, onProgress }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    let disposed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any;
    let timer: ReturnType<typeof setInterval> | undefined;
    void import("artplayer")
      .then(({ default: Artplayer }) => {
        if (disposed || !ref.current) return;
        player = new Artplayer({
          container: ref.current,
          url,
          volume: 0.7,
          autoplay: true,
          fullscreen: true,
          pip: true,
          playbackRate: true,
          setting: true,
          lang: "es",
        });
        player.on("ready", () => {
          if (startAt > 5) player.currentTime = startAt;
        });
        player.on("video:error", () =>
          toast.error(
            "Tu navegador no puede reproducir este formato (p. ej. MKV con audio DTS/AC3). Prueba con MP4.",
          ),
        );
        timer = setInterval(() => {
          if (player?.playing) cb.current?.(player.currentTime, player.duration);
        }, 15000);
        player.on("pause", () => cb.current?.(player.currentTime, player.duration));
      })
      .catch(() => toast.error("No se pudo cargar el reproductor."));
    return () => {
      disposed = true;
      clearInterval(timer);
      if (player) cb.current?.(player.currentTime, player.duration);
      player?.destroy(false);
    };
  }, [url, startAt]);
  return <div className="player-container" ref={ref} />;
}
