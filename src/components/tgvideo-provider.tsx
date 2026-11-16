import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import skinConfig from "@/skins/skin.json";
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type History = Database["public"]["Tables"]["playback_progress"]["Row"];
type State = {
  user: User | null;
  profiles: Profile[];
  profile: Profile | null;
  history: History[];
  chooseProfile: (p: Profile) => void;
  refresh: () => Promise<void>;
  mark: (id: number, completed: boolean) => Promise<void>;
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
  async function mark(id: number, completed: boolean) {
    if (!profile) {
      toast.info("Inicia sesión para guardar tu historial.");
      return;
    }
    const { error } = await supabase.from("playback_progress").upsert(
      {
        profile_id: profile.id,
        channel_id: "demo",
        message_id: id,
        is_completed: completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,channel_id,message_id" },
    );
    if (error) {
      toast.error("No se pudo guardar el estado.");
      return;
    }
    const { data } = await supabase
      .from("playback_progress")
      .select("*")
      .eq("profile_id", profile.id)
      .order("updated_at", { ascending: false });
    setHistory(data || []);
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
