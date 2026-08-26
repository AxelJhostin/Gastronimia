import Link from "next/link";

export default function RequestDetailPage() {
  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Solicitudes</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Detalle de solicitud</h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          El detalle y sus ítems deben obtenerse mediante un endpoint con autorización de propietario o personal de pañol. Hasta incorporarlo, esta ruta no consulta tablas directamente desde el cliente.
        </p>
        <Link className="mt-6 inline-flex text-sm font-semibold text-amber-800 underline" href="/dashboard/requests">← Volver a solicitudes</Link>
      </section>
    </main>
  );
}
