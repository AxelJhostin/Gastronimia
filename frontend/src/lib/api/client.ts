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

export type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: RoleCode[];
};

export type AcademicPeriod = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type Subject = {
  id: string;
  code: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Teacher = {
  id: string;
  user_id: string;
  employee_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export type InventoryCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryLocation = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryUnit = {
  id: string;
  inventory_item_id: string;
  location_id: string | null;
  asset_tag: string;
  serial_number: string | null;
  status: "AVAILABLE" | "LOANED" | "MAINTENANCE" | "DISABLED";
  condition: InventoryUnitCondition;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryUnitHistory = {
  id: string;
  inventory_unit_id: string;
  event_type:
    | "CREATED"
    | "UPDATED"
    | "STATUS_CHANGED"
    | "CONDITION_CHANGED"
    | "LOCATION_CHANGED"
    | "DEACTIVATED"
    | "REACTIVATED";
  previous_status: InventoryUnit["status"] | null;
  current_status: InventoryUnit["status"];
  previous_condition: InventoryUnitCondition | null;
  current_condition: InventoryUnitCondition;
  previous_location_id: string | null;
  current_location_id: string | null;
  previous_is_active: boolean | null;
  current_is_active: boolean;
  recorded_at: string;
};

export type InventoryMovement = {
  id: string;
  inventory_item_id: string;
  location_id: string;
  movement_type: "INITIAL_STOCK" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  quantity: number;
  notes: string | null;
  occurred_at: string | null;
  balance_after: number;
  performed_by_user_id: string;
  created_at: string;
};

export type InventoryAvailability = {
  tracking_mode: "QUANTITY" | "INDIVIDUAL";
  quantity_available: number;
  units_available: number;
};

export type EquipmentMaintenance = {
  id: string;
  inventory_unit_id: string;
  maintenance_type: "PREVENTIVE" | "CORRECTIVE" | "INSPECTION";
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  reason: string;
  description: string | null;
  created_by_user_id: string;
  started_at: string;
  completed_by_user_id: string | null;
  completed_at: string | null;
  resolution: string | null;
};

export type EquipmentMaintenanceEvidence = {
  id: string;
  equipment_maintenance_id: string;
  storage_path: string;
  uploaded_by_user_id: string;
  created_at: string;
};

export type InventoryUnitCondition = "NEW" | "GOOD" | "FAIR" | "DAMAGED";

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
    inventory_item_name: string;
    inventory_item_code: string | null;
    unit_of_measure: string;
  }>;
  unit_ids_pending: string[];
  pending_units: Array<{
    equipment_loan_unit_id: string;
    inventory_unit_id: string;
    asset_tag: string;
    serial_number: string | null;
    condition: InventoryUnitCondition;
  }>;
};

export type EquipmentReturn = {
  id: string;
  equipment_loan_id: string;
  returned_by_name: string;
  received_by_user_id: string;
  returned_at: string;
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
    available_units: Array<{
      id: string;
      asset_tag: string;
      serial_number: string | null;
      condition: InventoryUnitCondition | null;
    }>;
    prepared_units: Array<{
      id: string;
      asset_tag: string;
      serial_number: string | null;
      condition: InventoryUnitCondition | null;
    }>;
  }>;
  outbound_inspection: EquipmentInspection | null;
};

export type EquipmentInspectionIncidentInput = {
  incident_type: IncidentType;
  severity: IncidentSeverity;
  description: string;
};

export type EquipmentInspectionInput = {
  notes?: string;
  items: Array<{
    inventory_unit_id: string;
    observed_condition: InventoryUnitCondition;
    is_complete: boolean;
    incidents?: EquipmentInspectionIncidentInput[];
  }>;
};

export type EquipmentInspection = {
  id: string;
  equipment_request_id: string;
  equipment_loan_id: string | null;
  equipment_return_id: string | null;
  stage: "OUTBOUND" | "RETURN";
  inspected_by_user_id: string;
  inspected_at: string;
  notes: string | null;
  incidents: Array<{
    id: string;
    inventory_unit_id: string;
    incident_type: IncidentType;
    severity: IncidentSeverity;
    description: string;
    requires_unavailable: boolean;
  }>;
};

export type EquipmentIncidentEvidence = {
  id: string;
  equipment_incident_id: string;
  storage_path: string;
  uploaded_by_user_id: string;
  created_at: string;
};

export type EquipmentDeliveryQr = {
  token: string;
  expires_at: string;
};

