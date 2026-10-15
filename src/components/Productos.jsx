import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  Shirt,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Filter,
  Check,
} from 'lucide-react';

export default function Productos() {
  const { productos, addProducto, updateProducto, deleteProducto } = useErp();
  const { permissions } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    categoria: 'Camisetas',
    temporada: 'Primavera/Verano 2026',
    precioCompra: '',
    precioVenta: '',
    stock: '',
    tallas: 'S, M, L, XL',
    colores: 'Negro, Blanco',
    descripcion: '',
  });

  const [formError, setFormError] = useState('');

  const categorias = [
    'Todas',
    'Camisetas',
    'Pantalones',
    'Vestidos',
    'Chaquetas',
    'Sudaderas',
    'Calzado',
    'Accesorios',
  ];

  const filteredProductos = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'Todas' || p.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `MOD-${Math.floor(100 + Math.random() * 900)}`,
      nombre: '',
      categoria: 'Camisetas',
      temporada: 'Primavera/Verano 2026',
      precioCompra: '10.00',
      precioVenta: '24.99',
      stock: '15',
      tallas: 'S, M, L, XL',
      colores: 'Negro, Blanco',
      descripcion: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      temporada: p.temporada || 'Básicos Continuos',
      precioCompra: p.precioCompra,
      precioVenta: p.precioVenta,
      stock: p.stock,
      tallas: Array.isArray(p.tallas) ? p.tallas.join(', ') : p.tallas,
      colores: Array.isArray(p.colores) ? p.colores.join(', ') : p.colores,
      descripcion: p.descripcion || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.precioVenta) {
      setFormError('El nombre y el precio de venta son campos obligatorios.');
      return;
    }

    try {
      if (editingProduct) {
        await updateProducto({ ...editingProduct, ...formData });
      } else {
        await addProducto(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error al guardar prenda.');
    }
  };

  const handleDelete = (id, nombre) => {
    if (!permissions.canDeleteItems) {
      alert('Solo el perfil Administrador tiene permisos para dar de baja referencias del inventario.');
      return;
    }
    if (window.confirm(`¿Confirma la eliminación de la prenda "${nombre}" del catálogo?`)) {
      deleteProducto(id);
    }
  };

  return (
    <div className="space-y-3">
      {/* Cabecera del catálogo */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 03 · MAESTRO DE PRODUCTOS E INVENTARIO
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Control de referencias de confección, tallas, colores, PVP y existencias en almacén
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="erp-btn-primary px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Prenda</span>
        </button>
      </div>

      {/* Barra de herramientas y filtros */}
      <div className="bg-white border border-slate-400 p-2 flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
            Buscar:
          </span>
          <div className="flex items-center gap-1.5 flex-1 border border-slate-400 bg-slate-50 px-2 py-1">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, Referencia SKU o descripción..."
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-mono underline"
              >
                [Limpiar]
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
            Categoría:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-slate-400 px-2 py-1 text-slate-800 focus:outline-none font-mono"
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>
          <span className="text-[11px] font-mono text-slate-500 pl-2">
            Uds: {filteredProductos.length}
          </span>
        </div>
      </div>

      {/* Tabla de Artículos / Cuadrícula de inventario */}
      <div className="erp-window border-slate-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Código SKU</th>
                <th style={{ width: '25%' }}>Descripción de la Prenda</th>
                <th style={{ width: '13%' }}>Familia / Cat.</th>
                <th style={{ width: '16%' }}>Matriz Tallas</th>
                <th style={{ width: '12%' }}>Gama Color</th>
                {permissions.canViewCostsAndProfits && (
                  <th className="text-right" style={{ width: '9%' }}>Coste</th>
                )}
                <th className="text-right" style={{ width: '10%' }}>PVP (IVA Inc.)</th>
                <th className="text-center" style={{ width: '8%' }}>Stock</th>
                <th className="text-center" style={{ width: '8%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-6 text-center text-slate-500 font-mono text-xs">
                    NO EXISTEN ARTÍCULOS QUE CUMPLAN EL FILTRO INDICADO.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((p) => {
                  const isStockLow = p.stock <= 5;
                  const tallasArray = Array.isArray(p.tallas)
                    ? p.tallas
                    : p.tallas ? p.tallas.split(',') : [];
                  const coloresArray = Array.isArray(p.colores)
                    ? p.colores
                    : p.colores ? p.colores.split(',') : [];

                  return (
                    <tr key={p.id}>
                      <td className="font-mono text-[11px] font-bold text-slate-800">
                        {p.sku}
                      </td>
                      <td>
                        <span className="font-bold text-slate-900 block">
                          {p.nombre}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.temporada}
                        </span>
                      </td>
                      <td className="font-mono text-[11px] text-slate-700 uppercase">
                        {p.categoria}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {tallasArray.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-1 py-0.2 bg-slate-200 border border-slate-300 text-slate-800 font-mono text-[10px] font-bold"
                            >
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-[11px] text-slate-600 font-mono">
                        {coloresArray.map((c) => c.trim()).join(', ')}
                      </td>

                      {permissions.canViewCostsAndProfits && (
                        <td className="text-right font-mono text-slate-600 text-[11px]">
                          {parseFloat(p.precioCompra).toFixed(2)} €
                        </td>
                      )}

                      <td className="text-right font-mono font-bold text-slate-900 text-xs">
                        {parseFloat(p.precioVenta).toFixed(2)} €
                      </td>

                      <td className="text-center">
                        <span
                          className={`inline-block px-1.5 py-0.2 border font-mono font-bold text-[11px] ${
                            isStockLow
                              ? 'bg-red-100 text-red-800 border-red-400'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      <td className="text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="erp-btn px-1.5 py-0.5 text-[10px]"
                            title="Editar artículo"
                          >
                            <Edit2 className="w-3 h-3 text-slate-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.nombre)}
                            disabled={!permissions.canDeleteItems}
                            className={`px-1.5 py-0.5 border text-[10px] font-bold font-mono transition ${
                              permissions.canDeleteItems
                                ? 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
                                : 'border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                            title={
                              permissions.canDeleteItems
                                ? 'Eliminar prenda'
                                : 'Solo Administrador'
                            }
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Prenda */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>{editingProduct ? 'MODIFICACIÓN DE FICHA DE PRENDA' : 'ALTA DE NUEVA REFERENCIA EN CATÁLOGO'}</span>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Descripción / Modelo (*):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Pantalón Chino Regular Fit Algodón"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Código SKU (*):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Familia / Categoría:
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  >
                    {categorias.filter((c) => c !== 'Todas').map((c) => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Campaña / Temporada:
                  </label>
                  <select
                    value={formData.temporada}
                    onChange={(e) => setFormData({ ...formData, temporada: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  >
                    <option value="Primavera/Verano 2026">Primavera/Verano 2026</option>
                    <option value="Otoño/Invierno">Otoño/Invierno</option>
                    <option value="Básicos Continuos">Básicos Continuos</option>
                    <option value="Rebajas / Outlet">Rebajas / Outlet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Precio Compra (€):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precioCompra}
                    onChange={(e) => setFormData({ ...formData, precioCompra: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    PVP Venta (€) (*):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Existencias Almacén:
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Tallas Comerciales (separadas por coma):
                  </label>
                  <input
                    type="text"
                    value={formData.tallas}
                    onChange={(e) => setFormData({ ...formData, tallas: e.target.value })}
                    placeholder="XS, S, M, L, XL, XXL"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Gama de Colores (separados por coma):
                  </label>
                  <input
                    type="text"
                    value={formData.colores}
                    onChange={(e) => setFormData({ ...formData, colores: e.target.value })}
                    placeholder="Negro, Blanco, Azul Denim"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
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
                  <span>{editingProduct ? 'Guardar Cambios' : 'Registrar en Inventario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
