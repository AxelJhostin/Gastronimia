import { randomUUID } from "node:crypto";

import type {
  PendingReturnScenario,
  SeedScenario,
  SeedUser,
} from "../support/types";

type JsonRecord = Record<string, unknown>;

type LocalServices = {
  apiBaseUrl: string;
  publishableKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

function localServices(): LocalServices {
  const services = {
    apiBaseUrl: process.env.TEST_API_BASE_URL ?? "http://127.0.0.1:8000",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    supabaseUrl: process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  };

  for (const [name, value] of Object.entries(services)) {
    if (!value) throw new Error(`Falta la variable local ${name}.`);
  }
  for (const url of [services.apiBaseUrl, services.supabaseUrl]) {
    if (!["127.0.0.1", "localhost", "::1"].includes(new URL(url).hostname)) {
      throw new Error("Cypress solo puede preparar datos en servicios localhost.");
    }
  }
  return services;
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${new URL(url).pathname}: ${response.status} ${text}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

function serviceHeaders(services: LocalServices) {
  return {
    apikey: services.serviceRoleKey,
    Authorization: `Bearer ${services.serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

async function insertRow<T extends JsonRecord>(
  services: LocalServices,
  table: string,
  payload: JsonRecord,
): Promise<T> {
  const rows = await requestJson<T[]>(`${services.supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...serviceHeaders(services),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  if (rows.length !== 1) throw new Error(`Supabase no creó una fila en ${table}.`);
  return rows[0];
}

async function createUser(
  services: LocalServices,
  marker: string,
  kind: "admin" | "teacher",
  roleId: number,
): Promise<SeedUser> {
  const email = `cypress-${kind}-${marker}@example.test`;
  const password = `Cypress-${marker}-Safe9!`;
  const payload = await requestJson<JsonRecord>(
    `${services.supabaseUrl}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: serviceHeaders(services),
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: `Cypress ${kind}` },
      }),
    },
  );
  const nestedUser = payload.user;
  const id =
    typeof payload.id === "string"
      ? payload.id
      : typeof nestedUser === "object" && nestedUser !== null && "id" in nestedUser
        ? String(nestedUser.id)
        : "";
  if (!id) throw new Error("Supabase Auth no devolvió el identificador del usuario.");
  await insertRow(services, "user_roles", { user_id: id, role_id: roleId });
  return { id, email, password };
}

export async function seedBaseScenario(): Promise<SeedScenario> {
  const services = localServices();
  const marker = randomUUID().replaceAll("-", "").slice(0, 12);
  const admin = await createUser(services, marker, "admin", 1);
  const teacher = await createUser(services, marker, "teacher", 3);
  const teacherProfile = await insertRow<{ id: string }>(services, "teachers", {
    user_id: teacher.id,
    employee_code: `CY-${marker}`,
  });
  const period = await insertRow<{ id: string }>(services, "academic_periods", {
    name: `Cypress period ${marker}`,
    start_date: "2035-01-01",
    end_date: "2035-12-31",
  });
  const subject = await insertRow<{ id: string }>(services, "subjects", {
    code: `CY-${marker}`,
    name: `Cypress subject ${marker}`,
  });
  const courseSection = await insertRow<{ id: string }>(services, "course_sections", {
    subject_id: subject.id,
    teacher_id: teacherProfile.id,
    academic_period_id: period.id,
    section: `CY-${marker}`,
    semester: "1",
  });
  const laboratory = await insertRow<{ id: string }>(services, "laboratories", {
    code: `LAB-${marker}`,
    name: `Cypress laboratory ${marker}`,
  });
  const category = await insertRow<{ id: string }>(services, "inventory_categories", {
    name: `Cypress category ${marker}`,
  });
  const location = await insertRow<{ id: string }>(services, "inventory_locations", {
    code: `LOC-${marker}`,
    name: `Cypress location ${marker}`,
  });
  const inventoryItemName = `Cypress flour ${marker}`;
  const inventoryItem = await insertRow<{ id: string }>(services, "inventory_items", {
    category_id: category.id,
    code: `ITEM-${marker}`,
    name: inventoryItemName,
    tracking_mode: "QUANTITY",
    unit_of_measure: "kg",
  });
  await insertRow(services, "inventory_quantity_stock", {
    inventory_item_id: inventoryItem.id,
    location_id: location.id,
    quantity: 10,
  });

  return {
    marker,
    admin,
    teacher,
    courseSectionId: courseSection.id,
    laboratoryId: laboratory.id,
    inventoryItemId: inventoryItem.id,
    inventoryItemName,
    locationId: location.id,
  };
}

async function authToken(services: LocalServices, user: SeedUser): Promise<string> {
  const payload = await requestJson<{ access_token: string }>(
    `${services.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: services.publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: user.email, password: user.password }),
    },
  );
  return payload.access_token;
}

async function api<T>(
  services: LocalServices,
  token: string,
  path: string,
  method = "GET",
  body?: JsonRecord,
): Promise<T> {
  return requestJson<T>(`${services.apiBaseUrl}/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function seedPendingReturnScenario(): Promise<PendingReturnScenario> {
  const scenario = await seedBaseScenario();
  const services = localServices();
  const teacherToken = await authToken(services, scenario.teacher);
  const adminToken = await authToken(services, scenario.admin);
  const draft = await api<{ id: string }>(services, teacherToken, "/requests/drafts", "POST", {
    course_section_id: scenario.courseSectionId,
    laboratory_id: scenario.laboratoryId,
    start_at: "2035-06-01T13:00:00+00:00",
    end_at: "2035-06-01T15:00:00+00:00",
    purpose: `Cypress recovery ${scenario.marker}`,
    items: [{ inventory_item_id: scenario.inventoryItemId, requested_quantity: 2 }],
  });
  await api(services, teacherToken, `/requests/${draft.id}/submit`, "POST");
  const detail = await api<{ items: Array<{ id: string }> }>(
    services,
    adminToken,
    `/requests/${draft.id}`,
  );
  await api(services, adminToken, `/admin/requests/${draft.id}/approve`, "POST", {
    items: [{ equipment_request_item_id: detail.items[0].id, approved_quantity: 2 }],
  });
  const reservationRows = await requestJson<Array<{ id: string }>>(
    `${services.supabaseUrl}/rest/v1/equipment_reservation_details?select=id&inventory_item_id=eq.${scenario.inventoryItemId}`,
    { headers: serviceHeaders(services) },
  );
  const reservationDetailId = reservationRows[0]?.id;
  if (!reservationDetailId) throw new Error("No se creó el detalle de reserva.");
  await api(services, adminToken, `/admin/requests/${draft.id}/preparation/start`, "POST");
  await api(services, adminToken, `/admin/requests/${draft.id}/preparation/items`, "POST", {
    items: [
      {
        equipment_reservation_detail_id: reservationDetailId,
        prepared_quantity: 2,
      },
    ],
  });
  await api(services, adminToken, `/admin/requests/${draft.id}/preparation/complete`, "POST");
  await api(services, adminToken, `/admin/inspections/requests/${draft.id}/outbound`, "POST", {
    items: [],
  });
  const qr = await api<{ token: string }>(
    services,
    adminToken,
    `/admin/deliveries/requests/${draft.id}/qr`,
    "POST",
  );
  const loan = await api<{ id: string }>(services, adminToken, "/admin/deliveries/deliver", "POST", {
    qr_token: qr.token,
    collected_by_name: "Cypress Recovery Teacher",
    quantity_locations: [
      {
        equipment_reservation_detail_id: reservationDetailId,
        location_id: scenario.locationId,
        loaned_quantity: 2,
      },
    ],
  });
  const pending = await api<{ quantity_details: Array<{ equipment_loan_detail_id: string }> }>(
    services,
    adminToken,
    `/admin/returns/loans/${loan.id}/pending`,
  );
  const equipmentReturn = await api<{ id: string }>(
    services,
    adminToken,
    `/admin/returns/loans/${loan.id}`,
    "POST",
    {
      returned_by_name: "Cypress Recovery Teacher",
      quantity_details: [
        {
          equipment_loan_detail_id: pending.quantity_details[0].equipment_loan_detail_id,
          returned_quantity: 2,
          location_id: scenario.locationId,
        },
      ],
      loan_unit_ids: [],
    },
  );

  return {
    ...scenario,
    requestId: draft.id,
    loanId: loan.id,
    returnId: equipmentReturn.id,
  };
}
