import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead("Restablecer contraseña", "Establece una nueva contraseña para tu cuenta TGVideo."),
  component: Reset,
});
function Reset() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    setReady(recovery);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((e) => {
      if (e === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(
      error
        ? "No se pudo actualizar la contraseña."
        : "Contraseña actualizada. Ya puedes iniciar sesión.",
    );
    if (!error) setReady(false);
  }
  return (
    <main className="page-content">
      <div className="auth-panel">
        <h1>Nueva contraseña</h1>
        {ready ? (
          <form className="form-stack" onSubmit={submit}>
            <label>
              Contraseña
              <input
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button type="submit">Guardar contraseña</Button>
          </form>
        ) : (
          <p className="status-note">
            {message || "Abre el enlace de recuperación que recibiste por correo."}
          </p>
        )}
      </div>
    </main>
  );
}
