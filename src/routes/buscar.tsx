import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { TitleCard } from "@/components/title-card";
import { Button } from "@/components/ui/button";
import { catalog } from "@/lib/catalog";
import { useTG } from "@/components/tgvideo-provider";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/buscar")({
  head: () => pageHead("Buscar", "Encuentra películas y series por título, director o reparto."),
  component: SearchPage,
});
function SearchPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const { profile } = useTG();
  const results = catalog.filter(
    (i) =>
      (!profile || i.age <= profile.age_limit) &&
      (filter === "all" || i.type === filter) &&
      `${i.title} ${i.director} ${i.cast}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="page-content">
      <span className="eyebrow">ENCUENTRA TU PRÓXIMA HISTORIA</span>
      <h1>Buscar</h1>
      <label className="search-box">
        <Search size={20} />
        <input
          aria-label="Buscar en el catálogo"
          placeholder="Películas, series, directores…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </label>
      <div className="filter-tabs">
        {[
          ["all", "Todo"],
          ["movie", "Películas"],
          ["series", "Series"],
        ].map(([v, l]) => (
          <Button
            key={v}
            variant="secondary"
            className={filter === v ? "selected" : ""}
            onClick={() => setFilter(v || "all")}
          >
            {l}
          </Button>
        ))}
      </div>
      <div className="catalog-grid">
        {results.map((i) => (
          <TitleCard key={i.id} item={i} />
        ))}
      </div>
      {!results.length && (
        <div className="empty-state">
          <Search />
          <h2>No hay coincidencias</h2>
          <p>Prueba con otro título o director.</p>
        </div>
      )}
    </main>
  );
}
