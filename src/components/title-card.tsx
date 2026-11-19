import { Link } from "@tanstack/react-router";
import { Star, Check } from "lucide-react";
import type { Title } from "@/lib/catalog";
import { useTG } from "./tgvideo-provider";
import feature from "@/assets/desert-feature.jpg";
export function TitleCard({ item, wide = false }: { item: Title; wide?: boolean }) {
  const { entryFor } = useTG();
  const watched = Boolean(entryFor(item)?.is_completed);
  return (
    <Link
      to="/titulo/$id"
      params={{ id: String(item.id) }}
      className={`title-card ${wide ? "wide" : ""}`}
    >
      <div className="poster-wrap">
        {item.image || !item.source ? (
          <img
            src={item.image || feature}
            alt={item.title}
            width={500}
            height={750}
            loading="lazy"
          />
        ) : (
          <div className="poster-fallback">
            <span>{item.title}</span>
            {item.year > 0 && <small>{item.year}</small>}
          </div>
        )}
        {wide && <div className="wide-title">{item.original}</div>}
        <span className="quality-badge">
          {item.type === "series"
            ? `SERIE${item.episodes ? ` · ${item.episodes.length}` : ""}`
            : item.source
              ? "TG"
              : "4K"}
        </span>
        {watched && (
          <span className="watched-badge">
            <Check size={14} />
          </span>
        )}
        {wide && (
          <div className="progress-track">
            <div className={`progress-fill progress-${item.progress || 0}`} />
          </div>
        )}
      </div>
      <div className="card-caption">
        <h3>{item.title}</h3>
        {wide ? (
          <span>
            {item.type === "series" ? "Serie" : "Película"} <span className="dot">·</span>{" "}
            {item.progress}% visto
          </span>
        ) : (
          <span>
            {item.year || item.group}
            <span className="dot">·</span>
            {item.genre}
            <span className="card-rating">
              <Star size={11} fill="currentColor" />
              {item.rating}
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}
