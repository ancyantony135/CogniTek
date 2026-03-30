import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [subjects, setSubjects] = useState([]);

  // ── Fetch profile + subjects from Supabase ─────────────────────────────────
  const loadProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      setProfileComplete(false);
      setSubjects([]);
      return;
    }
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (prof) {
        setProfile(prof);
        setProfileComplete(true);

        const { data: subs } = await supabase
          .from("user_subjects")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        setSubjects(subs ?? []);
      } else {
        setProfile(null);
        setProfileComplete(false);
        setSubjects([]);
      }
    } catch (err) {
      console.error("Profile load error:", err);
      setProfile(null);
      setProfileComplete(false);
    }
  };

  // ── Session lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Session error:", error);
          throw error;
        }
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await loadProfile(u.id);
        } else {
          setProfile(null);
          setProfileComplete(false);
          setSubjects([]);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setUser(null);
        setProfile(null);
        setProfileComplete(false);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (event === "SIGNED_IN") {
        await loadProfile(u?.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setProfileComplete(false);
        setSubjects([]);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ── Refresh profile (called after onboarding saves) ────────────────────────
  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id);
  };

  // ── Auth actions ────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const register = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) return { success: false, message: error.message };
    return { success: true };
  };

  const getDisplayName = () =>
    profile?.full_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Student";

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign Out Error:", error.message);
    }
    // Force clear state locally so the App redirects immediately
    setUser(null);
    setProfile(null);
    setProfileComplete(false);
    setSubjects([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileComplete,
        subjects,
        loading,
        login,
        register,
        logout,
        getDisplayName,
        refreshProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);