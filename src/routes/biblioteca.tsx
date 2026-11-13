import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { TitleCard } from "@/components/title-card";
import { Button } from "@/components/ui/button";
import { useTG } from "@/components/tgvideo-provider";
import { catalog } from "@/lib/catalog";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/biblioteca")({
  head: () => pageHead("Mi biblioteca", "Consulta tus películas vistas y tu historial personal."),
  component: Library,
});
function Library() {
  const { user, history, profile } = useTG();
  const [tab, setTab] = useState("all");
  const items = catalog.filter(
    (i) =>
      (!profile || i.age <= profile.age_limit) &&
      history.some(
        (h) =>
          h.message_id === i.id &&
          (tab === "all" || (tab === "watched" ? h.is_completed : !h.is_completed)),
      ),
  );
  return (
    <main className="page-content">
      <span className="eyebrow">TUS HISTORIAS, EN UN SOLO LUGAR</span>
      <h1>Mi biblioteca</h1>
      <div className="filter-tabs">
        {[
          ["all", "Todo"],
          ["progress", "Seguir viendo"],
          ["watched", "Visto"],
        ].map(([v, l]) => (
          <Button
            variant="secondary"
            className={v === tab ? "selected" : ""}
            onClick={() => setTab(v || "all")}
            key={v}
          >
            {l}
          </Button>
        ))}
      </div>
      {items.length ? (
        <div className="catalog-grid">
          {items.map((i) => (
            <TitleCard key={i.id} item={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bookmark size={38} />
          <h2>{user ? "Tu próxima historia empieza aquí" : "Una biblioteca muy tuya"}</h2>
          <p>
            {user
              ? "Los títulos que marques como vistos aparecerán aquí."
              : "Inicia sesión para guardar tu historial entre dispositivos."}
          </p>
          <Button asChild>
            <Link to={user ? "/" : "/auth"}>{user ? "Explorar catálogo" : "Iniciar sesión"}</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
