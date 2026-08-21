import { Sidebar } from '@/components/layout/Sidebar';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-50">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Panel de Control</h1>
        <p className="text-slate-600 mb-6">Selecciona un módulo para comenzar la gestión.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/academia" 
            className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Módulo Academia</h2>
            <p className="text-slate-500 text-sm">Administración de asignaturas, profesores y grupos.</p>
          </Link>
          
          <div className="p-6 bg-slate-100 border border-slate-200 rounded-lg opacity-60">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Módulo Inventario</h2>
            <p className="text-slate-500 text-sm">Próximamente: Catálogo de insumos y recursos.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
