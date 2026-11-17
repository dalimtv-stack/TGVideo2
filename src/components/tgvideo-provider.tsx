import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import skinConfig from "@/skins/skin.json";
import { catalog, type Title } from "@/lib/catalog";
export function keyFor(item: Title) {
  const ep = item.episodes?.[0];
  return ep
    ? { channel_id: ep.channelId, message_id: ep.messageId }
    : { channel_id: "demo", message_id: Number(item.id) };
}
const LIB = "tgvideo.library";
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type History = Database["public"]["Tables"]["playback_progress"]["Row"];
type State = {
  user: User | null;
  profiles: Profile[];
  profile: Profile | null;
  history: History[];
  chooseProfile: (p: Profile) => void;
  refresh: () => Promise<void>;
  mark: (item: Title, completed: boolean) => Promise<void>;
  saveProgress: (channel: string, message: number, time: number, duration: number) => Promise<void>;
  entryFor: (item: Title) => History | undefined;
  items: Title[];
  connected: boolean;
  setLibrary: (items: Title[]) => void;
  skin: string;
  setSkin: (v: string) => void;
};
const Context = createContext<State | null>(null);
export function TGProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [skin, setSkin] = useState(skinConfig.id);
  const [library, setLib] = useState<Title[] | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIB);
      if (raw) setLib(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  function setLibrary(list: Title[]) {
    setLib(list.length ? list : null);
    if (list.length) localStorage.setItem(LIB, JSON.stringify(list));
    else localStorage.removeItem(LIB);
  }
  const rawItems = library || catalog;
  const items = rawItems.map((i) => {
    const h = history.find(
      (x) => x.channel_id === keyFor(i).channel_id && x.message_id === keyFor(i).message_id,
    );
    return h && h.duration && !h.is_completed
      ? { ...i, progress: Math.round((Number(h.current_time) / Number(h.duration)) * 100) }
      : library
        ? { ...i, progress: undefined }
        : i;
  });
  function entryFor(item: Title) {
    const k = keyFor(item);
    return history.find((h) => h.channel_id === k.channel_id && h.message_id === k.message_id);
  }
  async function loadHistory(pid: string) {
    const { data } = await supabase
      .from("playback_progress")
      .select("*")
      .eq("profile_id", pid)
      .order("updated_at", { ascending: false });
    setHistory(data || []);
  }
  async function saveProgress(channel: string, message: number, time: number, duration: number) {
    if (!profile || !duration) return;
    await supabase.from("playback_progress").upsert(
      {
        profile_id: profile.id,
        channel_id: channel,
        message_id: message,
        current_time: time,
        duration,
        is_completed: time / duration > 0.9,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,channel_id,message_id" },
    );
    await loadHistory(profile.id);
  }
  async function refresh() {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    setUser(u);
    if (!u) {
      setProfiles([]);
      setProfile(null);
      setHistory([]);
      return;
    }
    const { data, error } = await supabase.from("profiles").select("*").order("created_at");
    if (error) {
      toast.error("No se pudieron cargar los perfiles.");
      return;
    }
    setProfiles(data || []);
    setProfile((old) => data?.find((p) => p.id === old?.id) || data?.[0] || null);
  }
  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event))
        setTimeout(() => void refresh(), 0);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    setHistory([]);
    if (profile)
      void supabase
        .from("playback_progress")
        .select("*")
        .eq("profile_id", profile.id)
        .order("updated_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) toast.error("No se pudo cargar el historial.");
          else setHistory(data || []);
        });
  }, [profile]);
  async function mark(item: Title, completed: boolean) {
    if (!profile) {
      toast.info("Inicia sesión para guardar tu historial.");
      return;
    }
    const { error } = await supabase.from("playback_progress").upsert(
      {
        profile_id: profile.id,
        ...keyFor(item),
        is_completed: completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,channel_id,message_id" },
    );
    if (error) {
      toast.error("No se pudo guardar el estado.");
      return;
    }
    await loadHistory(profile.id);
    toast.success(completed ? "Marcado como visto" : "Marcado como no visto");
  }
  return (
    <Context.Provider
      value={{
        user,
        profiles,
        profile,
        history,
        chooseProfile: setProfile,
        refresh,
        mark,
        saveProgress,
        entryFor,
        items,
        connected: Boolean(library),
        setLibrary,
        skin,
        setSkin,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useTG() {
  const value = useContext(Context);
  if (!value) throw new Error("TGVideo provider missing");
  return value;
}
