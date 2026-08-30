"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, RotateCcw, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

interface ReturnSummary {
  id: string;
  requestId: string;
  teacherName: string;
  activityName: string;
  returnDate: string;
  status: "pending_inspection" | "inspected_ok" | "has_incidents";
  pendingItemsCount: number;
}

const MOCK_RETURNS: ReturnSummary[] = [
  {
    id: "RET-001",
    requestId: "REQ-2026-003",
    teacherName: "Prof. Carlos Mendoza",
    activityName: "Pastelería Básica",
    returnDate: "2026-08-30",
    status: "pending_inspection",
    pendingItemsCount: 3,
  },
  {
    id: "RET-002",
    requestId: "REQ-2026-002",
    teacherName: "Prof. Maria Gomez",
    activityName: "Cocina Internacional II",
    returnDate: "2026-08-29",
    status: "has_incidents",
    pendingItemsCount: 5,
  },
];

export default function ReturnsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReturns = MOCK_RETURNS.filter(
    (ret) =>
      ret.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.requestId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Control de Devoluciones
        </h1>
        <p className="text-xs text-slate-500">
          Inspección e ingreso de herramientas y materiales retornados al almacén.
        </p>
      </div>

      <div className="relative max-w-md bg-white rounded-xl border border-slate-200 shadow-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar devolución por código o docente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border-0 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReturns.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase text-slate-400 block">
                  Solicitud: {item.requestId}
                </span>
                <h3 className="text-sm font-bold text-slate-800">{item.activityName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Docente: {item.teacherName}</p>
              </div>

              {item.status === "pending_inspection" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <RotateCcw className="h-3 w-3" /> Pendiente Inspección
                </span>
              )}

              {item.status === "has_incidents" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                  <AlertTriangle className="h-3 w-3" /> Con Novedades
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Retorno: <strong>{item.returnDate}</strong></span>
              <span>Herramientas: <strong>{item.pendingItemsCount} ítems</strong></span>
            </div>

            <div className="pt-2">
              <Link
                href={`/dashboard/returns/${item.requestId}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ShieldCheck className="h-4 w-4" /> Inspeccionar y Registrar Devolución
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}