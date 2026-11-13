import { Link, useLocation } from "@tanstack/react-router";
import { Film, House, Tv, Search, Settings, Play, ChevronDown, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTG } from "./tgvideo-provider";
export function TGShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { profile } = useTG();
  const links = [
    { to: "/" as const, label: "Inicio", icon: House },
    { to: "/peliculas" as const, label: "Películas", icon: Film },
    { to: "/series" as const, label: "Series", icon: Tv },
    { to: "/biblioteca" as const, label: "Mi biblioteca", icon: Radio },
  ];
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Play fill="currentColor" />
          </span>
          TG<span>Video</span>
        </Link>
        <nav className="desktop-nav">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Button variant="ghost" size="icon" asChild title="Buscar">
            <Link to="/buscar" aria-label="Buscar">
              <Search />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild title="Ajustes">
            <Link to="/ajustes" aria-label="Ajustes">
              <Settings />
            </Link>
          </Button>
          <Button variant="ghost" asChild className="profile-button">
            <Link to="/perfiles">
              <span className="profile-avatar">{profile?.name[0] || "J"}</span>
              <span>{profile?.name || "Invitado"}</span>
              <ChevronDown />
            </Link>
          </Button>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <Link to="/" className="brand small">
          TG<span>Video</span>
        </Link>
        <span>Tu cine. Tu biblioteca.</span>
        <span>Catálogo de muestra · Telegram no conectado</span>
      </footer>
      <nav className="mobile-nav">
        {[
          ...links.slice(0, 3),
          { to: "/buscar" as const, label: "Buscar", icon: Search },
          { to: "/ajustes" as const, label: "Ajustes", icon: Settings },
        ].map((l) => (
          <Link key={l.to} to={l.to} className={pathname === l.to ? "active" : ""}>
            <l.icon />
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
