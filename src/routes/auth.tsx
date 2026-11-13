import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import { useTG } from "@/components/tgvideo-provider";
export const Route = createFileRoute("/auth")({
  head: () =>
    pageHead("Tu cuenta", "Accede a TGVideo y sincroniza tu biblioteca entre dispositivos."),
  component: Auth,
});
function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useTG();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Revisa tu correo para restablecer la contraseña.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setMessage(
          data.session
            ? "Cuenta creada."
            : "Revisa tu correo y confirma tu cuenta antes de entrar.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Sesión iniciada.");
      }
    } catch {
      setMessage("No se pudo completar la solicitud. Comprueba tus datos o inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google" | "lovable") {
    setMessage("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) setMessage("No se pudo iniciar sesión. Inténtalo de nuevo.");
  }
  return (
    <main className="page-content">
      <div className="auth-panel">
        <span className="eyebrow">BIENVENIDO A TGVIDEO</span>
        <h1>
          {user
            ? "Ya estás dentro"
            : mode === "signup"
              ? "Crea tu cuenta"
              : mode === "reset"
                ? "Recuperar contraseña"
                : "Tu próxima historia"}
        </h1>
        <p>{user ? "Tu biblioteca te espera." : "Tu cine, en todos tus dispositivos."}</p>
        {user ? (
          <Button asChild className="w-full">
            <Link to="/perfiles">Ver mis perfiles</Link>
          </Button>
        ) : (
          <>
            <form onSubmit={submit} className="form-stack">
              <label>
                Correo electrónico
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {mode !== "reset" && (
                <label>
                  Contraseña
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Un momento…"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : mode === "reset"
                      ? "Enviar enlace"
                      : "Iniciar sesión"}
              </Button>
            </form>
            {mode !== "reset" && (
              <>
                <div className="auth-separator">o continúa con</div>
                <div className="auth-social">
                  <Button className="google-button" onClick={() => void social("google")}>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    Continuar con Google
                  </Button>
                  <Button className="lovable-auth-button" onClick={() => void social("lovable")}>
                    Continuar con Lovable
                  </Button>
                </div>
              </>
            )}
            <div className="filter-tabs">
              <Button
                variant="link"
                onClick={() => {
                  setMode(mode === "signup" ? "login" : "signup");
                  setMessage("");
                }}
              >
                {mode === "signup" ? "Ya tengo cuenta" : "Crear una cuenta"}
              </Button>
              <Button
                variant="link"
                onClick={() => {
                  setMode(mode === "reset" ? "login" : "reset");
                  setMessage("");
                }}
              >
                {mode === "reset" ? "Volver" : "¿Olvidaste la contraseña?"}
              </Button>
            </div>
          </>
        )}
        {message && (
          <p className="status-note" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
