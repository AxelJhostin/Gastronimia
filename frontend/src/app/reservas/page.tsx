'use client';

import { useEffect, useState } from 'react';
import { reservationsApi, Space, SpaceReservation } from '@/lib/api/reservations';
import { adminApi, CourseSection } from '@/lib/api/admin';

export default function ReservasPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [reservations, setReservations] = useState<SpaceReservation[]>([]);

  // Filtro y formulario
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [spaceId, setSpaceId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [spData, secData, resData] = await Promise.all([
        reservationsApi.getSpaces(),
        adminApi.getSections(),
        reservationsApi.getReservations({ date: selectedDate }),
      ]);
      setSpaces(spData);
      setSections(secData);
      setReservations(resData);
    } catch (err: any) {
      console.error('Error al cargar reservas:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) {
      alert('Por favor selecciona un espacio.');
      return;
    }

    setLoading(true);
    try {
      await reservationsApi.createReservation({
        space_id: spaceId,
        section_id: sectionId || undefined,
        reservation_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        notes: notes.trim() || undefined,
      });

      setNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    try {
      await reservationsApi.cancelReservation(id);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reserva de Cocinas y Talleres</h1>
        <p className="text-sm text-stone-500">Consulta la disponibilidad de los laboratorios y programa tus clases.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Reserva */}
        <form onSubmit={handleCreateReservation} className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 text-sm shadow-sm">
          <h3 className="font-bold text-stone-800">Agendar Espacio</h3>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Fecha</label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-lg p-2 text-stone-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Cocina / Taller</label>
            <select
              required
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full border rounded-lg p-2 text-stone-800"
            >
              <option value="">-- Seleccionar Espacio --</option>
              {spaces.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name} ({sp.code}) - Cap: {sp.capacity}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Sección / Curso (Opcional)</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full border rounded-lg p-2 text-stone-800"
            >
              <option value="">-- Ninguno --</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-lg p-2 text-stone-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-stone-700">Hora Fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-lg p-2 text-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-stone-700">Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-lg p-2 text-stone-800"
              placeholder="Ej: Preparación de repostería avanzada"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-700 text-white py-2.5 rounded-lg font-semibold hover:bg-amber-800"
          >
            Confirmar Reserva
          </button>
        </form>

        {/* Cronograma / Reservas del día */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center">
            <h3 className="font-bold text-stone-800 text-sm">Reservas para el {selectedDate}</h3>
            <span className="text-xs text-stone-500 font-medium">{reservations.length} registro(s)</span>
          </div>

          <div className="divide-y divide-stone-200 text-sm">
            {reservations.length === 0 ? (
              <p className="p-8 text-center text-stone-500 text-xs">
                No hay reservas agendadas para esta fecha.
              </p>
            ) : (
              reservations.map((res) => {
                const spaceInfo = spaces.find((sp) => sp.id === res.space_id);
                return (
                  <div key={res.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{spaceInfo?.name || res.space_id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          {res.start_time} - {res.end_time}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-mono">Docente ID: {res.teacher_id}</p>
                      {res.notes && <p className="text-xs text-stone-600 italic">"{res.notes}"</p>}
                    </div>

                    {res.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancel(res.id)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}