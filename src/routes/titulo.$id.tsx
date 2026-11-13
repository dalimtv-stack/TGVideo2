import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Check, Plus, Star, ArrowLeft } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { pageHead } from "@/lib/page-head";
import { useTG } from "@/components/tgvideo-provider";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/titulo/$id")({
  head: ({ params }) => {
    const i = catalog.find((i) => String(i.id) === params.id);
    return pageHead(
      i?.title || "Título no disponible",
      i?.synopsis || "Este título no está disponible en TGVideo.",
    );
  },
  component: Detail,
});
function Detail() {
  const { id } = Route.useParams();
  const item = catalog.find((i) => String(i.id) === id);
  const { mark, history, profile } = useTG();
  if (!item || (profile && item.age > profile.age_limit))
    return (
      <main className="page-content">
        <h1>Título no disponible</h1>
        <Button asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </main>
    );
  const watched = history.some((h) => h.message_id === item.id && h.is_completed);
  return (
    <main className="page-content">
      <Button variant="ghost" asChild>
        <Link to="/">
          <ArrowLeft /> Volver
        </Link>
      </Button>
      <div className="detail-layout">
        <img className="detail-poster" src={item.image} alt={item.title} width={500} height={750} />
        <div>
          <span className="eyebrow">
            {item.type === "series" ? "SERIE" : "PELÍCULA"} · CATÁLOGO DE MUESTRA
          </span>
          <h1>{item.title}</h1>
          <div className="feature-meta">
            <span className="rating">
              <Star fill="currentColor" size={15} />
              {item.rating}
            </span>
            <span>{item.year}</span>
            <span className="age-label">+{item.age}</span>
            <span>{item.duration}</span>
          </div>
          <p>{item.synopsis}</p>
          <div className="detail-buttons">
            <Button asChild>
              <Link to="/ajustes">
                <Play fill="currentColor" /> Conectar para reproducir
              </Link>
            </Button>
            <Button variant="secondary" onClick={() => void mark(item.id, !watched)}>
              {watched ? <Check /> : <Plus />}
              {watched ? "Marcar como no visto" : "Marcar como visto"}
            </Button>
          </div>
          <div className="detail-data">
            <div>
              <strong>Dirección</strong> {item.director}
            </div>
            <div>
              <strong>Reparto</strong> {item.cast}
            </div>
            <div>
              <strong>Género</strong> {item.genre}
            </div>
            <div>
              <strong>Colección</strong> {item.group}
            </div>
          </div>
          {item.type === "series" && (
            <p className="status-note">
              Conecta Telegram para cargar temporadas y episodios de tus canales.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
