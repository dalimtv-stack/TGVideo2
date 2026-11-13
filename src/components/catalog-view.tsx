import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Plus, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalog, type Title } from "@/lib/catalog";
import { TitleCard } from "./title-card";
import { useTG } from "./tgvideo-provider";
import feature from "@/assets/desert-feature.jpg";
function Rail({
  title,
  items,
  wide = false,
  to,
}: {
  title: string;
  items: Title[];
  wide?: boolean;
  to: "/peliculas" | "/series" | "/biblioteca";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { skin } = useTG();
  return (
    <section className="catalog-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <div>
          <Link to={to}>
            Ver todo <ArrowRight size={14} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            title="Anterior"
            onClick={() => ref.current?.scrollBy({ left: -600, behavior: "smooth" })}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Siguiente"
            onClick={() => ref.current?.scrollBy({ left: 600, behavior: "smooth" })}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div
        ref={ref}
        className={`${skin === "grid" ? "catalog-grid" : "catalog-rail"} ${wide ? "wide-rail" : ""}`}
      >
        {items.map((i) => (
          <TitleCard key={i.id} item={i} wide={wide} />
        ))}
      </div>
    </section>
  );
}
export function CatalogView({ type }: { type?: "movie" | "series" }) {
  const { user, profile, history, mark } = useTG();
  const items = catalog.filter(
    (i) => (!type || i.type === type) && (!profile || i.age <= profile.age_limit),
  );
  const hero = items[0];
  const saved = history.some((h) => h.message_id === 1 && h.is_completed);
  return (
    <main>
      {!type && hero && (
        <section className="feature">
          <img
            className="feature-image"
            src={feature}
            alt="Un viajero ante las dunas de un planeta desértico"
            width={1920}
            height={1024}
          />
          <div className="feature-shade" />
          <div className="feature-content">
            <div className="feature-kicker">
              <span /> EL DESTACADO DE HOY
            </div>
            <h1>
              DUNE<span>PARTE DOS</span>
            </h1>
            <div className="feature-meta">
              <span className="rating">
                <Star size={15} fill="currentColor" /> 8.5
              </span>
              <span>2024</span>
              <span className="age-label">+12</span>
              <span>2 h 46 min</span>
              <span className="quality-label">4K UHD</span>
            </div>
            <p>
              El destino de todo un universo está en sus manos. Paul Atreides se une a los Fremen en
              un viaje de venganza, amor y poder.
            </p>
            <div className="feature-buttons">
              <Button size="lg" asChild>
                <Link to="/titulo/$id" params={{ id: "1" }}>
                  <Play fill="currentColor" /> Ver película
                </Link>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => void mark(1, !saved)}>
                {saved ? <Check /> : <Plus />} {saved ? "Visto" : "Marcar como visto"}
              </Button>
            </div>
            <div className="feature-tags">
              Ciencia ficción <span>·</span> Aventura <span>·</span> Denis Villeneuve
            </div>
          </div>
          <div className="feature-pagination">
            <span className="selected" />
            <span />
            <span />
            <span />
          </div>
          <div className="feature-number">
            01 <span>/ 04</span>
          </div>
        </section>
      )}
      <div className="library-content">
        {type && (
          <div className="page-heading">
            <span className="eyebrow">TU UNIVERSO, A UN PLAY</span>
            <h1>{type === "movie" ? "Películas" : "Series"}</h1>
            <p>{items.length} títulos en el catálogo de muestra</p>
          </div>
        )}
        {!type && (
          <>
            <div className="library-intro">
              <div>
                <h2>Una buena historia te espera</h2>
                <p>
                  {user
                    ? `Bienvenido, ${profile?.name || "a tu biblioteca"}`
                    : "Ponte cómodo. Tú eliges la próxima."}
                </p>
              </div>
              <Link to="/ajustes" className="connection-pill">
                <span /> Conectar Telegram <ArrowRight size={14} />
              </Link>
            </div>
            <Rail
              title="Seguir viendo"
              items={items.filter((i) => i.progress)}
              wide
              to="/biblioteca"
            />
          </>
        )}
        <Rail
          title={type ? "Todos los títulos" : "Películas que no te puedes perder"}
          items={items.filter((i) => type || i.type === "movie")}
          to={type === "series" ? "/series" : "/peliculas"}
        />
        {!type && (
          <Rail
            title="Series para quedarse un capítulo más"
            items={items.filter((i) => i.type === "series")}
            to="/series"
          />
        )}
        <div className="collection-band">
          <span className="eyebrow">SELECCIÓN TGVIDEO</span>
          <h2>Más allá de lo que imaginas.</h2>
          <p>Historias que te llevan a otros mundos.</p>
          <Button variant="outline" asChild>
            <Link to="/peliculas">
              Explorar películas <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
