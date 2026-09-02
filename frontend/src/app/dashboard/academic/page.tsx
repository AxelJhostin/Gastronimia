"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useDashboardIdentity } from "@/components/auth/dashboard-identity-provider";
import { GastronomyStatusPage } from "@/components/feedback/gastronomy-status-page";
import {
  createAcademicPeriod,
  createCourseSection,
  createLaboratory,
  createSubject,
  createTeacher,
  getAcademicPeriods,
  getCourseSections,
  getLaboratories,
  getManagedUsers,
  getSubjects,
  getTeachers,
  type AcademicPeriod,
  type CourseSection,
  type Laboratory,
  type ManagedUser,
  type Subject,
  type Teacher,
} from "@/lib/api/client";

export default function AcademicConfigurationPage() {
  const identity = useDashboardIdentity();
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasAccess =
    identity.status === "authenticated" && identity.user.roles.includes("ADMIN");
  const token = identity.status === "authenticated" ? identity.accessToken : null;

  useEffect(() => {
    if (!hasAccess || !token) return;
    void Promise.all([
      getAcademicPeriods(token),
      getSubjects(token),
      getManagedUsers(token),
      getTeachers(token),
      getCourseSections(token),
      getLaboratories(token),
    ])
      .then(([nextPeriods, nextSubjects, nextUsers, nextTeachers, nextSections, nextLabs]) => {
        setPeriods(nextPeriods);
        setSubjects(nextSubjects);
        setUsers(nextUsers);
        setTeachers(nextTeachers);
        setSections(nextSections);
        setLaboratories(nextLabs);
      })
      .catch((loadError: unknown) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No fue posible cargar la configuración académica.",
        ),
      )
      .finally(() => setLoading(false));
  }, [hasAccess, token]);

  const runCreate = async (resource: string, action: () => Promise<void>) => {
    setSaving(resource);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess("Registro académico creado correctamente.");
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "No fue posible crear el registro académico.",
      );
    } finally {
      setSaving(null);
    }
  };

  if (identity.status === "loading") return <p className="p-6 text-sm text-stone-600">Cargando academia…</p>;
  if (identity.status === "unavailable") return <p className="p-6 text-sm text-red-700">{identity.message}</p>;
  if (!hasAccess) return <GastronomyStatusPage kind="forbidden" />;

  const teacherUsers = users.filter(
    (user) => user.is_active && user.roles.includes("TEACHER") && !teachers.some((teacher) => teacher.user_id === user.id),
  );
  const userById = Object.fromEntries(users.map((user) => [user.id, user]));
  const subjectById = Object.fromEntries(subjects.map((subject) => [subject.id, subject]));
  const periodById = Object.fromEntries(periods.map((period) => [period.id, period]));
  const teacherById = Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher]));

  return (
    <main className="flex flex-1 justify-center bg-stone-50 p-6 text-stone-900">
      <section className="w-full max-w-7xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Administración</p><h1 className="mt-1 text-3xl font-bold">Configuración académica</h1><p className="mt-1 text-sm text-stone-600">Crea el contexto que utilizan docentes y solicitudes.</p></div>
          <Link className="text-xs font-semibold text-stone-600 underline" href="/dashboard">Volver al panel</Link>
        </div>
        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div> : null}
        {success ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{success}</div> : null}
        {loading ? <p className="mt-6 text-sm text-stone-500">Cargando configuración…</p> : (
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ResourceCard title="Períodos académicos" items={periods.map((period) => `${period.name} · ${period.start_date} a ${period.end_date}`)}>
              <form className="grid gap-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("period", async () => { const created = await createAcademicPeriod(token!, { name: String(form.get("name")), start_date: String(form.get("start_date")), end_date: String(form.get("end_date")), is_active: true }); setPeriods((current) => [created, ...current]); formElement.reset(); }); }}>
                <Field label="Nombre" name="name" required /><Field label="Inicio" name="start_date" required type="date" /><Field label="Fin" name="end_date" required type="date" /><SubmitButton disabled={saving === "period"} label="Crear período" />
              </form>
            </ResourceCard>

            <ResourceCard title="Materias" items={subjects.map((subject) => `${subject.code ?? "Sin código"} · ${subject.name}`)}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("subject", async () => { const created = await createSubject(token!, { code: String(form.get("code")) || undefined, name: String(form.get("name")), is_active: true }); setSubjects((current) => [...current, created]); formElement.reset(); }); }}>
                <Field label="Código" name="code" /><Field label="Nombre" name="name" required /><SubmitButton disabled={saving === "subject"} label="Crear materia" />
              </form>
            </ResourceCard>

            <ResourceCard title="Perfiles docentes" items={teachers.map((teacher) => `${userById[teacher.user_id]?.full_name ?? "Usuario docente"} · ${teacher.employee_code ?? "Sin código"}`)}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("teacher", async () => { const created = await createTeacher(token!, { user_id: String(form.get("user_id")), employee_code: String(form.get("employee_code")) || undefined, is_active: true }); setTeachers((current) => [...current, created]); formElement.reset(); }); }}>
                <SelectField label="Usuario con rol TEACHER" name="user_id" options={teacherUsers.map((user) => ({ value: user.id, label: `${user.full_name} · ${user.email}` }))} /><Field label="Código de empleado" name="employee_code" /><SubmitButton disabled={saving === "teacher" || teacherUsers.length === 0} label="Crear perfil" />
              </form>
            </ResourceCard>

            <ResourceCard title="Laboratorios" items={laboratories.map((laboratory) => `${laboratory.code ?? "Sin código"} · ${laboratory.name}`)}>
              <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("laboratory", async () => { const created = await createLaboratory(token!, { code: String(form.get("code")) || undefined, name: String(form.get("name")), location_description: String(form.get("location_description")) || undefined, is_active: true }); setLaboratories((current) => [...current, created]); formElement.reset(); }); }}>
                <Field label="Código" name="code" /><Field label="Nombre" name="name" required /><Field label="Ubicación" name="location_description" /><SubmitButton disabled={saving === "laboratory"} label="Crear laboratorio" />
              </form>
            </ResourceCard>

            <div className="xl:col-span-2"><ResourceCard title="Cursos y paralelos" items={sections.map((section) => `${subjectById[section.subject_id]?.name ?? "Materia"} · ${section.section} · ${userById[teacherById[section.teacher_id]?.user_id]?.full_name ?? "Docente"} · ${periodById[section.academic_period_id]?.name ?? "Período"}`)}>
              <form className="grid gap-3 md:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); void runCreate("section", async () => { const created = await createCourseSection(token!, { subject_id: String(form.get("subject_id")), teacher_id: String(form.get("teacher_id")), academic_period_id: String(form.get("academic_period_id")), section: String(form.get("section")), semester: String(form.get("semester")) || undefined, is_active: true }); setSections((current) => [created, ...current]); formElement.reset(); }); }}>
                <SelectField label="Materia" name="subject_id" options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))} /><SelectField label="Docente" name="teacher_id" options={teachers.map((teacher) => ({ value: teacher.id, label: userById[teacher.user_id]?.full_name ?? teacher.employee_code ?? "Docente" }))} /><SelectField label="Período" name="academic_period_id" options={periods.map((period) => ({ value: period.id, label: period.name }))} /><Field label="Paralelo" name="section" required /><Field label="Semestre" name="semester" /><SubmitButton disabled={saving === "section" || !subjects.length || !teachers.length || !periods.length} label="Crear curso" />
              </form>
            </ResourceCard></div>
          </div>
        )}
      </section>
    </main>
  );
}

function ResourceCard({ title, items, children }: { title: string; items: string[]; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-stone-200 p-5"><h2 className="text-lg font-bold">{title}</h2><div className="mt-4">{children}</div><ul className="mt-5 max-h-40 divide-y overflow-y-auto rounded-xl bg-stone-50 px-3">{items.map((item, index) => <li className="py-2 text-sm" key={`${item}-${index}`}>{item}</li>)}{!items.length ? <li className="py-3 text-sm text-stone-500">Sin registros.</li> : null}</ul></section>;
}

function Field({ label, name, required = false, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return <label className="text-xs font-semibold text-stone-600">{label}<input className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" name={name} required={required} type={type} /></label>;
}

function SelectField({ label, name, options }: { label: string; name: string; options: Array<{ value: string; label: string }> }) {
  return <label className="text-xs font-semibold text-stone-600">{label}<select className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" name={name} required><option value="">Seleccionar…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function SubmitButton({ label, disabled }: { label: string; disabled: boolean }) {
  return <button className="self-end rounded-lg bg-amber-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={disabled} type="submit">{disabled ? "Guardando…" : label}</button>;
}
