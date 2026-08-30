"use client";

import { NewRequestForm } from "@/components/requests/new-request-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/requests"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Crear Solicitud
          </h1>
          <p className="text-xs text-slate-500">
            Completa el formulario para solicitar insumos o herramientas para tu taller o clase.
          </p>
        </div>
      </div>

      <NewRequestForm />
    </div>
  );
}