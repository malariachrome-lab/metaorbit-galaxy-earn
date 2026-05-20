import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccountStatus = "inactive" | "active" | "suspended";
export type AppRole = "admin" | "user";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  phone: string | null;
  status: AccountStatus;
  balance: number;
  referral_code: string;
  referred_by: string | null;
  package_id: string | null;
  package_activated_at: string | null;
  package_expires_at: string | null;
  daily_tasks_completed: number;
  daily_reset_date: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Cache profile/roles in sessionStorage to prevent flash on refresh
const PROFILE_CACHE_KEY = "mo_profile_cache";
const ROLES_CACHE_KEY = "mo_roles_cache";

function getCachedProfile(): Profile | null {
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function getCachedRoles(): AppRole[] {
  try {
    const cached = sessionStorage.getItem(ROLES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
}

function cacheUserData(profile: Profile | null, roles: AppRole[]) {
  try {
    if (profile) {
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    }
    if (roles.length) {
      sessionStorage.setItem(ROLES_CACHE_KEY, JSON.stringify(roles));
    } else {
      sessionStorage.removeItem(ROLES_CACHE_KEY);
    }
  } catch { /* ignore */ }
}

function clearUserCache() {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
    sessionStorage.removeItem(ROLES_CACHE_KEY);
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(getCachedProfile);
  const [roles, setRoles] = useState<AppRole[]>(getCachedRoles);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  const loadUserData = useCallback(async (userId: string) => {
    // Prevent concurrent loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    try {
      const [{ data: profileData }, { data: rolesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      
      const newProfile = (profileData as Profile | null) ?? null;
      const newRoles = (rolesData ?? []).map((r) => r.role as AppRole);
      
      setProfile(newProfile);
      setRoles(newRoles);
      cacheUserData(newProfile, newRoles);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    const initAuth = async () => {
      try {
        // First try getSession (fast, from localStorage)
        const { data: { session: storedSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (storedSession?.user) {
          setSession(storedSession);
          // Load fresh user data in background
          loadUserData(storedSession.user.id);
        } else {
          // No stored session, clear any stale cache
          clearUserCache();
          setProfile(null);
          setRoles([]);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        clearUserCache();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);
      
      if (event === "SIGNED_OUT") {
        clearUserCache();
        setProfile(null);
        setRoles([]);
      } else if (newSession?.user) {
        // Use setTimeout to avoid race conditions with Supabase
        setTimeout(() => {
          if (mounted) loadUserData(newSession.user.id);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const refresh = useCallback(async () => {
    if (session?.user) {
      await loadUserData(session.user.id);
    }
  }, [session?.user, loadUserData]);

  const signOut = useCallback(async () => {
    clearUserCache();
    setProfile(null);
    setRoles([]);
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    refresh,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
