"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  DispatchInspectionPanel, 
  InventoryDispatchItem 
} from "@/components/inventory/dispatch-inspection-panel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Datos de prueba para simular la respuesta del backend
const MOCK_DISPATCH_ITEMS: InventoryDispatchItem[] = [
  {
    id: "item-101",
    name: "Harina de Trigo 000",
    requestedQuantity: 5,
    availableStock: 20,
    unit: "kg",
    dispatchQuantity: 5,
    condition: "good",
  },
  {
    id: "item-102",
    name: "Mantequilla sin sal",
    requestedQuantity: 2,
    availableStock: 1.5,
    unit: "kg",
    dispatchQuantity: 1.5,
    condition: "good",
  },
  {
    id: "item-103",
    name: "Cuchillo Chef 20cm",
    requestedQuantity: 3,
    availableStock: 5,
    unit: "unidades",
    dispatchQuantity: 3,
    condition: "good",
  },
];

export default function InventoryDispatchPage() {
  const params = useParams();
  const requestId = (params?.id as string) || "REQ-000";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/inventory"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Despacho de Materiales
          </h1>
          <p className="text-xs text-slate-500">
            Verificación de stock e insumos previa a la entrega al docente.
          </p>
        </div>
      </div>

      <DispatchInspectionPanel
        requestId={requestId}
        teacherName="Prof. Carlos Mendoza"
        activityName="Taller de Pastelería Básica"
        activityDate="2026-09-05"
        initialItems={MOCK_DISPATCH_ITEMS}
        mode="dispatch"
      />
    </div>
  );
}