"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  completeEquipmentPreparation,
  getEquipmentPreparationContext,
  recordEquipmentPreparation,
  startEquipmentPreparation,
  type EquipmentPreparationContext,
} from "@/lib/api/client";

function initializeQuantities(context: EquipmentPreparationContext) {
  return Object.fromEntries(
    context.items
      .filter((item) => item.tracking_mode === "QUANTITY")
      .map((item) => [item.equipment_reservation_detail_id, String(item.reserved_quantity)]),
  );
}

export default function PreparationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const identity = useDashboardIdentity();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [context, setContext] = useState<EquipmentPreparationContext | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selectedUnitIds, setSelectedUnitIds] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !requestId) return;

    void getEquipmentPreparationContext(accessToken, requestId)
      .then((nextContext) => {
        setContext(nextContext);
        setQuantities(initializeQuantities(nextContext));
        setSelectedUnitIds({});
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible obtener los recursos a preparar.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken, requestId]);

  const handleStartPreparation = async () => {
    if (!accessToken || !requestId) return;

    setSubmitting(true);
    setError(null);
    try {
      await startEquipmentPreparation(accessToken, requestId);
      const nextContext = await getEquipmentPreparationContext(accessToken, requestId);
      setContext(nextContext);
      setQuantities(initializeQuantities(nextContext));
      setSelectedUnitIds({});
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible iniciar la preparación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUnit = (reservationDetailId: string, unitId: string, maximum: number) => {
    setSelectedUnitIds((current) => {
      const selected = current[reservationDetailId] ?? [];
      const isSelected = selected.includes(unitId);
      if (!isSelected && selected.length >= maximum) return current;

      return {
        ...current,
        [reservationDetailId]: isSelected
          ? selected.filter((id) => id !== unitId)
          : [...selected, unitId],
      };
    });
  };

  const handleRecordAndComplete = async () => {
    if (!accessToken || !requestId || !context) return;

    const items = context.items.map((item) => {
      if (item.tracking_mode === "INDIVIDUAL") {
        const inventoryUnitIds = selectedUnitIds[item.equipment_reservation_detail_id] ?? [];
        return {
          equipment_reservation_detail_id: item.equipment_reservation_detail_id,
          prepared_quantity: inventoryUnitIds.length,
          inventory_unit_ids: inventoryUnitIds,
        };
      }

      return {
        equipment_reservation_detail_id: item.equipment_reservation_detail_id,
        prepared_quantity: Number(quantities[item.equipment_reservation_detail_id]),
      };
    });

    const hasInvalidItem = context.items.some((item, index) => {
      const expected = Number(item.reserved_quantity);
      const prepared = items[index].prepared_quantity;
      return !Number.isFinite(prepared) || prepared <= 0 || Math.abs(prepared - expected) > 0.0001;
    });
    if (hasInvalidItem) {
      setError(
        "Debes preparar exactamente la cantidad reservada de cada ítem antes de finalizar.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await recordEquipmentPreparation(accessToken, requestId, items);
      await completeEquipmentPreparation(accessToken, requestId);
      router.push("/dashboard/requests/" + requestId);
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible registrar y finalizar la preparación.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando preparación…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!hasAccess) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  if (loading) {
    return <p className="p-6 text-sm text-stone-600">Cargando preparación…</p>;
  }

  if (error && !context) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!context) return null;

  const isPreparing = context.request.status === "PREPARING";
  const canStart = ["APPROVED", "PARTIALLY_APPROVED"].includes(context.request.status);

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-4xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Despacho de pañol
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Preparar solicitud #{context.request.id.slice(0, 8)}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Selecciona las unidades identificadas y confirma las cantidades reservadas.
            </p>
          </div>
          <Link
            href={"/dashboard/requests/" + requestId}
            className="text-xs font-semibold text-stone-600 underline hover:text-amber-800"
          >
            Ver solicitud
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="block font-semibold text-stone-500">Estado</span>
            <span className="font-medium text-stone-900">{context.request.status}</span>
          </div>
          <div>
            <span className="block font-semibold text-stone-500">Propósito</span>
            <span className="font-medium text-stone-900">
              {context.request.purpose ?? "Sin especificar"}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-stone-500">Inicio de reserva</span>
            <span className="font-medium text-stone-900">
              {new Date(context.request.start_at).toLocaleString("es-EC")}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-stone-500">Fin de reserva</span>
            <span className="font-medium text-stone-900">
              {new Date(context.request.end_at).toLocaleString("es-EC")}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800">
            Ítems reservados
          </h2>
          {context.items.map((item) => {
            const selected = selectedUnitIds[item.equipment_reservation_detail_id] ?? [];
            const reserved = Number(item.reserved_quantity);

            return (
              <article
                key={item.equipment_reservation_detail_id}
                className="rounded-xl border border-stone-200 p-4"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-semibold text-stone-900">{item.inventory_item_name}</p>
                    <p className="text-xs text-stone-500">
                      {item.inventory_item_code ?? "Sin código"} · Reservado: {item.reserved_quantity}{" "}
                      {item.unit_of_measure}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                    {item.tracking_mode === "INDIVIDUAL" ? "Por unidad" : "Por cantidad"}
                  </span>
                </div>

                {isPreparing && item.tracking_mode === "QUANTITY" && (
                  <label className="mt-4 block max-w-xs text-sm font-medium text-stone-700">
                    Cantidad preparada
                    <input
                      type="number"
                      min="0.001"
                      max={item.reserved_quantity}
                      step="0.001"
                      value={quantities[item.equipment_reservation_detail_id] ?? ""}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [item.equipment_reservation_detail_id]: event.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900"
                    />
                  </label>
                )}

                {isPreparing && item.tracking_mode === "INDIVIDUAL" && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-stone-700">
                      Unidades seleccionadas: {selected.length} de {item.reserved_quantity}
                    </p>
                    {item.available_units.length === 0 ? (
                      <p className="mt-2 text-sm text-red-700">
                        No hay unidades disponibles para este ítem.
                      </p>
                    ) : (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {item.available_units.map((unit) => (
                          <label
                            key={unit.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 p-3 text-sm hover:bg-stone-50"
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(unit.id)}
                              onChange={() =>
                                toggleUnit(item.equipment_reservation_detail_id, unit.id, reserved)
                              }
                            />
                            <span>
                              <span className="block font-medium text-stone-900">{unit.asset_tag}</span>
                              {unit.serial_number && (
                                <span className="block text-xs text-stone-500">
                                  Serie: {unit.serial_number}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-6">
          {canStart && (
            <button
              type="button"
              onClick={handleStartPreparation}
              disabled={submitting}
              className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-900 disabled:opacity-50"
            >
              {submitting ? "Iniciando…" : "Iniciar preparación"}
            </button>
          )}
          {isPreparing && (
            <button
              type="button"
              onClick={handleRecordAndComplete}
              disabled={submitting}
              className="rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-900 disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Registrar y finalizar preparación"}
            </button>
          )}
          {context.request.status === "PREPARED" && (
            <p className="text-sm font-medium text-emerald-700">La preparación ya fue finalizada.</p>
          )}
        </div>
      </section>
    </main>
  );
}
