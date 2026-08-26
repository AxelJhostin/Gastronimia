import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-800">
          ⚠️
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          Error 403
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
          Acceso Denegado
        </h1>

        <p className="mt-3 text-sm text-stone-600 leading-relaxed">
          No cuentas con los permisos operativos necesarios para consultar esta sección o ejecutar esta acción.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
          >
            Volver al Panel Principal
          </Link>
          <Link
            href="/dashboard/requests"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Ir a mis Solicitudes
          </Link>
        </div>
      </section>
    </main>
  );
}