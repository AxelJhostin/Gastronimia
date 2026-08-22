import { apiFetch } from './http';

export interface UnitOfMeasure {
  id?: string;
  code: string;
  name: string;
}

export interface InventoryItem {
  id?: string;
  sku: string;
  name: string;
  type: 'QUANTITY' | 'INDIVIDUAL';
  unit_id?: string;
  min_stock?: number;
  current_stock?: number;
  is_active?: boolean;
}

export interface IndividualAsset {
  id?: string;
  item_id: string;
  asset_tag: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DISCARDED';
}

export interface InventoryMovement {
  id: string;
  item_id: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  created_at: string;
}

export const inventoryApi = {
  // Unidades de Medida
  getUnits: () => apiFetch<UnitOfMeasure[]>('/inventory/units'),
  createUnit: (data: UnitOfMeasure) =>
    apiFetch<UnitOfMeasure>('/inventory/units', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Artículos de Inventario
  getItems: () => apiFetch<InventoryItem[]>('/inventory/items'),
  createItem: (data: InventoryItem) =>
    apiFetch<InventoryItem>('/inventory/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Activos Individuales
  getAssets: (itemId: string) => apiFetch<IndividualAsset[]>(`/inventory/items/${itemId}/assets`),
  createAsset: (itemId: string, data: Partial<IndividualAsset>) =>
    apiFetch<IndividualAsset>(`/inventory/items/${itemId}/assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Kardex / Movimientos
  getMovements: (itemId?: string) =>
    apiFetch<InventoryMovement[]>(`/inventory/movements${itemId ? `?item_id=${itemId}` : ''}`),
};