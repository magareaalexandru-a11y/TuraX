import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export function useAppBootstrap({
  loadProfile,
  setAuthEmail,
  setRememberMe,
  setSession,
  setRole,
  setProfile,
  setScreen,
  setBooting,
  setDbError,
}) {
    useEffect(() => {
      let mounted = true;

      const boot = async () => {
        try {
          const savedRemember = (await AsyncStorage.getItem("turax_remember_me")) === "1";
          const savedEmail = await AsyncStorage.getItem("turax_remember_email");
          if (!mounted) return;
          setRememberMe(savedRemember);
          if (savedEmail) setAuthEmail(savedEmail);

          const { data } = await supabase.auth.getSession();
          let current = data.session;

          if (current && !savedRemember) {
            await supabase.auth.signOut({ scope: "local" });
            current = null;
          }

          if (!mounted) return;
          setSession(current);
          if (current?.user?.id) {
            await loadProfile(current.user.id, true);
          }
        } catch (e) {
          if (mounted) setDbError(e?.message || "Eroare la inițializarea aplicației.");
        } finally {
          if (mounted) setBooting(false);
        }
      };

      boot();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!mounted) return;
        if (!nextSession) {
          setSession(null);
          setRole(null);
          setProfile(null);
          setScreen("home");
          setBooting(false);
          return;
        }

        setBooting(true);
        setSession(nextSession);
        setTimeout(async () => {
          if (!mounted) return;
          await loadProfile(nextSession.user.id, true);
          if (mounted) setBooting(false);
        }, 0);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }, []);
}
