import Link from 'next/link';

export default function SolicitudesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Gestión de Solicitudes</h1>
        <p className="text-sm text-stone-500">Selecciona una opción para continuar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/solicitudes/nueva"
          className="p-6 bg-white border border-stone-200 rounded-xl hover:border-amber-700 transition shadow-sm"
        >
          <h2 className="font-bold text-stone-900 text-lg">Nueva Solicitud</h2>
          <p className="text-xs text-stone-500 mt-1">Crear un pedido de insumos para clases o talleres.</p>
        </Link>

        <Link
          href="/solicitudes/mis-solicitudes"
          className="p-6 bg-white border border-stone-200 rounded-xl hover:border-amber-700 transition shadow-sm"
        >
          <h2 className="font-bold text-stone-900 text-lg">Mis Solicitudes</h2>
          <p className="text-xs text-stone-500 mt-1">Revisar el estado de tus solicitudes previas.</p>
        </Link>
      </div>
    </div>
  );
}