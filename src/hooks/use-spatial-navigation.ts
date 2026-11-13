import { useEffect } from "react";
export function useSpatialNavigation() {
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName))
        return;
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),[tabindex="0"]'),
      ).filter((n) => n.getBoundingClientRect().width > 0 && !n.closest('[aria-hidden="true"]'));
      const first = nodes[0];
      if (!first) return;
      const origin =
        active instanceof HTMLElement
          ? active.getBoundingClientRect()
          : first.getBoundingClientRect();
      const x = origin.x + origin.width / 2,
        y = origin.y + origin.height / 2;
      let best: HTMLElement | undefined;
      let score = Infinity;
      for (const n of nodes) {
        if (n === active) continue;
        const r = n.getBoundingClientRect(),
          dx = r.x + r.width / 2 - x,
          dy = r.y + r.height / 2 - y;
        const horizontal = e.key === "ArrowLeft" || e.key === "ArrowRight";
        const main = horizontal ? dx : dy,
          cross = horizontal ? dy : dx;
        const sign = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
        if (main * sign < 5) continue;
        const s = Math.abs(main) + Math.abs(cross) * 3;
        if (s < score) {
          score = s;
          best = n;
        }
      }
      if (best) {
        e.preventDefault();
        best.focus();
        best.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
}
