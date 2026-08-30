"use client";

import { DispatchInspectionPanel, InventoryDispatchItem } from "@/components/inventory/dispatch-inspection-panel";

const MOCK_ITEMS: InventoryDispatchItem[] = [
  {
    id: "item-1",
    name: "Harina de Trigo 000",
    requestedQuantity: 5,
    availableStock: 20,
    unit: "kg",
    dispatchQuantity: 5,
    condition: "good",
  },
  {
    id: "item-2",
    name: "Cuchillo Chef 20cm",
    requestedQuantity: 2,
    availableStock: 2,
    unit: "unidades",
    dispatchQuantity: 2,
    condition: "good",
  },
];

export default function InventoryInspectionPage() {
  return (
    <div className="p-6">
      <DispatchInspectionPanel
        requestId="REQ-2026-004"
        teacherName="Prof. Carlos Mendoza"
        activityName="Taller de Panadería Artesanal"
        activityDate="2026-09-02"
        initialItems={MOCK_ITEMS}
        mode="dispatch"
      />
    </div>
  );
}