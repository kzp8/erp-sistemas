import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Award,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

export default function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente } = useErp();
  const { permissions } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: 'Madrid',
  });

  const [formError, setFormError] = useState('');

  const filteredClientes = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.dni.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.telefono && c.telefono.includes(term))
    );
  });

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      nombre: '',
      dni: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      dni: cliente.dni,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      ciudad: cliente.ciudad || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.dni.trim()) {
      setFormError('El nombre y el DNI/NIF son campos obligatorios.');
      return;
    }

    try {
      if (editingCliente) {
        await updateCliente({ ...editingCliente, ...formData });
      } else {
        await addCliente(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error al guardar cliente.');
    }
  };

  const handleDelete = (id, nombre) => {
    if (!permissions.canDeleteItems) {
      alert('Acceso restringido: Solo el Administrador tiene permiso para dar de baja registros de clientes.');
      return;
    }

    if (id === 'cli-5') {
      alert('No se puede eliminar el cliente genérico de Venta Mostrador.');
      return;
    }

    if (window.confirm(`¿Confirma la baja definitiva del cliente "${nombre}"?`)) {
      deleteCliente(id);
    }
  };

  return (
    <div className="space-y-3">
      {/* Barra de cabecera del módulo */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 04 · FICHERO MAESTRO DE CLIENTES
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Registro de terceros, facturación y acumulación de puntos de fidelización
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="erp-btn-primary px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Barra de herramientas y búsqueda */}
      <div className="bg-white border border-slate-400 p-2 flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
          Filtrar:
        </span>
        <div className="flex items-center gap-1.5 flex-1 border border-slate-400 bg-slate-50 px-2 py-1">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, DNI/NIF, Teléfono o Correo electrónico..."
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-slate-500 hover:text-slate-800 font-mono underline"
            >
              [Borrar filtro]
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Registros: {filteredClientes.length} / {clientes.length}
        </span>
      </div>

      {/* Cuadrícula de datos / Tabla de clientes */}
      <div className="erp-window border-slate-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Razón Social / Nombre</th>
                <th style={{ width: '12%' }}>NIF / CIF</th>
                <th style={{ width: '25%' }}>Datos de Contacto</th>
                <th style={{ width: '20%' }}>Domicilio Fiscal</th>
                <th className="text-center" style={{ width: '8%' }}>Puntos</th>
                <th className="text-right" style={{ width: '13%' }}>Volumen Ventas</th>
                <th className="text-center" style={{ width: '10%' }}>Operaciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500 font-mono text-xs">
                    NO EXISTEN REGISTROS DE CLIENTES QUE COINCIDAN CON EL CRITERIO DE BÚSQUEDA.
                  </td>
                </tr>
              ) : (
                filteredClientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-bold text-slate-900 block">
                        {c.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        F. Alta: {c.fechaAlta || '2026-01-01'}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-slate-800">
                      {c.dni}
                    </td>
                    <td>
                      <div className="text-slate-700 text-[11px] font-mono">
                        {c.email}
                      </div>
                      <div className="text-slate-500 text-[11px] font-mono">
                        Tel: {c.telefono || 'N/A'}
                      </div>
                    </td>
                    <td className="text-[11px] text-slate-700">
                      <div>{c.direccion || 'Sin dirección registrada'}</div>
                      <div className="text-slate-500 text-[10px]">{c.ciudad || 'Madrid'}</div>
                    </td>
                    <td className="text-center">
                      <span className="px-1.5 py-0.5 border border-slate-400 bg-slate-100 font-mono text-[11px] font-bold text-slate-800">
                        {c.puntosFidelidad || 0} pts
                      </span>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {(c.totalGastado || 0).toFixed(2)} €
                    </td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(c)}
                          className="erp-btn px-1.5 py-0.5 text-[10px]"
                          title="Modificar registro"
                        >
                          <Edit2 className="w-3 h-3 text-slate-700" />
                          <span>Mod</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.nombre)}
                          disabled={!permissions.canDeleteItems}
                          className={`px-1.5 py-0.5 border text-[10px] font-bold font-mono transition ${
                            permissions.canDeleteItems
                              ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
                              : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                          title={
                            permissions.canDeleteItems
                              ? 'Dar de baja'
                              : 'Solo Administrador'
                          }
                        >
                          <Trash2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventana de Diálogo / Modal para Crear / Editar Cliente */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            {/* Barra de título clásica */}
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>{editingCliente ? 'EDICIÓN DE FICHA DE CLIENTE' : 'ALTA DE NUEVO CLIENTE'}</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white px-1.5 py-0.2 bg-slate-800 border border-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3 bg-slate-50">
              {formError && (
                <div className="p-2 bg-red-100 border border-red-400 text-red-800 text-xs font-mono">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Nombre Completo / Razón Social (*):
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Marcos Pérez Gómez"
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    NIF / DNI / CIF (*):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="12345678Z"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Teléfono Contacto:
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="600 000 000"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Correo Electrónico (Facturación):
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Dirección Postal:
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle Mayor 1, 2ºA"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Población / Provincia:
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    placeholder="Madrid"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="erp-btn border-slate-400 text-slate-700 uppercase font-mono text-xs"
                >
                  Cancelar [Esc]
                </button>
                <button
                  type="submit"
                  className="erp-btn-primary uppercase font-mono text-xs font-bold px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCliente ? 'Guardar Modificación' : 'Confirmar Alta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
