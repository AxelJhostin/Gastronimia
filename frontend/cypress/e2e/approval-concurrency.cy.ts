import { api } from "../support/api";
import type { SeedScenario } from "../support/types";
import type { ApprovalRaceOptions } from "../tasks/seed";

type RequestState = { status: string; reservations: number; reserved: number; itemReviews: number; reviews: number; reviewer: string | null; available: number };
type Result = {
  scenario: SeedScenario & { contestedItemId: string; requests: Array<{ id: string; itemId: string; start: string; end: string; quantity: number }> };
  blocked: boolean; follower: { ok: boolean; errorCode: string | null };
  states: RequestState[]; inventory: { quantity: number; availableUnits: number };
};
const cases: Array<{ name: string; options: ApprovalRaceOptions; secondSucceeds: boolean; available: number }> = [
  { name: "rechaza reservar 7 + 7 con stock de 10", options: { mode: "QUANTITY", firstQuantity: 7, secondQuantity: 7 }, secondSucceeds: false, available: 3 },
  { name: "impide reservar dos veces la única unidad individual", options: { mode: "INDIVIDUAL", firstQuantity: 1, secondQuantity: 1 }, secondSucceeds: false, available: 0 },
  { name: "permite 4 + 6 al alcanzar exactamente el stock de 10", options: { mode: "QUANTITY", firstQuantity: 4, secondQuantity: 6 }, secondSucceeds: true, available: 0 },
  { name: "permite reutilizar el stock en horarios contiguos sin superposición", options: { mode: "QUANTITY", firstQuantity: 7, secondQuantity: 7, adjacent: true }, secondSucceeds: true, available: 3 },
  { name: "permite aprobar cuando la primera transacción se revierte", options: { mode: "QUANTITY", firstQuantity: 7, secondQuantity: 7, rollbackFirst: true }, secondSucceeds: true, available: 3 },
];

describe("Aprobaciones simultáneas sin sobre-reserva", () => {
  for (const test of cases) {
    it(test.name, () => {
      cy.task<Result>("qa:approval-concurrency", test.options, { log: false }).then(({ scenario, blocked, follower, states, inventory }) => {
        expect(blocked, "segunda aprobación esperando el bloqueo del artículo").to.equal(true);
        expect(follower.ok).to.equal(test.secondSucceeds);
        expect(follower.errorCode).to.equal(test.secondSucceeds ? null : "P0001");
        for (const [index, state] of states.entries()) {
          const approved = index === 0 ? !test.options.rollbackFirst : test.secondSucceeds;
          expect(state).to.deep.equal({
            status: approved ? "APPROVED" : "PENDING", reservations: approved ? 1 : 0,
            reserved: approved ? scenario.requests[index].quantity : 0,
            itemReviews: approved ? 1 : 0, reviews: approved ? 1 : 0,
            reviewer: approved ? (index === 0 ? scenario.admin.id : scenario.manager.id) : null,
            available: test.available,
          });
        }
        expect(inventory).to.deep.equal(test.options.mode === "QUANTITY" ? { quantity: 10, availableUnits: 0 } : { quantity: 0, availableUnits: 1 });
        cy.loginAs(scenario.manager.email, scenario.manager.password);
        cy.visit("/dashboard");
        const second = scenario.requests[1];
        api<{ request: { status: string } }>(`/requests/${second.id}`).its("request.status").should("eq", test.secondSucceeds ? "APPROVED" : "PENDING");
        if (!test.secondSucceeds) {
          const items = [{ equipment_request_item_id: second.itemId, approved_quantity: second.quantity }];
          api(`/admin/requests/${second.id}/approve`, "POST", { items }, 409);
          if (test.available > 0) {
            api(`/admin/requests/${second.id}/approve`, "POST", { items: [{ ...items[0], approved_quantity: test.available }] }).its("status").should("eq", "PARTIALLY_APPROVED");
            const params = new URLSearchParams({ inventory_item_id: scenario.contestedItemId, start_at: second.start, end_at: second.end });
            api<{ quantity_available: string }>(`/admin/inventory/availability?${params}`).then((availability) => expect(Number(availability.quantity_available)).to.equal(0));
          }
        }
      });
    });
  }
});
