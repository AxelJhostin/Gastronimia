import { api } from "../support/api";
import type { SeedScenario } from "../support/types";

type RaceResult = {
  scenario: SeedScenario & { unitId: string; requestId: string; qrToken: string };
  blocked: boolean;
  follower: { ok: boolean; errorCode: string | null };
  state: { unitStatus: string; loans: number; loanUnits: number; maintenances: number; requestStatus: string; reservationStatus: string; qrUsed: boolean; deliveryEvents: number; maintenanceEvents: number };
};

describe("R-07 entrega y mantenimiento simultáneos", () => {
  for (const first of ["delivery", "maintenance"] as const) {
    it(`con ${first} primero, solo una operación incompatible prospera`, () => {
      cy.task<RaceResult>("qa:unit-concurrency", first, { log: false }).then(({ scenario, blocked, follower, state }) => {
        expect(blocked, "segunda conexión bloqueada hasta confirmar la primera").to.equal(true);
        expect(follower.ok, `estado observado: ${JSON.stringify(state)}`).to.equal(false);
        expect(["P0001", "23514"]).to.include(follower.errorCode);
        const delivered = first === "delivery";
        expect(state).to.deep.equal({
          unitStatus: delivered ? "LOANED" : "MAINTENANCE",
          loans: delivered ? 1 : 0, loanUnits: delivered ? 1 : 0,
          maintenances: delivered ? 0 : 1,
          requestStatus: delivered ? "DELIVERED" : "PREPARED",
          reservationStatus: delivered ? "CONSUMED" : "ACTIVE",
          qrUsed: delivered, deliveryEvents: delivered ? 1 : 0, maintenanceEvents: delivered ? 0 : 1,
        });
        cy.loginAs(scenario.manager.email, scenario.manager.password);
        cy.visit("/dashboard");
        if (delivered) {
          api("/admin/maintenance", "POST", { inventory_unit_id: scenario.unitId, maintenance_type: "PREVENTIVE", reason: "QA unidad ya prestada" }, 409);
        } else {
          api("/admin/deliveries/deliver", "POST", { qr_token: scenario.qrToken, collected_by_name: "QA entrega bloqueada", quantity_locations: [] }, 409);
          api<Array<{ id: string; inventory_unit_id: string }>>("/admin/maintenance").then((rows) => {
            const maintenance = rows.find((row) => row.inventory_unit_id === scenario.unitId)!;
            api(`/admin/maintenance/${maintenance.id}/complete`, "POST", { final_status: "AVAILABLE", final_condition: "GOOD", resolution: "QA revisión completada" });
            // La entrega fallida no consumió el QR ni dejó un préstamo parcial.
            api("/admin/deliveries/deliver", "POST", { qr_token: scenario.qrToken, collected_by_name: "QA entrega después de mantenimiento", quantity_locations: [] });
          });
        }
      });
    });
  }
});
