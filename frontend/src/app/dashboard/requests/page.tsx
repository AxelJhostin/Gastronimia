"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  Calendar,
  XCircle,
  Inbox
} from "lucide-react";
import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";

interface RequestSummary {
  id: string;
  teacherName: string;
  activityName: string;
  activityDate: string;
  status: "pending" | "approved" | "delivered" | "completed" | "rejected";
  itemCount: number;
  createdAt: string;
}

const MOCK_REQUESTS: RequestSummary[] = [
  {
    id: "REQ-2026-001",
    teacherName: "Prof. Carlos Mendoza",
    activityName: "Taller de Panadería Artesanal",
    activityDate: "2026-09-02",
    status: "pending",
    itemCount: 4,
    createdAt: "2026-08-28",
  },
  {
    id: "REQ-2026-002",
    teacherName: "Prof. Maria Gomez",
    activityName: "Cocina Internacional II",
    activityDate: "2026-09-03",
    status: "approved",
    itemCount: 8,
    createdAt: "2026-08-27",
  },
  {
    id: "REQ-2026-003",
    teacherName: "Prof. Carlos Mendoza",
    activityName: "Pastelería Básica",
    activityDate: "2026-08-25",
    status: "completed",
    itemCount: 5,
    createdAt: "2026-08-20",
  },
];

const STATUS_BADGES = {
  pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Aprobada", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  delivered: { label: "Entregada", color: "bg-purple-50 text-purple-700 border-purple-200", icon: PackageCheck },
  completed: { label: "Finalizada", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
};

export default function RequestsPage() {
  const identityState = useDashboardIdentity();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isTeacher =
    identityState.status === "authenticated" &&
    (identityState.user.roles as string[]).includes("teacher");

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const filteredRequests = MOCK_REQUESTS.filter((req) => {
    const matchesSearch =
      req.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || req.status === statusFilter;

    const matchesStartDate = !startDate || new Date(req.activityDate) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(req.activityDate) <= new Date(endDate);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Solicitudes de Insumos
          </h1>
          <p className="text-xs text-slate-500">
            Gestión y seguimiento de requerimientos académicos con filtros avanzados.
          </p>
        </div>

        {isTeacher && (
          <Link
            href="/dashboard/requests/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Nueva Solicitud
          </Link>
        )}
      </div>

      {/* Barra de Búsqueda y Filtros Avanzados */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Búsqueda por texto */}
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por taller, código o docente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Filtro de Estado */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto text-xs border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="delivered">Entregada</option>
              <option value="completed">Finalizada</option>
              <option value="rejected">Rechazada</option>
            </select>
          </div>
        </div>

        {/* Filtros de Rango de Fecha */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium">Rango de fecha:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-700 bg-white"
            />
            <span className="text-slate-400">a</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-md p-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-700 bg-white"
            />
          </div>

          {(searchTerm || statusFilter !== "all" || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 ml-auto transition-colors font-medium"
            >
              <XCircle className="h-3.5 w-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Resultados / Estado Vacío */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Inbox className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No se encontraron solicitudes</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Intenta ajustar los criterios de búsqueda o limpia los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Actividad / Taller</th>
                  <th className="px-4 py-3">Docente</th>
                  <th className="px-4 py-3">Fecha Requerida</th>
                  <th className="px-4 py-3">Ítems</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const Badge = STATUS_BADGES[req.status];
                  const StatusIcon = Badge.icon;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{req.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{req.activityName}</td>
                      <td className="px-4 py-3">{req.teacherName}</td>
                      <td className="px-4 py-3">{req.activityDate}</td>
                      <td className="px-4 py-3">{req.itemCount} insumos</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${Badge.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {Badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/inventory/${req.id}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> Gestionar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}