"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_SESSION_EXPIRED_EVENT,
  API_SESSION_REFRESHED_EVENT,
  getCurrentUser,
  type CurrentUser,
} from "@/lib/api/client";

type DashboardIdentityState =
  | { status: "loading" }
  | { status: "authenticated"; accessToken: string; user: CurrentUser }
  | { status: "unavailable"; message: string };

const DashboardIdentityContext = createContext<DashboardIdentityState | null>(null);

export function DashboardIdentityProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [identity, setIdentity] = useState<DashboardIdentityState>({
    status: "loading",
  });

  useEffect(() => {
    let isActive = true;

    async function loadIdentity(explicitAccessToken?: string) {
      const accessToken =
        explicitAccessToken ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!accessToken) {
        if (isActive) {
          setIdentity({
            status: "unavailable",
            message: "Tu sesión expiró o no iniciaste sesión. Inicia sesión nuevamente.",
          });
        }
        return;
      }

      try {
        const user = await getCurrentUser(accessToken);
        if (isActive) {
          setIdentity({
            status: "authenticated",
            accessToken: localStorage.getItem("access_token") || accessToken,
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

    const handleSessionRefreshed = (event: Event) => {
      const accessToken = (event as CustomEvent<{ accessToken?: string }>).detail
        ?.accessToken;
      if (accessToken) void loadIdentity(accessToken);
    };
    const handleSessionExpired = () => {
      if (isActive) {
        setIdentity({
          status: "unavailable",
          message: "Tu sesión expiró. Inicia sesión nuevamente.",
        });
      }
      router.replace("/login?reason=session-expired");
    };

    window.addEventListener(API_SESSION_REFRESHED_EVENT, handleSessionRefreshed);
    window.addEventListener(API_SESSION_EXPIRED_EVENT, handleSessionExpired);
    void loadIdentity();

    return () => {
      isActive = false;
      window.removeEventListener(API_SESSION_REFRESHED_EVENT, handleSessionRefreshed);
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [router]);

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
