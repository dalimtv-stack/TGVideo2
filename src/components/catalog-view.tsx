import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Play, Plus, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Title } from "@/lib/catalog";
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
  const { user, profile, entryFor, mark, items: all, connected } = useTG();
  const items = all.filter(
    (i) => (!type || i.type === type) && (!profile || i.age <= profile.age_limit),
  );
  const hero = items[0];
  const saved = Boolean(hero && entryFor(hero)?.is_completed);
  return (
    <main>
      {!type && hero && (
        <section className="feature">
          <img
            className="feature-image"
            src={hero.backdrop || feature}
            alt={hero.title}
            width={1920}
            height={1024}
          />
          <div className="feature-shade" />
          <div className="feature-content">
            <div className="feature-kicker">
              <span /> {connected ? "DE TUS CANALES" : "EL DESTACADO DE HOY"}
            </div>
            <h1>{hero.title.toUpperCase()}</h1>
            <div className="feature-meta">
              <span className="rating">
                <Star size={15} fill="currentColor" /> {hero.rating}
              </span>
              {hero.year > 0 && <span>{hero.year}</span>}
              <span className="age-label">{hero.age ? `+${hero.age}` : "TP"}</span>
              {hero.duration && <span>{hero.duration}</span>}
            </div>
            <p>{hero.synopsis.slice(0, 220)}</p>
            <div className="feature-buttons">
              <Button size="lg" asChild>
                <Link to="/titulo/$id" params={{ id: String(hero.id) }}>
                  <Play fill="currentColor" />{" "}
                  {hero.type === "series" ? "Ver serie" : "Ver película"}
                </Link>
              </Button>
              <Button variant="secondary" size="lg" onClick={() => void mark(hero, !saved)}>
                {saved ? <Check /> : <Plus />} {saved ? "Visto" : "Marcar como visto"}
              </Button>
            </div>
            <div className="feature-tags">
              {hero.genre} <span>·</span> {hero.group}
            </div>
          </div>
        </section>
      )}
      <div className="library-content">
        {type && (
          <div className="page-heading">
            <span className="eyebrow">TU UNIVERSO, A UN PLAY</span>
            <h1>{type === "movie" ? "Películas" : "Series"}</h1>
            <p>
              {items.length} títulos {connected ? "en tus canales" : "en el catálogo de muestra"}
            </p>
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
                <span /> {connected ? "Telegram conectado" : "Conectar Telegram"}{" "}
                <ArrowRight size={14} />
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
