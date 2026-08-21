'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { comprasService } from '@/services/compras.service';
import { CrearProveedorDTO } from '@/types/compras';

interface ProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProveedorModal({ isOpen, onClose }: ProveedorModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CrearProveedorDTO>({
    rnc: '',
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const mutation = useMutation({
    mutationFn: (data: CrearProveedorDTO) => comprasService.crearProveedor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
      setFormData({ rnc: '', nombre: '', contacto: '', telefono: '', email: '', direccion: '' });
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Registrar Proveedor</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">RNC / RIF / CUIT</label>
            <input
              type="text"
              required
              placeholder="Ej: 130-12345-1"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.rnc}
              onChange={(e) => setFormData({ ...formData, rnc: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre / Razón Social</label>
            <input
              type="text"
              required
              placeholder="Ej: Distribuidora Central"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Contacto</label>
              <input
                type="text"
                placeholder="Persona de contacto"
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.contacto}
                onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Teléfono</label>
              <input
                type="text"
                required
                placeholder="809-555-0000"
                className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
            <input
              type="email"
              required
              placeholder="correo@proveedor.com"
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Dirección</label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm focus:border-amber-500 focus:outline-none"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}