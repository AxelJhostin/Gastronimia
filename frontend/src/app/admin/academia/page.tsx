'use client';

import { useEffect, useState } from 'react';
import {
  adminApi,
  AcademicPeriod,
  Subject,
  Laboratory,
  TeacherProfile,
  AdminUser,
} from '@/lib/api/admin';

export default function AdminAcademiaPage() {
  const [activeTab, setActiveTab] = useState<'periods' | 'subjects' | 'labs' | 'teachers'>('periods');

  // Listas
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Form State
  const [periodForm, setPeriodForm] = useState<AcademicPeriod>({ code: '', name: '', start_date: '', end_date: '', is_active: true });
  const [subjectForm, setSubjectForm] = useState<Subject>({ code: '', name: '' });
  const [labForm, setLabForm] = useState<Laboratory>({ code: '', name: '', location: '' });
  const [teacherForm, setTeacherForm] = useState<TeacherProfile>({ user_id: '', employee_code: '' });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [p, s, l, t, u] = await Promise.all([
        adminApi.getPeriods(),
        adminApi.getSubjects(),
        adminApi.getLaboratories(),
        adminApi.getTeachers(),
        adminApi.getUsers(),
      ]);
      setPeriods(p);
      setSubjects(s);
      setLabs(l);
      setTeachers(t);
      setUsers(u);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.createPeriod(periodForm);
      setPeriodForm({ code: '', name: '', start_date: '', end_date: '', is_active: true });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.createTeacher(teacherForm);
      setTeacherForm({ user_id: '', employee_code: '' });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Módulo de Administración Académica</h1>
        <p className="text-sm text-stone-500">Configura períodos, asignaturas, espacios/talleres y perfiles docentes.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('periods')}
          className={`pb-2 ${activeTab === 'periods' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Períodos Académicos
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-2 ${activeTab === 'subjects' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Materias
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-2 ${activeTab === 'labs' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Laboratorios / Cocinas
        </button>
        <button
          onClick={() => setActiveTab('teachers')}
          className={`pb-2 ${activeTab === 'teachers' ? 'border-b-2 border-amber-700 text-amber-800' : 'text-stone-500'}`}
        >
          Perfiles Docentes
        </button>
      </div>

      {/* Contenido Períodos */}
      {activeTab === 'periods' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreatePeriod} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm">
            <h3 className="font-bold text-stone-800">Nuevo Período</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Código</label>
              <input
                type="text"
                required
                value={periodForm.code}
                onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: 2026-1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nombre</label>
              <input
                type="text"
                required
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: Semestre 2026 - I"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  required
                  value={periodForm.start_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Fecha Fin</label>
                <input
                  type="date"
                  required
                  value={periodForm.end_date}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white py-2 rounded-lg font-semibold hover:bg-amber-800"
            >
              Guardar Período
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Fechas</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold">{p.code}</td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3 text-xs text-stone-500">{p.start_date} a {p.end_date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido Perfiles Docentes */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateTeacher} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm">
            <h3 className="font-bold text-stone-800">Vincular Docente</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Seleccionar Usuario</label>
              <select
                required
                value={teacherForm.user_id}
                onChange={(e) => setTeacherForm({ ...teacherForm, user_id: e.target.value })}
                className="w-full border rounded-lg p-2 text-stone-800"
              >
                <option value="">-- Seleccionar --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Código de Empleado / Ficha</label>
              <input
                type="text"
                required
                value={teacherForm.employee_code}
                onChange={(e) => setTeacherForm({ ...teacherForm, employee_code: e.target.value })}
                className="w-full border rounded-lg p-2"
                placeholder="Ej: DOC-9920"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white py-2 rounded-lg font-semibold hover:bg-amber-800"
            >
              Registrar Perfil Docente
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-100 text-xs text-stone-600 uppercase border-b">
                <tr>
                  <th className="p-3">Código Docente</th>
                  <th className="p-3">User ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3 font-semibold">{t.employee_code}</td>
                    <td className="p-3 font-mono text-xs text-stone-500">{t.user_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}