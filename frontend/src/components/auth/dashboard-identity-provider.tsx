"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, type CurrentUser } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

type DashboardIdentityState =
  | { status: "loading" }
  | { status: "authenticated"; accessToken: string; user: CurrentUser }
  | { status: "unavailable"; message: string };

const DashboardIdentityContext = createContext<DashboardIdentityState | null>(null);

export function DashboardIdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<DashboardIdentityState>({
    status: "loading",
  });

  useEffect(() => {
    let isActive = true;

    async function loadIdentity() {
      const { data } = await createClient().auth.getSession();

      if (!data.session) {
        if (isActive) {
          setIdentity({
            status: "unavailable",
            message: "Tu sesión expiró. Inicia sesión nuevamente.",
          });
        }
        return;
      }

      try {
        const user = await getCurrentUser(data.session.access_token);
        if (isActive) {
          setIdentity({
            status: "authenticated",
            accessToken: data.session.access_token,
            user,
          });
        }
      } catch {
        if (isActive) {
          setIdentity({
            status: "unavailable",
            message: "No fue posible verificar tu sesión y permisos.",
          });
        }
      }
    }

    void loadIdentity();

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(() => identity, [identity]);

  return (
    <DashboardIdentityContext.Provider value={value}>
      {children}
    </DashboardIdentityContext.Provider>
  );
}

export function useDashboardIdentity() {
  const identity = useContext(DashboardIdentityContext);

  if (!identity) {
    throw new Error(
      "useDashboardIdentity debe utilizarse dentro de DashboardIdentityProvider.",
    );
  }

  return identity;
}
