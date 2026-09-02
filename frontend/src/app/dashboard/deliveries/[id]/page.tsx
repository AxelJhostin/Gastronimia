"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  deliverEquipmentRequest,
  generateEquipmentDeliveryQr,
  getEquipmentPreparationContext,
  getInventoryStock,
  recordOutboundInspection,
  type EquipmentDeliveryQr,
  type EquipmentInspection,
  type EquipmentLoan,
  type EquipmentPreparationContext,
  type InventoryStock,
  type InventoryUnitCondition,
} from "@/lib/api/client";

type AllocationState = Record<string, Record<string, string>>;
type ConditionState = Record<string, InventoryUnitCondition>;

const CONDITION_OPTIONS: Array<{
  value: InventoryUnitCondition;
  label: string;
}> = [
  { value: "NEW", label: "Nuevo" },
  { value: "GOOD", label: "Bueno" },
  { value: "FAIR", label: "Regular" },
  { value: "DAMAGED", label: "Dañado" },
];

function initializeConditions(context: EquipmentPreparationContext): ConditionState {
  return Object.fromEntries(
    context.items.flatMap((item) =>
      item.prepared_units.map((unit) => [unit.id, unit.condition ?? "GOOD"]),
    ),
  );
}

function initializeAllocations(
  context: EquipmentPreparationContext,
  stock: InventoryStock[],
): AllocationState {
  return Object.fromEntries(
    context.items
      .filter((item) => item.tracking_mode === "QUANTITY")
      .map((item) => {
        let remaining = Number(item.reserved_quantity);
        const locations: Record<string, string> = {};

        stock
          .filter(
            (row) =>
              row.inventory_item_id === item.inventory_item_id &&
              Number(row.quantity) > 0,
          )
          .forEach((row) => {
            const allocated = Math.min(remaining, Number(row.quantity));
            locations[row.location_id] = allocated > 0 ? String(allocated) : "";
            remaining -= allocated;
          });

        return [item.equipment_reservation_detail_id, locations];
      }),
  );
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function DeliveryDetailPage() {
  const params = useParams();
  const identity = useDashboardIdentity();
  const requestId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [context, setContext] = useState<EquipmentPreparationContext | null>(null);
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [inspection, setInspection] = useState<EquipmentInspection | null>(null);
  const [qr, setQr] = useState<EquipmentDeliveryQr | null>(null);
  const [loan, setLoan] = useState<EquipmentLoan | null>(null);
  const [conditions, setConditions] = useState<ConditionState>({});
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [collectedByName, setCollectedByName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const isAuthenticated = identity.status === "authenticated";
  const accessToken = isAuthenticated ? identity.accessToken : null;
  const hasAccess =
    isAuthenticated &&
    identity.user.roles.some((role) => role === "ADMIN" || role === "MANAGER");

  useEffect(() => {
    if (!hasAccess || !accessToken || !requestId) return;

    void Promise.all([
      getEquipmentPreparationContext(accessToken, requestId),
      getInventoryStock(accessToken),
    ])
      .then(([nextContext, nextStock]) => {
        setContext(nextContext);
        setStock(nextStock);
        setInspection(nextContext.outbound_inspection);
        setConditions(initializeConditions(nextContext));
        setAllocations(initializeAllocations(nextContext, nextStock));
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar el contexto de la entrega.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, accessToken, requestId]);

  useEffect(() => {
    if (!qr) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [qr]);

  const secondsRemaining = qr
    ? Math.max(0, Math.floor((new Date(qr.expires_at).getTime() - now) / 1000))
    : 0;

  const allocationRows = useMemo(() => {
    if (!context) return [];
    return context.items
      .filter((item) => item.tracking_mode === "QUANTITY")
      .map((item) => ({
        item,
        locations: stock.filter(
          (row) =>
            row.inventory_item_id === item.inventory_item_id && Number(row.quantity) > 0,
        ),
      }));
  }, [context, stock]);

  const handleInspection = async () => {
    if (!accessToken || !requestId || !context) return;

    const unitItems = context.items.flatMap((item) => item.prepared_units);
    if (
      context.items.some(
        (item) =>
          item.tracking_mode === "INDIVIDUAL" &&
          item.prepared_units.length !== Number(item.reserved_quantity),
      )
    ) {
      setError("La preparación no contiene todas las unidades identificadas reservadas.");
      return;
    }
    if (unitItems.some((unit) => conditions[unit.id] === "DAMAGED")) {
      setError("No puedes entregar una unidad marcada como dañada.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await recordOutboundInspection(accessToken, requestId, {
        notes: inspectionNotes.trim() || undefined,
        items: unitItems.map((unit) => ({
          inventory_unit_id: unit.id,
          observed_condition: conditions[unit.id] ?? "GOOD",
          is_complete: true,
        })),
      });
      setInspection(result);
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible registrar la inspección de salida.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!accessToken || !requestId || !inspection) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await generateEquipmentDeliveryQr(accessToken, requestId);
      setQr(result);
      setNow(Date.now());
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible generar el token temporal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelivery = async () => {
    if (!accessToken || !context || !qr || secondsRemaining <= 0) return;
    if (!collectedByName.trim()) {
      setError("Ingresa el nombre de la persona que retira los recursos.");
      return;
    }

    const quantityLocations = allocationRows.flatMap(({ item, locations }) =>
      locations
        .map((location) => ({
          equipment_reservation_detail_id: item.equipment_reservation_detail_id,
          location_id: location.location_id,
          loaned_quantity: Number(
            allocations[item.equipment_reservation_detail_id]?.[location.location_id] ?? 0,
          ),
        }))
        .filter((row) => row.loaned_quantity > 0),
    );

    const hasInvalidAllocation = allocationRows.some(({ item }) => {
      const values = Object.values(
        allocations[item.equipment_reservation_detail_id] ?? {},
      ).map(Number);
      const total = values.reduce((sum, value) => sum + value, 0);
      return (
        values.some((value) => !Number.isFinite(value) || value < 0) ||
        Math.abs(total - Number(item.reserved_quantity)) > 0.0001
      );
    });
    if (hasInvalidAllocation) {
      setError("Distribuye exactamente la cantidad preparada entre las ubicaciones disponibles.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await deliverEquipmentRequest(accessToken, {
        qr_token: qr.token,
        collected_by_name: collectedByName.trim(),
        quantity_locations: quantityLocations,
      });
      setLoan(result);
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible confirmar la entrega.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Cargando entrega…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;
  if (loading) return <p className="p-6 text-sm text-stone-600">Cargando entrega…</p>;
  if (error && !context) {
    return <main className="p-6"><div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></main>;
  }
  if (!context) return null;
  if (context.request.status !== "PREPARED" && !loan) {
    return <GastronomyStatusPage kind="not-found" />;
  }

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-5xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Entrega controlada</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Entregar solicitud #{context.request.id.slice(0, 8)}</h1>
            <p className="mt-1 text-sm text-stone-600">Completa la inspección, genera el token y confirma el retiro.</p>
          </div>
          <Link className="text-xs font-semibold text-stone-600 underline hover:text-amber-800" href="/dashboard/deliveries">Volver a entregas</Link>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        {loan ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Entrega registrada</p>
            <h2 className="mt-1 text-xl font-bold text-emerald-950">Préstamo #{loan.id.slice(0, 8)} activo</h2>
            <p className="mt-2 text-sm text-emerald-800">Los recursos fueron entregados a {loan.collected_by_name}.</p>
            <Link className="mt-4 inline-block text-sm font-semibold text-emerald-900 underline" href={`/dashboard/returns/${loan.id}`}>Abrir devolución</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-stone-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase text-amber-700">Paso 1</p><h2 className="text-lg font-bold">Inspección de salida</h2></div>
                {inspection ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Registrada</span> : null}
              </div>
              <div className="mt-4 space-y-4">
                {context.items.map((item) => (
                  <article className="rounded-xl bg-stone-50 p-4" key={item.equipment_reservation_detail_id}>
                    <p className="font-semibold">{item.inventory_item_name}</p>
                    <p className="text-xs text-stone-500">Preparado: {item.reserved_quantity} {item.unit_of_measure}</p>
                    {item.prepared_units.map((unit) => (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_220px] sm:items-center" key={unit.id}>
                        <span className="text-sm">{unit.asset_tag}{unit.serial_number ? ` · S/N ${unit.serial_number}` : ""}</span>
                        <label className="text-xs font-semibold text-stone-600">Condición observada
                          <select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" disabled={Boolean(inspection)} value={conditions[unit.id] ?? "GOOD"} onChange={(event) => setConditions((current) => ({ ...current, [unit.id]: event.target.value as InventoryUnitCondition }))}>
                            {CONDITION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        </label>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
              {!inspection ? <label className="mt-4 block text-sm font-medium text-stone-700">Notas de inspección
                <textarea className="mt-1 min-h-20 w-full rounded-lg border border-stone-300 px-3 py-2" value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} />
              </label> : null}
              {!inspection ? <button className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={submitting} onClick={() => void handleInspection()} type="button">{submitting ? "Registrando…" : "Registrar inspección de salida"}</button> : null}
            </section>

            <section className={`rounded-2xl border p-5 ${inspection ? "border-stone-200" : "border-stone-100 bg-stone-50 opacity-60"}`}>
              <div><p className="text-xs font-bold uppercase text-amber-700">Paso 2</p><h2 className="text-lg font-bold">Token temporal de retiro</h2></div>
              {qr ? <div className="mt-4 rounded-xl bg-slate-950 p-5 text-center text-white"><p className="text-xs uppercase tracking-widest text-slate-400">Código de entrega</p><p className="mt-2 break-all font-mono text-2xl font-bold tracking-wider">{qr.token}</p><p className={`mt-2 text-sm ${secondsRemaining > 0 ? "text-emerald-300" : "text-red-300"}`}>{secondsRemaining > 0 ? `Vence en ${formatCountdown(secondsRemaining)}` : "Token vencido"}</p></div> : null}
              <button className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={!inspection || submitting} onClick={() => void handleGenerateQr()} type="button">{qr ? "Regenerar token" : "Generar token temporal"}</button>
            </section>

            <section className={`rounded-2xl border p-5 ${qr && secondsRemaining > 0 ? "border-stone-200" : "border-stone-100 bg-stone-50 opacity-60"}`}>
              <div><p className="text-xs font-bold uppercase text-amber-700">Paso 3</p><h2 className="text-lg font-bold">Confirmar entrega</h2></div>
              <label className="mt-4 block max-w-lg text-sm font-medium text-stone-700">Nombre de quien retira
                <input className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" disabled={!qr || secondsRemaining <= 0} value={collectedByName} onChange={(event) => setCollectedByName(event.target.value)} />
              </label>
              {allocationRows.map(({ item, locations }) => (
                <fieldset className="mt-5 rounded-xl bg-stone-50 p-4" key={item.equipment_reservation_detail_id}>
                  <legend className="px-1 text-sm font-bold">{item.inventory_item_name} · total {item.reserved_quantity}</legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {locations.map((location) => <label className="text-xs font-semibold text-stone-600" key={location.location_id}>{location.location_name} · disponible {location.quantity}
                      <input className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" disabled={!qr || secondsRemaining <= 0} min="0" max={location.quantity} step="0.001" type="number" value={allocations[item.equipment_reservation_detail_id]?.[location.location_id] ?? ""} onChange={(event) => setAllocations((current) => ({ ...current, [item.equipment_reservation_detail_id]: { ...current[item.equipment_reservation_detail_id], [location.location_id]: event.target.value } }))} />
                    </label>)}
                    {locations.length === 0 ? <p className="text-sm text-red-700">No hay stock ubicado disponible para este ítem.</p> : null}
                  </div>
                </fieldset>
              ))}
              <button className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!qr || secondsRemaining <= 0 || submitting} onClick={() => void handleDelivery()} type="button">{submitting ? "Confirmando…" : "Confirmar entrega"}</button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
