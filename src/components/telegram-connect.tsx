import { useEffect, useState } from "react";
import { Send, RefreshCw, LogOut, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTG } from "./tgvideo-provider";
type Step = "creds" | "phone" | "code" | "password" | "ready";
const tg = () => import("@/lib/telegram-client");
export function TelegramConnect() {
  const { setLibrary, connected, items } = useTG();
  const [step, setStep] = useState<Step>("creds");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [tmdbKey, setTmdbKey] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    void tg().then(async (m) => {
      const c = m.loadConfig();
      setApiId(c.apiId);
      setApiHash(c.apiHash);
      setTmdbKey(c.tmdbKey);
      if (c.apiId && c.apiHash) setStep(c.session && (await m.isAuthorized()) ? "ready" : "phone");
    });
  }, []);
  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "PASSWORD_NEEDED") setStep("password");
      else toast.error(translate(msg));
    } finally {
      setBusy("");
    }
  }
  const scan = () =>
    run("Escaneando…", async () => {
      const m = await tg();
      const list = await m.scanLibrary((s) => setBusy(s));
      setLibrary(list);
      toast[list.length ? "success" : "info"](
        list.length
          ? `${list.length} títulos cargados de tus canales`
          : "No se encontraron canales ::tgstorage con vídeos en tu cuenta.",
      );
    });
  return (
    <section className="settings-section">
      <h2>Telegram</h2>
      {step === "creds" && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run("Conectando…", async () => {
              const m = await tg();
              await m.resetClient();
              m.saveConfig({ apiId: apiId.trim(), apiHash: apiHash.trim() });
              setStep("phone");
            });
          }}
        >
          <p>
            Usa tu API ID y API HASH de{" "}
            <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer">
              my.telegram.org
            </a>
            . Se guardan solo en este dispositivo.
          </p>
          <label>
            API ID
            <input
              required
              inputMode="numeric"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
            />
          </label>
          <label>
            API HASH
            <input
              required
              type="password"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={Boolean(busy)}>
            <KeyRound /> {busy || "Guardar y continuar"}
          </Button>
        </form>
      )}
      {step === "phone" && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run("Enviando código…", async () => {
              await (await tg()).sendCode(phone.trim());
              setStep("code");
              toast.success("Te hemos enviado un código a tu app de Telegram.");
            });
          }}
        >
          <label>
            Teléfono con prefijo
            <input
              required
              type="tel"
              placeholder="+34600000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={Boolean(busy)}>
            <Send /> {busy || "Enviar código"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("creds")}>
            Cambiar API ID / HASH
          </Button>
        </form>
      )}
      {(step === "code" || step === "password") && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void run("Verificando…", async () => {
              await (await tg()).signIn(phone.trim(), code.trim(), password || undefined);
              setStep("ready");
              toast.success("Telegram conectado");
              await scan();
            });
          }}
        >
          <label>
            Código de Telegram
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          {step === "password" && (
            <label>
              Contraseña de verificación en dos pasos
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          <Button type="submit" disabled={Boolean(busy)}>
            {busy || "Iniciar sesión"}
          </Button>
        </form>
      )}
      {step === "ready" && (
        <div className="form-stack">
          <p className="status-note">
            Conectado ·{" "}
            {connected ? `${items.length} títulos en tu biblioteca` : "biblioteca sin escanear"}
          </p>
          <Button onClick={() => void scan()} disabled={Boolean(busy)}>
            <RefreshCw /> {busy || "Escanear mis canales"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void run("Cerrando…", async () => {
                await (await tg()).logout();
                setLibrary([]);
                setStep("phone");
              })
            }
          >
            <LogOut /> Desconectar Telegram
          </Button>
        </div>
      )}
      <h2 className="mt-6">TMDB</h2>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          void run("Comprobando…", async () => {
            const m = await tg();
            if (!(await m.testTmdb(tmdbKey.trim())))
              throw new Error("La clave de TMDB no es válida.");
            m.saveConfig({ tmdbKey: tmdbKey.trim() });
            if (connected) {
              const list = await m.enrichLibrary(
                items.map((i) => ({ ...i })),
                (st) => setBusy(st),
              );
              setLibrary(list);
              toast.success(
                `Carátulas actualizadas: ${list.filter((i) => i.image).length} de ${list.length}`,
              );
            } else toast.success("TMDB conectado.");
          });
        }}
      >
        <label>
          API Key o token de lectura
          <input
            required
            type="password"
            value={tmdbKey}
            onChange={(e) => setTmdbKey(e.target.value)}
          />
        </label>
        <Button type="submit" variant="secondary" disabled={Boolean(busy)}>
          Guardar clave TMDB
        </Button>
      </form>
    </section>
  );
}
function translate(msg: string) {
  if (msg.includes("PHONE_CODE_INVALID")) return "El código no es correcto.";
  if (msg.includes("PHONE_CODE_EXPIRED")) return "El código ha caducado. Pide otro.";
  if (msg.includes("PASSWORD_HASH_INVALID")) return "La contraseña no es correcta.";
  if (msg.includes("API_ID_INVALID")) return "API ID o API HASH incorrectos.";
  if (msg.includes("PHONE_NUMBER_INVALID")) return "Número de teléfono no válido.";
  if (msg.includes("FLOOD")) return "Telegram pide esperar antes de reintentar.";
  return msg;
}
