import { createFileRoute } from "@tanstack/react-router";
import { CatalogView } from "@/components/catalog-view";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/peliculas")({
  head: () => pageHead("Películas", "Descubre tu colección de películas en TGVideo."),
  component: () => <CatalogView type="movie" />,
});
