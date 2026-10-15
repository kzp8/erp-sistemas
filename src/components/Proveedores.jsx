import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  PackagePlus,
  Search,
  Phone,
  Mail,
  Building,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

export default function Proveedores() {
  const { proveedores, compras, productos, addProveedor, updateProveedor, deleteProveedor, registrarCompra } = useErp();
  const { permissions } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('proveedores');

  const [isProvModalOpen, setIsProvModalOpen] = useState(false);
  const [editingProv, setEditingProv] = useState(null);
  const [provForm, setProvForm] = useState({
    cif: '',
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    ciudad: '',
    categoria: 'Textil y Confección',
  });

  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [selectedProvId, setSelectedProvId] = useState('');
  const [compraItems, setCompraItems] = useState([
    { productoId: '', cantidad: 10, precioUnitario: 10 },
  ]);

  const filteredProveedores = proveedores.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      p.cif.toLowerCase().includes(term) ||
      p.contacto.toLowerCase().includes(term)
    );
  });

  const openCreateProv = () => {
    setEditingProv(null);
    setProvForm({
      cif: '',
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      ciudad: '',
      categoria: 'Textil y Confección',
    });
    setIsProvModalOpen(true);
  };

  const openEditProv = (p) => {
    setEditingProv(p);
    setProvForm({
      cif: p.cif,
      nombre: p.nombre,
      contacto: p.contacto,
      telefono: p.telefono,
      email: p.email,
      ciudad: p.ciudad || '',
      categoria: p.categoria || 'Textil',
    });
    setIsProvModalOpen(true);
  };

  const handleSaveProv = (e) => {
    e.preventDefault();
    if (!provForm.nombre.trim() || !provForm.cif.trim()) {
      alert('Nombre y CIF son campos obligatorios');
      return;
    }
    if (editingProv) {
      updateProveedor({ ...editingProv, ...provForm });
    } else {
      addProveedor(provForm);
    }
    setIsProvModalOpen(false);
  };

  const handleDeleteProv = (id, nombre) => {
    if (!permissions.canManageSuppliers) {
      alert('Solo el Administrador puede gestionar proveedores.');
      return;
    }
    if (window.confirm(`¿Confirma la baja del proveedor "${nombre}"?`)) {
      deleteProveedor(id);
    }
  };

  const handleAddCompraLine = () => {
    setCompraItems([...compraItems, { productoId: '', cantidad: 10, precioUnitario: 10 }]);
  };

  const handleRemoveCompraLine = (index) => {
    const newItems = [...compraItems];
    newItems.splice(index, 1);
    setCompraItems(newItems);
  };

  const handleCompraLineChange = (index, field, value) => {
    const newItems = [...compraItems];
    newItems[index][field] = value;
    if (field === 'productoId') {
      const prod = productos.find((p) => p.id === value);
      if (prod) {
        newItems[index].precioUnitario = prod.precioCompra;
      }
    }
    setCompraItems(newItems);
  };

  const handleSaveCompra = async (e) => {
    e.preventDefault();
    if (!selectedProvId) {
      alert('Seleccione un proveedor');
      return;
    }

    const articulosValidos = compraItems
      .filter((it) => it.productoId)
      .map((it) => {
        const prod = productos.find((p) => p.id === it.productoId);
        return {
          productoId: it.productoId,
          nombre: prod ? prod.nombre : 'Prenda',
          cantidad: parseInt(it.cantidad, 10) || 1,
          precioUnitario: parseFloat(it.precioUnitario) || 0,
          subtotal: (parseInt(it.cantidad, 10) || 1) * (parseFloat(it.precioUnitario) || 0),
        };
      });

    if (articulosValidos.length === 0) {
      alert('Debe seleccionar al menos una prenda para el pedido.');
      return;
    }

    try {
      await registrarCompra({
        proveedorId: selectedProvId,
        articulos: articulosValidos,
      });

      alert('Pedido registrado con éxito. Las unidades han sido añadidas al stock real.');
      setIsCompraModalOpen(false);
      setActiveTab('compras');
    } catch (err) {
      console.error('Error al registrar compra:', err);
      alert('Error al registrar compra: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Cabecera */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 07 · PROVEEDORES TEXTILES Y ALBARANES DE COMPRA
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Control de fabricantes, distribuidores mayoristas y albaranes de entrada a almacén
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedProvId(proveedores[0]?.id || '');
              setCompraItems([{ productoId: productos[0]?.id || '', cantidad: 15, precioUnitario: productos[0]?.precioCompra || 10 }]);
              setIsCompraModalOpen(true);
            }}
            className="erp-btn-primary text-xs font-mono font-bold px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Albarán / Entrada Stock</span>
          </button>

          <button
            type="button"
            onClick={openCreateProv}
            className="erp-btn border-slate-400 text-slate-800 text-xs font-mono font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Submódulo */}
      <div className="flex border-b border-slate-400 gap-1 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('proveedores')}
          className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-t border-l border-r transition ${
            activeTab === 'proveedores'
              ? 'bg-white text-slate-900 border-slate-400 -mb-[1px] pb-2'
              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Directorio de Proveedores ({proveedores.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compras')}
          className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border-t border-l border-r transition ${
            activeTab === 'compras'
              ? 'bg-white text-slate-900 border-slate-400 -mb-[1px] pb-2'
              : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-100'
          }`}
        >
          Diario de Entradas de Mercancía ({compras.length})
        </button>
      </div>

      {/* Pestaña Proveedores */}
      {activeTab === 'proveedores' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-400 p-2 flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-slate-600 uppercase">
              Buscar:
            </span>
            <div className="flex items-center gap-1.5 flex-1 border border-slate-400 bg-slate-50 px-2 py-1">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por Razón Social, CIF o Contacto..."
                className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Registros: {filteredProveedores.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredProveedores.map((prov) => (
              <div
                key={prov.id}
                className="bg-white border border-slate-400 p-3 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1 border border-slate-300">
                      CIF: {prov.cif}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 uppercase">
                      {prov.categoria}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 uppercase font-mono">{prov.nombre}</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">Contacto: {prov.contacto}</p>

                  <div className="mt-2 text-[11px] font-mono text-slate-700 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{prov.telefono}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{prov.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{prov.ciudad || 'España'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    PLAZO ENTREGA: 48H
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditProv(prov)}
                      className="erp-btn px-1.5 py-0.5 text-[10px]"
                      title="Editar ficha"
                    >
                      <Edit2 className="w-3 h-3 text-slate-700" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProv(prov.id, prov.nombre)}
                      disabled={!permissions.canManageSuppliers}
                      className="px-1.5 py-0.5 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-mono disabled:opacity-30"
                      title="Dar de baja"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña Compras */}
      {activeTab === 'compras' && (
        <div className="erp-window border-slate-400 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Nº Albarán / Pedido</th>
                  <th style={{ width: '12%' }}>Fecha Entrada</th>
                  <th style={{ width: '25%' }}>Proveedor Textil</th>
                  <th style={{ width: '30%' }}>Mercancía e Incremento de Stock</th>
                  <th className="text-right" style={{ width: '10%' }}>Coste Total</th>
                  <th className="text-center" style={{ width: '8%' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((comp) => (
                  <tr key={comp.id}>
                    <td className="font-mono font-bold text-slate-800">
                      {comp.numeroPedido}
                    </td>
                    <td className="font-mono text-slate-600 text-[11px]">{comp.fecha}</td>
                    <td className="font-bold text-slate-900">{comp.proveedorNombre}</td>
                    <td>
                      <div className="space-y-0.5 text-[11px] font-mono">
                        {comp.articulos.map((art, idx) => (
                          <div key={idx}>
                            • {art.nombre} (<strong>+{art.cantidad} uds</strong>)
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900">
                      {parseFloat(comp.total).toFixed(2)} €
                    </td>
                    <td className="text-center">
                      <span className="px-1.5 py-0.2 border border-slate-400 bg-slate-100 font-mono text-[10px] font-bold text-slate-800">
                        RECIBIDO (+STOCK)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo Pedido de Reposición */}
      {isCompraModalOpen && (
        <div
          onClick={() => setIsCompraModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>ALBARÁN DE ENTRADA · REPOSICIÓN DE MERCANCÍA</span>
              <button
                type="button"
                onClick={() => setIsCompraModalOpen(false)}
                className="text-slate-300 hover:text-white px-1.5 py-0.2 bg-slate-800 border border-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompra} className="p-4 space-y-3 bg-slate-50">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Proveedor de Origen (*):
                </label>
                <select
                  value={selectedProvId}
                  onChange={(e) => setSelectedProvId(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                >
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {p.categoria} (CIF: {p.cif})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                    Líneas de Artículos a Recibir en Almacén:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCompraLine}
                    className="text-[11px] font-mono font-bold text-slate-700 underline hover:text-slate-900"
                  >
                    [+ Añadir Línea]
                  </button>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {compraItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2 border border-slate-300"
                    >
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.productoId}
                          onChange={(e) => handleCompraLineChange(idx, 'productoId', e.target.value)}
                          className="w-full text-xs border border-slate-400 p-1 bg-white font-mono"
                        >
                          <option value="">Seleccionar artículo...</option>
                          {productos.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.nombre} (SKU: {prod.sku} | Stock actual: {prod.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleCompraLineChange(idx, 'cantidad', e.target.value)}
                          placeholder="Uds"
                          className="w-full text-xs font-mono font-bold border border-slate-400 p-1 text-center"
                          title="Cantidad"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) => handleCompraLineChange(idx, 'precioUnitario', e.target.value)}
                          placeholder="Coste €"
                          className="w-full text-xs font-mono border border-slate-400 p-1 text-right"
                          title="Coste unitario"
                        />
                      </div>

                      {compraItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCompraLine(idx)}
                          className="text-red-700 hover:text-red-900 font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompraModalOpen(false)}
                  className="erp-btn border-slate-400 text-slate-700 uppercase font-mono text-xs"
                >
                  Cancelar [Esc]
                </button>
                <button
                  type="submit"
                  className="erp-btn-primary uppercase font-mono text-xs font-bold px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Validar Albarán y Actualizar Inventario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Proveedor */}
      {isProvModalOpen && (
        <div
          onClick={() => setIsProvModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>{editingProv ? 'MODIFICACIÓN FICHA PROVEEDOR' : 'ALTA DE PROVEEDOR TEXTIL'}</span>
              <button
                type="button"
                onClick={() => setIsProvModalOpen(false)}
                className="text-slate-300 hover:text-white px-1.5 py-0.2 bg-slate-800 border border-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProv} className="p-4 space-y-3 bg-slate-50">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Razón Social / Empresa (*):
                </label>
                <input
                  type="text"
                  required
                  value={provForm.nombre}
                  onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })}
                  placeholder="Ej: Distribuciones Denim SL"
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    CIF / NIF (*):
                  </label>
                  <input
                    type="text"
                    required
                    value={provForm.cif}
                    onChange={(e) => setProvForm({ ...provForm, cif: e.target.value })}
                    placeholder="B-12345678"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Sector / Categoría:
                  </label>
                  <select
                    value={provForm.categoria}
                    onChange={(e) => setProvForm({ ...provForm, categoria: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  >
                    <option value="Textil y Confección">Textil y Confección</option>
                    <option value="Pantalones y Denim">Pantalones y Denim</option>
                    <option value="Calzado y Complementos">Calzado y Complementos</option>
                    <option value="Paquetería y Bolsas">Paquetería y Bolsas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Persona de Contacto:
                  </label>
                  <input
                    type="text"
                    value={provForm.contacto}
                    onChange={(e) => setProvForm({ ...provForm, contacto: e.target.value })}
                    placeholder="Nombre representante"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Teléfono Centralita:
                  </label>
                  <input
                    type="text"
                    value={provForm.telefono}
                    onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
                    placeholder="91 000 00 00"
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Correo Electrónico (Pedidos):
                </label>
                <input
                  type="email"
                  value={provForm.email}
                  onChange={(e) => setProvForm({ ...provForm, email: e.target.value })}
                  placeholder="pedidos@proveedor.es"
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvModalOpen(false)}
                  className="erp-btn border-slate-400 text-slate-700 uppercase font-mono text-xs"
                >
                  Cancelar [Esc]
                </button>
                <button
                  type="submit"
                  className="erp-btn-primary uppercase font-mono text-xs font-bold px-3 py-1 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingProv ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
