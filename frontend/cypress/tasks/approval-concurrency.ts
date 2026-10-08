import { randomUUID } from "node:crypto";
import { Session, query, literal, type Outcome } from "./local-database";
import { seedApprovalRace, type ApprovalRaceOptions } from "./seed";

export async function raceApprovals(options: ApprovalRaceOptions) {
  const scenario = await seedApprovalRace(options);
  const [first, second] = scenario.requests;
  const approval = (request: typeof first, actor: string) => `select public.approve_equipment_request(${literal(request.id)},${literal(actor)},${literal(JSON.stringify([{ equipment_request_item_id: request.itemId, approved_quantity: request.quantity }]))}::jsonb);`;
  const appName = `qa_approvals_${randomUUID().replaceAll("-", "")}`;
  const leader = new Session();
  const follower = new Session();
  let following: Promise<Outcome> | undefined;
  try {
    const leading = await leader.run(`begin; set local statement_timeout='15s'; set local idle_in_transaction_session_timeout='30s'; set local role service_role; ${approval(first, scenario.admin.id)}`);
    if (!leading.ok) throw new Error(`Falló la primera aprobación QA: ${leading.errorCode}`);
    following = follower.run(`set application_name=${literal(appName)}; set statement_timeout='15s'; begin; set local role service_role; ${approval(second, scenario.manager.id)} commit;`);
    const deadline = Date.now() + 8_000;
    let blocked = false;
    while (Date.now() < deadline) {
      blocked = query(`select exists(select 1 from pg_stat_activity where application_name=${literal(appName)} and wait_event='advisory' and cardinality(pg_blocking_pids(pid))>0);`) === "t";
      if (blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (!blocked) throw new Error("La segunda aprobación no esperó el bloqueo del artículo.");
    const finalized = await leader.run(options.rollbackFirst ? "rollback;" : "commit;");
    if (!finalized.ok) throw new Error("No finalizó la primera transacción QA.");
    const outcome = await following;
    const states = scenario.requests.map((request) => JSON.parse(query(`select json_build_object(
      'status',r.status,
      'reservations',(select count(*) from public.equipment_reservations where equipment_request_id=r.id),
      'reserved',(select coalesce(sum(d.reserved_quantity),0) from public.equipment_reservation_details d join public.equipment_reservations e on e.id=d.equipment_reservation_id where e.equipment_request_id=r.id and e.status='ACTIVE'),
      'itemReviews',(select count(*) from public.equipment_request_item_reviews v join public.equipment_request_items i on i.id=v.equipment_request_item_id where i.equipment_request_id=r.id),
      'reviews',(select count(*) from public.equipment_request_reviews where equipment_request_id=r.id),
      'reviewer',(select reviewed_by_user_id from public.equipment_request_reviews where equipment_request_id=r.id),
      'available',(select case when tracking_mode='QUANTITY' then quantity_available else units_available end from public.calculate_inventory_availability(${literal(scenario.contestedItemId)},r.start_at,r.end_at))
    ) from public.equipment_requests r where r.id=${literal(request.id)};`)));
    const inventory = JSON.parse(query(`select json_build_object(
      'quantity',(select coalesce(sum(quantity),0) from public.inventory_quantity_stock where inventory_item_id=${literal(scenario.contestedItemId)}),
      'availableUnits',(select count(*) from public.inventory_units where inventory_item_id=${literal(scenario.contestedItemId)} and status='AVAILABLE' and is_active)
    );`));
    return { scenario, blocked, follower: outcome, states, inventory };
  } finally {
    leader.close();
    if (following) await following.catch(() => undefined);
    follower.close();
  }
}
