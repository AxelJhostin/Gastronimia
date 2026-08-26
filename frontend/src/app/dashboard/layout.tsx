import { redirect } from "next/navigation";

import { DashboardIdentityProvider } from "@/components/auth/dashboard-identity-provider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const appMetadata = claims.app_metadata;
  if (
    typeof appMetadata === "object" &&
    appMetadata !== null &&
    "must_change_password" in appMetadata &&
    appMetadata.must_change_password === true
  ) {
    redirect("/change-password");
  }

  return <DashboardIdentityProvider>{children}</DashboardIdentityProvider>;
}
