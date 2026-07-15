"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/browser-client";

type AuthContextValue = {
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ initialUser, children }: { initialUser: User | null; children: ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser((prev) => {
        // A plain token refresh fires this too; only bounce server-rendered
        // bits (root layout, /account) when the actual signed-in user changes.
        if (prev?.id !== nextUser?.id) {
          setTimeout(() => router.refresh(), 0);
        }
        return nextUser;
      });
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
