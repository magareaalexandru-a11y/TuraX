export function useAuthActions({
  supabase,
  AsyncStorage,
  isEmail,
  authEmail,
  authPassword,
  authName,
  rememberMe,
  setAuthBusy,
  setAuthMessage,
  setAuthMode,
  setSession,
  setProfile,
  setRole,
  setScreen,
  setAuthPassword,
}) {
  const handleLogin = async () => {
    setAuthMessage("");
    if (!isEmail(authEmail)) return setAuthMessage("Introdu o adresă de email validă.");
    if (!authPassword) return setAuthMessage("Introdu parola.");

    setAuthBusy(true);
    try {
      await AsyncStorage.setItem("turax_remember_me", rememberMe ? "1" : "0");
      if (rememberMe) {
        await AsyncStorage.setItem("turax_remember_email", authEmail.trim());
      } else {
        await AsyncStorage.removeItem("turax_remember_email");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthMessage(error.message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async () => {
    setAuthMessage("");
    if (authName.trim().length < 2) return setAuthMessage("Introdu numele tău.");
    if (!isEmail(authEmail)) return setAuthMessage("Introdu o adresă de email validă.");
    if (authPassword.length < 8) return setAuthMessage("Parola trebuie să aibă cel puțin 8 caractere.");

    setAuthBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: { data: { full_name: authName.trim() } },
      });
      if (error) return setAuthMessage(error.message);

      if (data.session?.user?.id) {
        await supabase
          .from("profiles")
          .upsert({ id: data.session.user.id, full_name: authName.trim() }, { onConflict: "id" });
      }
      setAuthMessage(
        data.session
          ? "Cont creat. Alege profilul potrivit pentru tine."
          : "Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te."
      );
      if (!data.session) setAuthMode("login");
    } finally {
      setAuthBusy(false);
    }
  };

  const resetPassword = async () => {
    setAuthMessage("");
    if (!isEmail(authEmail)) return setAuthMessage("Introdu întâi adresa de email.");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim());
    setAuthMessage(error ? error.message : "Instrucțiunile pentru resetarea parolei au fost trimise.");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRole(null);
    setScreen("home");
    setAuthPassword("");
  };

  return {
    handleLogin,
    handleSignup,
    resetPassword,
    handleSignOut,
  };
}
