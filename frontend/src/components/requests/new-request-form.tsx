"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import {
  ApiError,
  createEquipmentRequestDraft,
  getEquipmentRequestFormOptions,
  submitEquipmentRequest,
  type EquipmentRequestFormOptions,
} from "@/lib/api/client";

type RequestedItem = { id: string; name: string; quantity: number };

export function NewRequestForm() {
  const identity = useDashboardIdentity();
  const router = useRouter();
  const [options, setOptions] = useState<EquipmentRequestFormOptions | null>(null);
  const [courseSectionId, setCourseSectionId] = useState("");
  const [laboratoryId, setLaboratoryId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [purpose, setPurpose] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<RequestedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (identity.status !== "authenticated") return;
    if (!identity.user.roles.includes("TEACHER")) {
      return;
    }

    void getEquipmentRequestFormOptions(identity.accessToken)
      .then(setOptions)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el formulario."))
      .finally(() => setLoading(false));
  }, [identity]);

  function addItem() {
    const item = options?.inventory_items.find((candidate) => candidate.id === itemId);
    if (!item || quantity <= 0) return;
    if (items.some((requested) => requested.id === item.id)) {
      setError("Ese ítem ya fue agregado. Ajusta la cantidad desde la lista.");
      return;
    }
    setItems((current) => [...current, { id: item.id, name: item.name, quantity }]);
    setItemId("");
    setQuantity(1);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (identity.status !== "authenticated") return;
    if (items.length === 0) {
      setError("Agrega al menos un ítem a la solicitud.");
      return;
    }
    if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) {
      setError("La fecha de finalización debe ser posterior a la fecha de inicio.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const draft = await createEquipmentRequestDraft(identity.accessToken, {
        course_section_id: courseSectionId,
        laboratory_id: laboratoryId,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        purpose,
        items: items.map((item) => ({ inventory_item_id: item.id, requested_quantity: item.quantity })),
      });
      await submitEquipmentRequest(identity.accessToken, draft.id);
      router.push("/dashboard/requests");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof ApiError ? submissionError.message : "No fue posible enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  if (identity.status === "loading" || loading) {
    return <p className="text-sm text-stone-600">Cargando opciones…</p>;
  }
  if (identity.status === "unavailable") {
    return <p className="text-sm text-red-700">{identity.message}</p>;
  }
  if (!identity.user.roles.includes("TEACHER")) {
    return <p className="text-sm text-red-700">Solo los docentes pueden crear solicitudes.</p>;
  }

  return (
    <form className="space-y-5 text-sm" onSubmit={handleSubmit}>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Curso y paralelo
          <select required value={courseSectionId} onChange={(event) => setCourseSectionId(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 normal-case tracking-normal focus:border-amber-600 focus:outline-none">
            <option value="">Selecciona un curso</option>
            {options?.course_sections.map((course) => <option key={course.id} value={course.id}>{course.semester ? `${course.semester} · ` : ""}Paralelo {course.section}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Laboratorio
          <select required value={laboratoryId} onChange={(event) => setLaboratoryId(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white p-2.5 normal-case tracking-normal focus:border-amber-600 focus:outline-none">
            <option value="">Selecciona un laboratorio</option>
            {options?.laboratories.map((laboratory) => <option key={laboratory.id} value={laboratory.id}>{laboratory.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Inicio
          <input required type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 normal-case tracking-normal focus:border-amber-600 focus:outline-none" />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Finalización
          <input required type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 normal-case tracking-normal focus:border-amber-600 focus:outline-none" />
        </label>
      </div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
        Práctica u observaciones
        <textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-stone-300 p-2.5 normal-case tracking-normal focus:border-amber-600 focus:outline-none" placeholder="Ej.: Práctica de pastelería" />
      </label>
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-700">Ítems solicitados</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select value={itemId} onChange={(event) => setItemId(event.target.value)} className="flex-1 rounded-lg border border-stone-300 bg-white p-2 text-xs focus:border-amber-600 focus:outline-none">
            <option value="">Selecciona un equipo o insumo</option>
            {options?.inventory_items.map((item) => <option key={item.id} value={item.id}>{item.name}{item.code ? ` (${item.code})` : ""}</option>)}
          </select>
          <input min={1} type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} className="w-24 rounded-lg border border-stone-300 p-2 text-center text-xs focus:border-amber-600 focus:outline-none" />
          <button type="button" onClick={addItem} className="rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-900">Añadir</button>
        </div>
        {items.length ? <ul className="mt-3 divide-y divide-stone-200 border-t border-stone-200 pt-2">{items.map((item) => <li className="flex items-center justify-between py-2 text-xs" key={item.id}><span><strong>{item.quantity}×</strong> {item.name}</span><button className="font-semibold text-red-600 hover:text-red-800" onClick={() => setItems((current) => current.filter((requested) => requested.id !== item.id))} type="button">Quitar</button></li>)}</ul> : null}
      </div>
      <button className="w-full rounded-xl bg-amber-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-50" disabled={submitting || !options?.course_sections.length || !options.laboratories.length} type="submit">
        {submitting ? "Enviando solicitud…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
