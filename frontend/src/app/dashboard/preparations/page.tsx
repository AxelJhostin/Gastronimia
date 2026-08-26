'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  RequestStatusBadge,
  type RequestStatus,
} from '@/components/domain/operations';
import { ToastRegion, type ToastMessage } from '@/components/ui/toast';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

export interface PreparationOrder {
  id: string;
  created_at: string;
  title: string;
  applicant_name: string;
  location: string;
  status: RequestStatus;
  items_summary: string;
}

export default function PreparationsPage() {
  const [orders, setOrders] = useState<PreparationOrder[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const showToast = (title: string, description?: string, tone: 'success' | 'error' | 'info' = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, description, tone }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cargar órdenes en preparación o listas para despacho
  const fetchPreparations = async () => {
    startTransition(async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .in('status', ['APPROVED', 'PREPARING', 'PREPARED'])
        .order('created_at', { ascending: true });

      if (error) {
        showToast('Error al cargar órdenes', error.message, 'error');
        return;
      }

      setOrders(data || []);
    });
  };

  useEffect(() => {
    fetchPreparations();
  }, []);

  // Cambiar el estado operacional de la preparación
  const handleStatusChange = async (id: string, newStatus: RequestStatus) => {
    const { error } = await supabase
      .from('requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      showToast('Error al actualizar estado', error.message, 'error');
      return;
    }

    showToast('Estado actualizado', `La orden cambió a ${newStatus}`, 'success');
    fetchPreparations();
  };

  const pendingOrders = orders.filter((o) => o.status === 'APPROVED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'PREPARED');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preparación y Pañol</h1>
          <p className="text-muted-foreground">
            Gestión del flujo de ensamblado y entrega de pedidos para cocinas y talleres.
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="py-12 text-center text-gastro-muted">Cargando tablero de preparación...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Columna 1: Pendientes de Armado */}
          <div className="rounded-xl border border-gastro-outline-variant bg-gastro-surface-low p-4">
            <h2 className="mb-4 font-semibold text-gastro-primary flex items-center justify-between">
              <span>Por Preparar</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gastro-muted border">
                {pendingOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <article key={order.id} className="rounded-lg border border-gastro-outline-variant bg-white p-4 shadow-gastro-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gastro-primary">{order.title}</h3>
                    <RequestStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-gastro-muted">Ubicación: {order.location}</p>
                  <p className="mt-2 text-sm text-gastro-muted line-clamp-2">{order.items_summary}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleStatusChange(order.id, 'PREPARING')}
                  >
                    Iniciar Armado
                  </Button>
                </article>
              ))}
            </div>
          </div>

          {/* Columna 2: En Proceso */}
          <div className="rounded-xl border border-gastro-outline-variant bg-gastro-surface-low p-4">
            <h2 className="mb-4 font-semibold text-gastro-primary flex items-center justify-between">
              <span>En Preparación</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gastro-muted border">
                {preparingOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <article key={order.id} className="rounded-lg border border-orange-200 bg-white p-4 shadow-gastro-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gastro-primary">{order.title}</h3>
                    <RequestStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-gastro-muted">Solicitante: {order.applicant_name}</p>
                  <p className="mt-2 text-sm text-gastro-muted line-clamp-2">{order.items_summary}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleStatusChange(order.id, 'PREPARED')}
                  >
                    Marcar como Listo
                  </Button>
                </article>
              ))}
            </div>
          </div>

          {/* Columna 3: Listos para Despacho */}
          <div className="rounded-xl border border-gastro-outline-variant bg-gastro-surface-low p-4">
            <h2 className="mb-4 font-semibold text-gastro-primary flex items-center justify-between">
              <span>Listos para Entrega</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gastro-muted border">
                {readyOrders.length}
              </span>
            </h2>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <article key={order.id} className="rounded-lg border border-emerald-200 bg-white p-4 shadow-gastro-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gastro-primary">{order.title}</h3>
                    <RequestStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-gastro-muted">Ubicación: {order.location}</p>
                  <p className="mt-2 text-sm text-gastro-muted line-clamp-2">{order.items_summary}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                  >
                    Confirmar Entrega
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Región Visual de Toasts */}
      <ToastRegion messages={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}