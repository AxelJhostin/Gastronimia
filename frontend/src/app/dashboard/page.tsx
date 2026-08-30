"use client";

import Link from "next/link";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { Plus, FileText, Package, AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardPage() {
  const identityState = useDashboardIdentity();

  if (identityState.status === "loading") {
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando panel de control...
      </div>
    );
  }

  if (identityState.status !== "authenticated") {
    return null;
  }

  const { roles, email } = identityState.user;
  const userRoles = roles as string[];
  const isTeacher = userRoles.includes("teacher");
  const isInventoryManager = userRoles.includes("inventory_manager");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bienvenido, {email}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Panel de gestión adaptado a tus roles:{" "}
          <span className="font-semibold capitalize text-emerald-600">
            {roles.join(", ")}
          </span>
        </p>
      </div>

      {/* Vista para Docente / Teacher */}
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Nueva Solicitud
              </span>
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xs text-slate-500">
              Crea un requerimiento de insumos o equipos para tus clases.
            </p>
            <Link
              href="/dashboard/requests/new"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> Crear Solicitud
            </Link>
          </div>
        </div>
      )}

      {/* Vista para Personal de Almacén / Inventory Manager */}
      {isInventoryManager && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Inventario General
              </span>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500">
              Gestión de stock, insumos y herramientas.
            </p>
            <Link
              href="/dashboard/inventory"
              className="inline-block mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Ver Inventario &rarr;
            </Link>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Devoluciones Pendientes
              </span>
              <RotateCcw className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs text-slate-500">
              Inspección y recepción de materiales.
            </p>
            <Link
              href="/dashboard/returns"
              className="inline-block mt-2 text-xs font-medium text-amber-600 hover:underline"
            >
              Gestionar Devoluciones &rarr;
            </Link>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Incidencias
              </span>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-xs text-slate-500">
              Seguimiento de mermas o daños en insumos/equipos.
            </p>
            <Link
              href="/dashboard/incidents"
              className="inline-block mt-2 text-xs font-medium text-red-600 hover:underline"
            >
              Ver Incidencias &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}