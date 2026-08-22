import { useEffect } from "react";
import { Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export function useAppBootstrap({
  loadProfile,
  setAuthEmail,
  setAuthMode,
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


    const handleRecoveryUrl = async (url) => {
      if (!url || !url.startsWith("turax://reset-password")) return;

      try {
        setAuthMode("reset-password");
        setBooting(true);

        const rawParams = url.includes("#")
          ? url.split("#")[1]
          : url.includes("?")
            ? url.split("?")[1]
            : "";

        const params = {};

        rawParams.split("&").forEach((part) => {
          const eq = part.indexOf("=");
          if (eq === -1) return;

          const key = decodeURIComponent(part.slice(0, eq));
          const value = decodeURIComponent(part.slice(eq + 1));
          params[key] = value;
        });

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        if (!accessToken || !refreshToken) {
          throw new Error("Linkul de resetare este invalid sau a expirat.");
        }

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;
        if (!mounted) return;

        setSession(data.session);
        setAuthMode("reset-password");
        setBooting(false);
      } catch (e) {
        if (!mounted) return;

        setAuthMode("login");
        setBooting(false);
        setDbError(
          e?.message || "Linkul de resetare nu a putut fi procesat."
        );
      }
    };

    const linkSubscription = Linking.addEventListener("url", ({ url }) => {
      handleRecoveryUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleRecoveryUrl(url);
    });

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
      } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return;

      if (event === "PASSWORD_RECOVERY") {
        setSession(nextSession);
        setAuthMode("reset-password");
        setBooting(false);
        return;
      }
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
      linkSubscription.remove();
      };
    }, []);
}
