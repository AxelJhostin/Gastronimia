import { getClientEnv } from "@/lib/env";

export type RoleCode = "ADMIN" | "MANAGER" | "TEACHER" | "PAÑOLERO";

export type CurrentUser = {
  id: string;
  email: string | null;
  roles: RoleCode[];
  must_change_password: boolean;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type CreateManagedUserInput = {
  email: string;
  full_name: string;
  roles: RoleCode[];
};

export type ProvisionedUser = {
  user_id: string;
  email: string;
  full_name: string;
  roles: RoleCode[];
  temporary_password: string;
};

export type EquipmentRequestStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "PARTIALLY_APPROVED"
  | "REJECTED"
  | "PREPARING"
  | "PREPARED"
  | "DELIVERED"
  | "CLOSED";

export type EquipmentRequest = {
  id: string;
  teacher_id: string;
  course_section_id: string;
  laboratory_id: string;
  start_at: string;
  end_at: string;
  purpose: string | null;
  status: EquipmentRequestStatus;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentRequestDetail = {
  request: EquipmentRequest;
  items: Array<{
    id: string;
    inventory_item_id: string;
    requested_quantity: number;
    inventory_item_name: string;
    inventory_item_code: string | null;
    unit_of_measure: string;
  }>;
};

export type CourseSection = {
  id: string;
  subject_id: string;
  teacher_id: string;
  academic_period_id: string;
  section: string;
  semester: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Laboratory = {
  id: string;
  code: string | null;
  name: string;
  location_description: string | null;
  is_active: boolean;
  created_at: string;
};

export type EquipmentRequestFormOptions = {
  course_sections: CourseSection[];
  laboratories: Laboratory[];
  inventory_items: InventoryItem[];
};

export type CreateEquipmentRequestDraftInput = {
  course_section_id: string;
  laboratory_id: string;
  start_at: string;
  end_at: string;
  purpose: string;
  items: Array<{ inventory_item_id: string; requested_quantity: number }>;
};

export type InventoryItem = {
  id: string;
  category_id: string;
  code: string | null;
  name: string;
  description: string | null;
  tracking_mode: "QUANTITY" | "INDIVIDUAL";
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryStock = {
  inventory_item_id: string;
  inventory_item_code: string | null;
  inventory_item_name: string;
  unit_of_measure: string;
  location_id: string;
  location_code: string | null;
  location_name: string;
  quantity: number;
  updated_at: string;
};

export type InventoryItemDetail = {
  item: InventoryItem;
  stock: InventoryStock[];
  units: Array<{ id: string; asset_tag: string; status: string; condition: string; is_active: boolean }>;
};

export type EquipmentLoan = {
  id: string;
  equipment_request_id: string;
  responsible_teacher_id: string;
  collected_by_name: string;
  delivered_by_user_id: string;
  delivered_at: string;
  created_at: string;
  status: string;
  closed_at: string | null;
  is_overdue: boolean;
};

export type EquipmentLoanPending = {
  loan: EquipmentLoan;
  quantity_details: Array<{
    equipment_loan_detail_id: string;
    inventory_item_id: string;
    location_id: string;
    loaned_quantity: number;
    returned_quantity: number;
    pending_quantity: number;
  }>;
  unit_ids_pending: string[];
};

export type EquipmentPreparationContext = {
  request: EquipmentRequest;
  items: Array<{
    equipment_reservation_detail_id: string;
    inventory_item_id: string;
    inventory_item_name: string;
    inventory_item_code: string | null;
    tracking_mode: "QUANTITY" | "INDIVIDUAL";
    unit_of_measure: string;
    reserved_quantity: number;
    available_units: Array<{ id: string; asset_tag: string; serial_number: string | null }>;
  }>;
};

export type OperationalReportRow = Record<string, unknown>;

export type OperationalAuditLog = {
  id: string;
  action: string;
  entity_table: string;
  entity_id: string;
  performed_by_user_id: string | null;
  recorded_at: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function requestApi<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: unknown;
    } | null;
    const message =
      typeof body?.detail === "string"
        ? body.detail
        : "No fue posible completar la operación.";
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();

  const formData = new URLSearchParams();
  formData.append("username", credentials.username);
  formData.append("password", credentials.password);

  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    const message = body?.detail || "Credenciales incorrectas o error en inicio de sesión.";
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function getApiHealth() {
  const { NEXT_PUBLIC_API_BASE_URL } = getClientEnv();
  const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/health`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("No fue posible verificar el estado de la API.");
  }

  return (await response.json()) as { status: string };
}

export function getCurrentUser(accessToken: string) {
  return requestApi<CurrentUser>("/auth/me", accessToken);
}

export function createManagedUser(
  accessToken: string,
  input: CreateManagedUserInput,
) {
  return requestApi<ProvisionedUser>("/admin/users", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function completeTemporaryPasswordChange(accessToken: string) {
  return requestApi<void>("/auth/password-change-complete", accessToken, {
    method: "POST",
  });
}

export function getOwnRequests(accessToken: string) {
  return requestApi<EquipmentRequest[]>("/requests/mine", accessToken);
}

export function getEquipmentRequestDetail(accessToken: string, requestId: string) {
  return requestApi<EquipmentRequestDetail>(`/requests/${requestId}`, accessToken);
}

export function getEquipmentRequestFormOptions(accessToken: string) {
  return requestApi<EquipmentRequestFormOptions>("/requests/form-options", accessToken);
}

export function createEquipmentRequestDraft(
  accessToken: string,
  input: CreateEquipmentRequestDraftInput,
) {
  return requestApi<EquipmentRequest>("/requests/drafts", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function submitEquipmentRequest(accessToken: string, requestId: string) {
  return requestApi<EquipmentRequest>(`/requests/${requestId}/submit`, accessToken, {
    method: "POST",
  });
}

export function getPendingRequests(accessToken: string) {
  return requestApi<EquipmentRequest[]>("/admin/requests/pending", accessToken);
}

export function approveEquipmentRequest(
  accessToken: string,
  requestId: string,
  items: Array<{ equipment_request_item_id: string; approved_quantity: number }>,
) {
  return requestApi<EquipmentRequest>(`/admin/requests/${requestId}/approve`, accessToken, {
    body: JSON.stringify({ items }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function rejectEquipmentRequest(
  accessToken: string,
  requestId: string,
  reason: string,
) {
  return requestApi<EquipmentRequest>(`/admin/requests/${requestId}/reject`, accessToken, {
    body: JSON.stringify({ reason }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getInventoryItems(accessToken: string) {
  return requestApi<InventoryItem[]>("/admin/inventory/items", accessToken);
}

export function getInventoryStock(accessToken: string) {
  return requestApi<InventoryStock[]>("/admin/inventory/stock", accessToken);
}

export function getInventoryItemDetail(accessToken: string, itemId: string) {
  return requestApi<InventoryItemDetail>(`/admin/inventory/items/${itemId}/detail`, accessToken);
}

export function getActiveLoans(accessToken: string) {
  return requestApi<EquipmentLoan[]>("/admin/returns/loans", accessToken);
}

export function getLoanPending(accessToken: string, loanId: string) {
  return requestApi<EquipmentLoanPending>(`/admin/returns/loans/${loanId}/pending`, accessToken);
}

export function recordEquipmentReturn(
  accessToken: string,
  loanId: string,
  input: { returned_by_name: string; quantity_details: Array<{ equipment_loan_detail_id: string; returned_quantity: number; location_id: string }>; loan_unit_ids: string[] },
) {
  return requestApi<void>(`/admin/returns/loans/${loanId}`, accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getOperationalReport(
  accessToken: string,
  report: "requests" | "loans" | "incidents" | "stock",
) {
  return requestApi<OperationalReportRow[]>(`/admin/reports/${report}`, accessToken);
}

export function startEquipmentPreparation(accessToken: string, requestId: string) {
  return requestApi<void>(`/admin/requests/${requestId}/preparation/start`, accessToken, {
    method: "POST",
  });
}

export function getEquipmentPreparationContext(accessToken: string, requestId: string) {
  return requestApi<EquipmentPreparationContext>(
    `/admin/requests/${requestId}/preparation`,
    accessToken,
  );
}

export function recordEquipmentPreparation(
  accessToken: string,
  requestId: string,
  items: Array<{
    equipment_reservation_detail_id: string;
    prepared_quantity: number;
    inventory_unit_ids?: string[];
  }>,
) {
  return requestApi<void>(`/admin/requests/${requestId}/preparation/items`, accessToken, {
    body: JSON.stringify({ items }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function completeEquipmentPreparation(accessToken: string, requestId: string) {
  return requestApi<void>(`/admin/requests/${requestId}/preparation/complete`, accessToken, {
    method: "POST",
  });
}

export function getOperationalAuditLogs(accessToken: string) {
  return requestApi<OperationalAuditLog[]>("/admin/audit", accessToken);
}
