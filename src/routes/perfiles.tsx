import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, UserRound } from "lucide-react";
import { useTG } from "@/components/tgvideo-provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/perfiles")({
  head: () => pageHead("Perfiles", "Elige y administra tus perfiles de TGVideo."),
  component: Profiles,
});
function Profiles() {
  const { user, profiles, profile, chooseProfile, refresh } = useTG();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .insert({ account_id: user.id, name: name.trim() });
    if (error) {
      setMessage("No se pudo crear el perfil.");
      return;
    }
    setAdding(false);
    setName("");
    await refresh();
  }
  return (
    <main className="page-content">
      <span className="eyebrow">UN ESPACIO PARA CADA HISTORIA</span>
      <h1>¿Quién está viendo?</h1>
      {!user ? (
        <div className="empty-state">
          <UserRound size={38} />
          <p>Inicia sesión para crear tus perfiles.</p>
          <Button asChild>
            <Link to="/auth">Iniciar sesión</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="profiles-list">
            {profiles.map((p) => (
              <Button
                key={p.id}
                variant="ghost"
                className={`profile-tile ${p.id === profile?.id ? "selected" : ""}`}
                onClick={() => chooseProfile(p)}
              >
                <span className="profile-avatar">{p.name[0]}</span>
                <span>{p.name}</span>
              </Button>
            ))}
            <Button variant="ghost" className="profile-tile" onClick={() => setAdding(!adding)}>
              <Plus />
              <span>Añadir perfil</span>
            </Button>
          </div>
          {adding && (
            <form className="form-stack max-w-sm mt-8" onSubmit={add}>
              <label>
                Nombre
                <input
                  required
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <Button type="submit">Crear perfil</Button>
            </form>
          )}
          <p className="status-note">
            El control parental con PIN estará disponible cuando se complete la protección de
            cambios de perfil.
          </p>
          <Button variant="outline" asChild>
            <Link to="/">Continuar</Link>
          </Button>
        </>
      )}
      {message && <p className="error-note">{message}</p>}
    </main>
  );
}
