import { randomUUID } from "node:crypto";
import { seedIndividualLoanScenario } from "./seed";
import { Session, query, literal, type Outcome } from "./local-database";

export async function raceDeliveryAndMaintenance(first: "delivery" | "maintenance") {
  if (!["delivery", "maintenance"].includes(first)) throw new Error("Orden de prueba inválido.");
  const scenario = await seedIndividualLoanScenario("ready");
  if (!("qrToken" in scenario) || !scenario.qrToken) throw new Error("Falta un QR QA preparado.");
  const appName = `qa_r07_${randomUUID().replaceAll("-", "")}`;
  const delivery = `select public.deliver_equipment_request(${literal(scenario.qrToken)},'QA carrera R07',${literal(scenario.manager.id)},'[]');`;
  const maintenance = `select public.start_equipment_maintenance(${literal(scenario.unitId)},'PREVENTIVE','QA carrera R07',null,${literal(scenario.manager.id)});`;
  const leader = new Session();
  const follower = new Session();
  let following: Promise<Outcome> | undefined;
  try {
    const leading = await leader.run(`begin; set local statement_timeout='15s'; set local idle_in_transaction_session_timeout='30s'; set local role service_role; ${first === "delivery" ? delivery : maintenance}`);
    if (!leading.ok) throw new Error(`La primera operación QA falló: ${leading.errorCode}`);
    following = follower.run(`set application_name=${literal(appName)}; set statement_timeout='15s'; begin; set local role service_role; ${first === "delivery" ? maintenance : delivery} commit;`);
    // Espera un bloqueo real, no un retraso estimado ni una carrera probabilística.
    const deadline = Date.now() + 8_000;
    let blocked = false;
    while (Date.now() < deadline) {
      blocked = query(`select exists(select 1 from pg_stat_activity where application_name=${literal(appName)} and wait_event_type='Lock' and cardinality(pg_blocking_pids(pid))>0);`) === "t";
      if (blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!blocked) throw new Error("No se observó la segunda operación esperando el bloqueo de la unidad.");
    const committed = await leader.run("commit;");
    if (!committed.ok) throw new Error("No se confirmó la primera operación QA.");
    const outcome = await following;
    const state = JSON.parse(query(`select json_build_object(
      'unitStatus',u.status,
      'loans',(select count(*) from public.equipment_loans where equipment_request_id=${literal(scenario.requestId)}),
      'loanUnits',(select count(*) from public.equipment_loan_units lu join public.equipment_preparation_units pu on pu.id=lu.equipment_preparation_unit_id where pu.inventory_unit_id=u.id),
      'maintenances',(select count(*) from public.equipment_maintenances where inventory_unit_id=u.id and status='OPEN'),
      'requestStatus',(select status from public.equipment_requests where id=${literal(scenario.requestId)}),
      'reservationStatus',(select status from public.equipment_reservations where equipment_request_id=${literal(scenario.requestId)}),
      'qrUsed',(select used_at is not null from public.equipment_delivery_qr_tokens where equipment_request_id=${literal(scenario.requestId)}),
      'deliveryEvents',(select count(*) from public.operational_audit_log a join public.equipment_loans l on l.id=a.entity_id where a.entity_table='equipment_loans' and l.equipment_request_id=${literal(scenario.requestId)}),
      'maintenanceEvents',(select count(*) from public.operational_audit_log a join public.equipment_maintenances m on m.id=a.entity_id where a.action='MAINTENANCE_STARTED' and m.inventory_unit_id=u.id)
    ) from public.inventory_units u where u.id=${literal(scenario.unitId)};`));
    // Si se reproduce el defecto antiguo, conserva la evidencia y repara SOLO esta unidad QA.
    if (state.loans === 1 && state.maintenances === 1) {
      query(`begin; update public.equipment_maintenances set status='CANCELLED',completed_by_user_id=${literal(scenario.manager.id)},completed_at=now(),resolution='QA: restauración tras reproducir R07' where inventory_unit_id=${literal(scenario.unitId)} and status='OPEN'; update public.inventory_units set status='LOANED' where id=${literal(scenario.unitId)}; commit;`);
    }
    return { scenario, blocked, follower: outcome, state };
  } finally {
    // Cerrar la conexión líder revierte cualquier transacción inconclusa y libera al seguidor.
    leader.close();
    if (following) await following.catch(() => undefined);
    follower.close();
  }
}