export type EquipmentDeliveryInput = {
  qr_token: string;
  collected_by_name: string;
  quantity_locations: Array<{
    equipment_reservation_detail_id: string;
    location_id: string;
    loaned_quantity: number;
  }>;
};

export type OperationalReportRow = Record<string, unknown>;

export type RequestOperationalReportRow = {
  id: string;
  teacher_id: string;
  course_section_id: string;
  laboratory_id: string;
  start_at: string;
  end_at: string;
  status: EquipmentRequestStatus;
  submitted_at: string | null;
  reservation_status: string | null;
  equipment_loan_id: string | null;
  loan_status: string | null;
};

export type IncidentType =
  | "DAMAGE"
  | "MISSING"
  | "BREAKAGE"
  | "DIRTINESS"
  | "INCOMPLETE"
  | "WEAR"
  | "FAILURE";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentOperationalReportRow = {
  id: string;
  equipment_request_id: string;
  equipment_loan_id: string | null;
  inventory_unit_id: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  requires_unavailable: boolean;
  description: string;
  created_at: string;
  evidence_count: number;
};

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

export function getManagedUsers(accessToken: string) {
  return requestApi<ManagedUser[]>("/admin/users", accessToken);
}

export function updateManagedUserRoles(
  accessToken: string,
  userId: string,
  roles: RoleCode[],
) {
  return requestApi<void>(`/admin/users/${userId}/roles`, accessToken, {
    body: JSON.stringify({ roles }),
    headers: { "Content-Type": "application/json" },
    method: "PUT",
  });
}

export function getAcademicPeriods(accessToken: string) {
  return requestApi<AcademicPeriod[]>("/admin/academic/periods", accessToken);
}

