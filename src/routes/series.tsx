import { createFileRoute } from "@tanstack/react-router";
import { CatalogView } from "@/components/catalog-view";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/series")({
  head: () => pageHead("Series", "Explora series, temporadas y episodios en TGVideo."),
  component: () => <CatalogView type="series" />,
});
