import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginPage from "./login/page";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, cargamos directamente el login
  if (!user) {
    return <LoginPage />;
  }

  // Si hay usuario, verificamos rol para enviarlo a su panel
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "TEACHER") {
    redirect("/dashboard/requests");
  }

  redirect("/dashboard");
}