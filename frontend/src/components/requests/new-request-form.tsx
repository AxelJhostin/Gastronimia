"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, LoaderCircle, Plus, Send, Trash2, Utensils } from "lucide-react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  createEquipmentRequestDraft,
  getInventoryAvailability,
  getEquipmentRequestFormOptions,
  submitEquipmentRequest,
  type InventoryAvailability,
  type EquipmentRequestFormOptions,
} from "@/lib/api/client";

type RequestItemInput = {
  inventoryItemId: string;
  quantity: string;
};

const initialItems: RequestItemInput[] = [{ inventoryItemId: "", quantity: "1" }];

function formatCourseSection(section: EquipmentRequestFormOptions["course_sections"][number]) {
  return [section.section, section.semester ? `Semestre ${section.semester}` : null]
    .filter(Boolean)
    .join(" · ");
}

export function NewRequestForm() {
  const router = useRouter();
  const identity = useDashboardIdentity();
  const [options, setOptions] = useState<EquipmentRequestFormOptions | null>(null);
  const [courseSectionId, setCourseSectionId] = useState("");
  const [laboratoryId, setLaboratoryId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState<RequestItemInput[]>(initialItems);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState<Record<string, InventoryAvailability>>({});
  const [error, setError] = useState<string | null>(null);

  const isTeacher =
    identity.status === "authenticated" && identity.user.roles.includes("TEACHER");
  const accessToken = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!isTeacher || !accessToken) {
      return;
    }

    let active = true;

    void getEquipmentRequestFormOptions(accessToken)
      .then((nextOptions) => {
        if (active) setOptions(nextOptions);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar los datos para la solicitud.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOptions(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, isTeacher]);

  const updateItem = (index: number, changes: Partial<RequestItemInput>) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    );
  };

  const selectedItemIds = items.map((item) => item.inventoryItemId).filter(Boolean);
  const isReady =
    options !== null &&
    options.course_sections.length > 0 &&
    options.laboratories.length > 0 &&
    options.inventory_items.length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || !isReady) return;

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    const requestedItems = items.map((item) => ({
      inventory_item_id: item.inventoryItemId,
      requested_quantity: Number(item.quantity),
    }));

    if (
      !courseSectionId ||
      !laboratoryId ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate ||
      requestedItems.some(
        (item) => !item.inventory_item_id || !Number.isFinite(item.requested_quantity) || item.requested_quantity <= 0,
      ) ||
      new Set(selectedItemIds).size !== selectedItemIds.length
    ) {
      setError("Revisa la fecha, las cantidades y los artículos seleccionados.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const draft = await createEquipmentRequestDraft(accessToken, {
        course_section_id: courseSectionId,
        laboratory_id: laboratoryId,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        purpose: purpose.trim(),
        items: requestedItems,
      });
      await submitEquipmentRequest(accessToken, draft.id);
      router.push(`/dashboard/requests/${draft.id}`);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible enviar la solicitud.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!accessToken || !startAt || !endAt || selectedItemIds.length === 0) {
      setError("Selecciona el horario y al menos un artículo para consultar disponibilidad.");
      return;
    }
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (endDate <= startDate) {
      setError("La fecha de fin debe ser posterior al inicio.");
      return;
    }

    setCheckingAvailability(true);
    setError(null);
    try {
      const results = await Promise.all(
        selectedItemIds.map(async (inventoryItemId) => [
          inventoryItemId,
          await getInventoryAvailability(accessToken, {
            inventory_item_id: inventoryItemId,
            start_at: startDate.toISOString(),
            end_at: endDate.toISOString(),
          }),
        ] as const),
      );
      setAvailability(Object.fromEntries(results));
    } catch (availabilityError: unknown) {
      setError(
        availabilityError instanceof Error
          ? availabilityError.message
          : "No fue posible consultar la disponibilidad.",
      );
    } finally {
      setCheckingAvailability(false);
    }
  };

  if (identity.status === "loading") {
    return <p className="p-6 text-sm text-stone-600">Verificando permisos…</p>;
  }

  if (identity.status === "unavailable") {
    return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  }

  if (!isTeacher) {
    return <GastronomyStatusPage kind="forbidden" />;
  }

  return (
    <form
      className="max-w-4xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">Nueva solicitud</h2>
        <p className="text-xs text-slate-500">
          Selecciona tu sección, laboratorio, horario y los recursos requeridos.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loadingOptions ? (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <LoaderCircle className="size-4 animate-spin" /> Cargando opciones…
        </div>
      ) : null}

      {!loadingOptions && !isReady ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Aún no hay suficientes datos configurados para crear una solicitud. Un administrador debe asignarte una sección y registrar al menos un laboratorio y un artículo activo.
        </div>
      ) : null}

      <fieldset className="space-y-6" disabled={loadingOptions || !isReady || submitting}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1 flex items-center gap-1"><Utensils className="size-4" /> Sección</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5"
              onChange={(event) => setCourseSectionId(event.target.value)}
              required
              value={courseSectionId}
            >
              <option value="">Selecciona una sección</option>
              {options?.course_sections.map((section) => (
                <option key={section.id} value={section.id}>{formatCourseSection(section)}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1 flex items-center gap-1"><Utensils className="size-4" /> Laboratorio</span>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5"
              onChange={(event) => setLaboratoryId(event.target.value)}
              required
              value={laboratoryId}
            >
              <option value="">Selecciona un laboratorio</option>
              {options?.laboratories.map((laboratory) => (
                <option key={laboratory.id} value={laboratory.id}>{laboratory.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1 flex items-center gap-1"><Calendar className="size-4" /> Inicio</span>
            <input
              className="w-full rounded-lg border border-slate-300 p-2.5"
              onChange={(event) => setStartAt(event.target.value)}
              required
              type="datetime-local"
              value={startAt}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1 flex items-center gap-1"><Calendar className="size-4" /> Fin</span>
            <input
              className="w-full rounded-lg border border-slate-300 p-2.5"
              min={startAt || undefined}
              onChange={(event) => setEndAt(event.target.value)}
              required
              type="datetime-local"
              value={endAt}
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Propósito de la práctica
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 p-2.5"
            maxLength={1000}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Ej.: práctica de panadería artesanal"
            rows={3}
            value={purpose}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Artículos solicitados</h3>
            <button
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              onClick={() => setItems((currentItems) => [...currentItems, { inventoryItemId: "", quantity: "1" }])}
              type="button"
            >
              <Plus className="size-4" /> Agregar artículo
            </button>
          </div>

          {items.map((item, index) => {
            const selectedItem = options?.inventory_items.find((candidate) => candidate.id === item.inventoryItemId);
            return (
              <div className="grid grid-cols-[1fr_7rem_auto] items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" key={index}>
                <label className="block text-sm font-medium text-slate-700">
                  Artículo
                  <select
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"
                    onChange={(event) => updateItem(index, { inventoryItemId: event.target.value })}
                    required
                    value={item.inventoryItemId}
                  >
                    <option value="">Selecciona un artículo</option>
                    {options?.inventory_items.map((candidate) => (
                      <option
                        disabled={candidate.id !== item.inventoryItemId && selectedItemIds.includes(candidate.id)}
                        key={candidate.id}
                        value={candidate.id}
                      >
                        {candidate.name}{candidate.code ? ` (${candidate.code})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Cantidad
                  <input
                    className="mt-1 w-full rounded-md border border-slate-300 p-2"
                    min={selectedItem?.tracking_mode === "INDIVIDUAL" ? "1" : "0.001"}
                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                    required
                    step={selectedItem?.tracking_mode === "INDIVIDUAL" ? "1" : "0.001"}
                    type="number"
                    value={item.quantity}
                  />
                </label>
                <button
                  aria-label={`Eliminar artículo ${index + 1}`}
                  className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={items.length === 1}
                  onClick={() => setItems((currentItems) => currentItems.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
                {selectedItem ? <p className="col-span-2 text-xs text-slate-500">Unidad: {selectedItem.unit_of_measure} · {selectedItem.tracking_mode === "INDIVIDUAL" ? "equipo individual" : "control por cantidad"}</p> : null}
                {selectedItem && availability[selectedItem.id] ? <p className="col-span-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Disponibilidad preliminar: {selectedItem.tracking_mode === "INDIVIDUAL" ? availability[selectedItem.id].units_available : availability[selectedItem.id].quantity_available} {selectedItem.unit_of_measure}</p> : null}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
        <button className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-50" disabled={checkingAvailability || loadingOptions || !isReady} onClick={() => void handleCheckAvailability()} type="button">{checkingAvailability ? "Consultando…" : "Consultar disponibilidad"}</button>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          onClick={() => router.back()}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loadingOptions || !isReady || submitting}
          type="submit"
        >
          {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {submitting ? "Enviando…" : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