export function createAcademicPeriod(
  accessToken: string,
  input: { name: string; start_date: string; end_date: string; is_active: boolean },
) {
  return requestApi<AcademicPeriod>("/admin/academic/periods", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getSubjects(accessToken: string) {
  return requestApi<Subject[]>("/admin/academic/subjects", accessToken);
}

export function createSubject(
  accessToken: string,
  input: { code?: string; name: string; is_active: boolean },
) {
  return requestApi<Subject>("/admin/academic/subjects", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getTeachers(accessToken: string) {
  return requestApi<Teacher[]>("/admin/academic/teachers", accessToken);
}

export function createTeacher(
  accessToken: string,
  input: { user_id: string; employee_code?: string; is_active: boolean },
) {
  return requestApi<Teacher>("/admin/academic/teachers", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getCourseSections(accessToken: string) {
  return requestApi<CourseSection[]>("/admin/academic/course-sections", accessToken);
}

export function createCourseSection(
  accessToken: string,
  input: {
    subject_id: string;
    teacher_id: string;
    academic_period_id: string;
    section: string;
    semester?: string;
    is_active: boolean;
  },
) {
  return requestApi<CourseSection>("/admin/academic/course-sections", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getLaboratories(accessToken: string) {
  return requestApi<Laboratory[]>("/admin/academic/laboratories", accessToken);
}

export function createLaboratory(
  accessToken: string,
  input: { code?: string; name: string; location_description?: string; is_active: boolean },
) {
  return requestApi<Laboratory>("/admin/academic/laboratories", accessToken, {
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

export function getInventoryCategories(accessToken: string) {
  return requestApi<InventoryCategory[]>("/admin/inventory/categories", accessToken);
}

export function createInventoryCategory(
  accessToken: string,
  input: { name: string; description?: string; is_active: boolean },
) {
  return requestApi<InventoryCategory>("/admin/inventory/categories", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getInventoryLocations(accessToken: string) {
  return requestApi<InventoryLocation[]>("/admin/inventory/locations", accessToken);
}

export function createInventoryLocation(
  accessToken: string,
  input: { code?: string; name: string; description?: string; is_active: boolean },
) {
  return requestApi<InventoryLocation>("/admin/inventory/locations", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function createInventoryItem(
  accessToken: string,
  input: {
    category_id: string;
    code?: string;
    name: string;
    description?: string;
    tracking_mode: "QUANTITY" | "INDIVIDUAL";
    unit_of_measure: string;
    is_active: boolean;
  },
) {
  return requestApi<InventoryItem>("/admin/inventory/items", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getInventoryUnits(accessToken: string) {
  return requestApi<InventoryUnit[]>("/admin/inventory/units", accessToken);
}

export function getInventoryUnitHistory(accessToken: string, unitId: string) {
  return requestApi<InventoryUnitHistory[]>(
    `/admin/inventory/units/${unitId}/history`,
    accessToken,
  );
}

export function createInventoryUnit(
  accessToken: string,
  input: {
    inventory_item_id: string;
    location_id?: string;
    asset_tag: string;
    serial_number?: string;
    status: InventoryUnit["status"];
    condition: InventoryUnitCondition;
    notes?: string;
    is_active: boolean;
  },
) {
  return requestApi<InventoryUnit>("/admin/inventory/units", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getInventoryMovements(accessToken: string) {
  return requestApi<InventoryMovement[]>("/admin/inventory/movements", accessToken);
}

export function createInventoryMovement(
  accessToken: string,
  input: {
    inventory_item_id: string;
    location_id: string;
    movement_type: InventoryMovement["movement_type"];
    quantity: number;
    notes?: string;
  },
) {
  return requestApi<InventoryMovement>("/admin/inventory/movements", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function getInventoryAvailability(
  accessToken: string,
  input: { inventory_item_id: string; start_at: string; end_at: string },
) {
  const query = new URLSearchParams(input);
  return requestApi<InventoryAvailability>(
    `/admin/inventory/availability?${query.toString()}`,
    accessToken,
  );
}

export function getEquipmentMaintenances(accessToken: string) {
  return requestApi<EquipmentMaintenance[]>("/admin/maintenance", accessToken);
}

export function startEquipmentMaintenance(
  accessToken: string,
  input: {
    inventory_unit_id: string;
    maintenance_type: EquipmentMaintenance["maintenance_type"];
    reason: string;
    description?: string;
  },
) {
  return requestApi<EquipmentMaintenance>("/admin/maintenance", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function closeEquipmentMaintenance(
  accessToken: string,
  maintenanceId: string,
  action: "complete" | "cancel",
  input: {
    resolution?: string;
    final_status: InventoryUnit["status"];
    final_condition: InventoryUnitCondition;
  },
) {
  return requestApi<EquipmentMaintenance>(
    `/admin/maintenance/${maintenanceId}/${action}`,
    accessToken,
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

export function registerMaintenanceEvidence(
  accessToken: string,
  maintenanceId: string,
  storagePath: string,
) {
  return requestApi<EquipmentMaintenanceEvidence>(
    `/admin/maintenance/${maintenanceId}/evidences`,
    accessToken,
    {
      body: JSON.stringify({ storage_path: storagePath }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
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
  return requestApi<EquipmentReturn>(`/admin/returns/loans/${loanId}`, accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function recordReturnInspection(
  accessToken: string,
  equipmentReturnId: string,
  input: EquipmentInspectionInput,
) {
  return requestApi<EquipmentInspection>(
    `/admin/inspections/returns/${equipmentReturnId}`,
    accessToken,
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

export function registerIncidentEvidence(
  accessToken: string,
  incidentId: string,
  storagePath: string,
) {
  return requestApi<EquipmentIncidentEvidence>(
    `/admin/inspections/incidents/${incidentId}/evidences`,
    accessToken,
    {
      body: JSON.stringify({ storage_path: storagePath }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

export function getOperationalReport(
  accessToken: string,
  report: "requests" | "loans" | "incidents" | "stock" | "kardex",
) {
  return requestApi<OperationalReportRow[]>(`/admin/reports/${report}`, accessToken);
}

export function getIncidentReport(accessToken: string) {
  return requestApi<IncidentOperationalReportRow[]>(
    "/admin/reports/incidents",
    accessToken,
  );
}

export function getRequestOperationalReport(accessToken: string) {
  return requestApi<RequestOperationalReportRow[]>(
    "/admin/reports/requests",
    accessToken,
  );
}

export function recordOutboundInspection(
  accessToken: string,
  requestId: string,
  input: EquipmentInspectionInput,
) {
  return requestApi<EquipmentInspection>(
    `/admin/inspections/requests/${requestId}/outbound`,
    accessToken,
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
}

export function generateEquipmentDeliveryQr(accessToken: string, requestId: string) {
  return requestApi<EquipmentDeliveryQr>(
    `/admin/deliveries/requests/${requestId}/qr`,
    accessToken,
    { method: "POST" },
  );
}

export function deliverEquipmentRequest(
  accessToken: string,
  input: EquipmentDeliveryInput,
) {
  return requestApi<EquipmentLoan>("/admin/deliveries/deliver", accessToken, {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
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
