import { redirect } from "next/navigation";

// La ruta histórica se conserva para enlaces existentes. El formulario correcto
// usa FastAPI y se encuentra en /dashboard/users.
export default function NewUserPage() {
  redirect("/dashboard/users");
}
