export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-2xl rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Gastronomía
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Gestión de inventario, préstamos y trazabilidad
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          La base técnica está lista. El desarrollo funcional comenzará por
          autenticación, configuración académica e inventario.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          Consulta el README del repositorio para iniciar los servicios y ejecutar
          las pruebas.
        </p>
      </section>
    </main>
  );
}
