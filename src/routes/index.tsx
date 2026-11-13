import { createFileRoute } from "@tanstack/react-router";
import { CatalogView } from "@/components/catalog-view";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Tu cine, sin límites",
      "Explora películas y series en TGVideo, tu biblioteca personal de Telegram.",
    ),
  component: () => <CatalogView />,
});
