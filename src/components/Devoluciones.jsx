import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  RotateCcw,
  Plus,
  Search,
  Printer,
  Check,
} from 'lucide-react';
import { tenantConfig } from '../config/tenantConfig';
import { imprimirTicketTermico } from '../utils/invoicePrinter';

export default function Devoluciones() {
  const { devoluciones, ventas, productos, registrarDevolucion } = useErp();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicketToPrint, setSelectedTicketToPrint] = useState(null);
  const [esTicketManual, setEsTicketManual] = useState(false);

  const [formData, setFormData] = useState({
    ticketOrigen: 'TCK-2026-001',
    clienteNombre: 'Elena Martínez Morales',
    tipo: 'Cambio de Talla',
    productoId: '',
    tallaDevuelta: 'M',
    nuevaTalla: 'S',
    motivo: 'Talla grande/pequeña',
    resolucion: 'Cambio directo de talla en mostrador',
    importe: 14.50,
    prendaDefectuosa: false,
  });

  const filteredDevoluciones = devoluciones.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.codigo.toLowerCase().includes(term) ||
      d.clienteNombre.toLowerCase().includes(term) ||
      d.ticketOrigen.toLowerCase().includes(term) ||
      d.producto.toLowerCase().includes(term)
    );
  });

  const handleTicketChange = (ticketNum) => {
    const ventaSel = ventas.find((v) => v.numeroTicket === ticketNum);
    if (ventaSel) {
      const primerItem = ventaSel.items?.[0];
      const prodItem = primerItem
        ? productos.find((p) => p.id === primerItem.productoId) ||
          productos.find((p) => p.nombre === primerItem.nombre) ||
          productos[0]
        : productos[0];

      const pTallas = prodItem
        ? (Array.isArray(prodItem.tallas)
            ? prodItem.tallas
            : prodItem.tallas?.split(',').map((t) => t.trim()).filter(Boolean) || ['M'])
        : ['M'];

      setFormData((prev) => ({
        ...prev,
        ticketOrigen: ticketNum,
        clienteNombre: ventaSel.clienteNombre || prev.clienteNombre,
        productoId: prodItem ? prodItem.id : prev.productoId,
        tallaDevuelta:
          primerItem?.talla && pTallas.includes(primerItem.talla)
            ? primerItem.talla
            : pTallas[0] || 'M',
        nuevaTalla: pTallas.length > 1 ? pTallas[1] || pTallas[0] : pTallas[0] || 'L',
        importe: primerItem
          ? primerItem.precioUnitario
          : (prodItem ? prodItem.precioVenta : prev.importe),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        ticketOrigen: ticketNum,
      }));
    }
  };

  const handleProductChange = (prodId) => {
    const prod = productos.find((p) => p.id === prodId);
    const pTallas = prod
      ? (Array.isArray(prod.tallas)
          ? prod.tallas
          : prod.tallas?.split(',').map((t) => t.trim()).filter(Boolean) || ['M'])
      : ['M'];

    setFormData((prev) => ({
      ...prev,
      productoId: prodId,
      importe: prod ? prod.precioVenta : prev.importe,
      tallaDevuelta: pTallas.includes(prev.tallaDevuelta) ? prev.tallaDevuelta : pTallas[0] || 'M',
      nuevaTalla: pTallas.length > 1 ? pTallas[1] || pTallas[0] : pTallas[0] || 'L',
    }));
  };

  const selectedProduct = productos.find((p) => p.id === formData.productoId);
  const tallasDisponibles = selectedProduct
    ? (Array.isArray(selectedProduct.tallas)
        ? selectedProduct.tallas
        : selectedProduct.tallas
        ? selectedProduct.tallas.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Única'])
    : ['XS', 'S', 'M', 'L', 'XL'];

  const handleOpenModal = () => {
    setEsTicketManual(false);
    const primerTicket = ventas[0];
    const primerItem = primerTicket?.items?.[0];
    const prodDef = primerItem
      ? productos.find((p) => p.id === primerItem.productoId) ||
        productos.find((p) => p.nombre === primerItem.nombre) ||
        productos[0]
      : productos[0];

    const pTallas = prodDef
      ? (Array.isArray(prodDef.tallas)
          ? prodDef.tallas
          : prodDef.tallas?.split(',').map((t) => t.trim()).filter(Boolean) || ['M'])
      : ['M'];

    setFormData({
      ticketOrigen: primerTicket?.numeroTicket || 'TCK-2026-001',
      clienteNombre: primerTicket?.clienteNombre || 'Cliente General',
      tipo: 'Cambio de Talla',
      productoId: prodDef?.id || '',
      tallaDevuelta:
        primerItem?.talla && pTallas.includes(primerItem.talla)
          ? primerItem.talla
          : pTallas[0] || 'M',
      nuevaTalla: pTallas.length > 1 ? pTallas[1] || pTallas[0] : pTallas[0] || 'L',
      motivo: 'Ajuste de talla en prenda de confección',
      resolucion: 'Sustitución de talla en caja',
      importe: primerItem ? primerItem.precioUnitario : (prodDef ? prodDef.precioVenta : 14.50),
      prendaDefectuosa: false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dev = await registrarDevolucion({
        ...formData,
        atendidoPor: user?.name || 'Dependiente Caja',
      });
      if (dev) {
        alert(`Operación completada. Código de resguardo: ${dev.codigo || dev.id}`);
        setIsModalOpen(false);
        setSelectedTicketToPrint(dev);
      }
    } catch (err) {
      console.error('Error al registrar devolución:', err);
      alert('Error al registrar devolución: ' + (err.message || 'Error desconocido'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Cabecera */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 06 · EXPEDIENTES DE CAMBIO DE TALLA Y DEVOLUCIONES
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Operativa de postventa de confección: permuta de tallas y emisión de vales canjeables
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="erp-btn-primary px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>F6 - Registrar Cambio / Vale</span>
        </button>
      </div>

      {/* Buscador */}
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
            placeholder="Filtrar por Código de Expediente (DEV-...), Ticket de Caja o Cliente..."
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
          />
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Registros: {filteredDevoluciones.length}
        </span>
      </div>

      {/* Tabla de Devoluciones */}
      <div className="erp-window border-slate-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Nº Expediente / Fecha</th>
                <th style={{ width: '13%' }}>Ticket Origen</th>
                <th style={{ width: '18%' }}>Cliente Titular</th>
                <th style={{ width: '14%' }}>Naturaleza</th>
                <th style={{ width: '18%' }}>Prenda Afectada</th>
                <th style={{ width: '10%' }}>Tallas (Ant &rarr; Nueva)</th>
                <th style={{ width: '18%' }}>Motivo y Resolución</th>
                <th className="text-center" style={{ width: '6%' }}>Impr</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevoluciones.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-slate-500 font-mono text-xs">
                    NO CONSTAN EXPEDIENTES DE CAMBIO O DEVOLUCIÓN REGISTRADOS.
                  </td>
                </tr>
              ) : (
                filteredDevoluciones.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-mono font-bold text-slate-800 block">
                        {d.codigo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{d.fecha}</span>
                    </td>
                    <td className="font-mono text-slate-700 text-[11px]">{d.ticketOrigen}</td>
                    <td className="font-bold text-slate-900">{d.clienteNombre}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-1.5 py-0.2 border border-slate-400 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 uppercase">
                          {d.tipo}
                        </span>
                        {d.tipo === 'Devolución con Vale' && (
                          d.estado === 'Canjeado' ? (
                            <span className="px-1.5 py-0.2 border border-slate-300 bg-slate-200 text-slate-600 font-mono text-[9px] font-bold uppercase">
                              CANJEADO ({d.ticketCanje || 'TCK'})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 border border-green-600 bg-green-50 text-green-800 font-mono text-[9px] font-bold uppercase">
                              ● VIGENTE ({Number(d.importe || 0).toFixed(2)} €)
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="font-medium text-slate-900">
                      <div>{d.producto}</div>
                      {d.prendaDefectuosa && (
                        <span className="inline-block px-1 py-0.2 bg-red-100 border border-red-300 text-red-800 text-[9px] font-mono font-bold uppercase mt-0.5">
                          ⚠ TARA / ROTURA (Sin reintegro a stock)
                        </span>
                      )}
                    </td>
                    <td>
                      {d.tipo === 'Cambio de Talla' ? (
                        <div className="font-mono text-xs">
                          <span className="line-through text-slate-500">{d.tallaDevuelta}</span>
                          <span className="mx-1 text-slate-700">&rarr;</span>
                          <strong className="text-slate-900">{d.nuevaTalla}</strong>
                        </div>
                      ) : (
                        <div className="font-mono text-[11px]">
                          <span className="text-slate-700">T.{d.tallaDevuelta}</span>
                          {d.importe !== undefined && (
                            <span className="ml-1 text-slate-900 font-bold">({Number(d.importe).toFixed(2)} €)</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="text-[11px]">
                      <div className="text-slate-800">{d.motivo}</div>
                      <div className="text-slate-500 text-[10px]">{d.resolucion}</div>
                    </td>
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketToPrint(d)}
                        className="erp-btn px-1.5 py-0.5 text-[10px]"
                        title="Imprimir resguardo fiscal"
                      >
                        <Printer className="w-3 h-3 text-slate-700" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Cambio o Devolución */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl border-2 border-slate-600 bg-white shadow-xl my-6"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide">
              <span>EXPEDICIÓN DE CAMBIO DE TALLA O VALE DE CAJA</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white px-1.5 py-0.2 bg-slate-800 border border-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[11px] font-bold text-slate-700 uppercase font-mono">
                      Ticket de Venta Origen (*):
                    </label>
                    <button
                      type="button"
                      onClick={() => setEsTicketManual(!esTicketManual)}
                      className="text-[10px] font-mono text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      {esTicketManual ? '« Elegir de lista' : 'Escribir manual »'}
                    </button>
                  </div>

                  {esTicketManual ? (
                    <input
                      type="text"
                      required
                      value={formData.ticketOrigen}
                      onChange={(e) => setFormData({ ...formData, ticketOrigen: e.target.value })}
                      placeholder="Ej: TCK-2026-001"
                      className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                    />
                  ) : (
                    <select
                      value={formData.ticketOrigen}
                      onChange={(e) => handleTicketChange(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-slate-900"
                    >
                      {ventas.length === 0 ? (
                        <option value="">No hay tickets registrados</option>
                      ) : (
                        ventas.map((v) => (
                          <option key={v.id || v.numeroTicket} value={v.numeroTicket}>
                            {v.numeroTicket} · {v.clienteNombre} ({Number(v.total || 0).toFixed(2)}€ - {v.fecha?.split(' ')[0]})
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                    Modalidad de Operación:
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-slate-900"
                  >
                    <option value="Cambio de Talla">Cambio Directo de Talla</option>
                    <option value="Devolución con Vale">Emisión de Vale de Tienda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Cliente Solicitante:
                </label>
                <input
                  type="text"
                  required
                  value={formData.clienteNombre}
                  onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Artículo / Prenda Objeto de Devolución:
                </label>
                <select
                  value={formData.productoId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono text-slate-900"
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (PVP: {p.precioVenta}€ | Stock disponible: {p.stock} uds)
                    </option>
                  ))}
                </select>
              </div>

              {formData.tipo === 'Cambio de Talla' ? (
                <div className="grid grid-cols-2 gap-3 border border-slate-400 bg-white p-2.5">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-0.5">
                      Talla Retirada / Devuelta:
                    </label>
                    <select
                      value={formData.tallaDevuelta}
                      onChange={(e) => setFormData({ ...formData, tallaDevuelta: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-center text-slate-900 cursor-pointer"
                    >
                      {tallasDisponibles.map((t) => (
                        <option key={`t-dev-${t}`} value={t}>
                          Talla {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-0.5">
                      Nueva Talla Entregada al Cliente:
                    </label>
                    <select
                      value={formData.nuevaTalla}
                      onChange={(e) => setFormData({ ...formData, nuevaTalla: e.target.value })}
                      className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-center text-slate-900 cursor-pointer"
                    >
                      {tallasDisponibles.map((t) => (
                        <option key={`t-nueva-${t}`} value={t}>
                          Talla {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-400 bg-white p-2.5 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-0.5">
                        Talla Retirada / Devuelta:
                      </label>
                      <select
                        value={formData.tallaDevuelta}
                        onChange={(e) => setFormData({ ...formData, tallaDevuelta: e.target.value })}
                        className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold text-center text-slate-900 cursor-pointer"
                      >
                        {tallasDisponibles.map((t) => (
                          <option key={`t-vale-${t}`} value={t}>
                            Talla {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-700 uppercase mb-0.5">
                        Importe del Vale (€):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.importe}
                        onChange={(e) => setFormData({ ...formData, importe: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-400 text-xs font-mono font-bold text-right text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Opción de prenda defectuosa / tara / rotura */}
              <div
                className={`p-2.5 border transition cursor-pointer ${
                  formData.prendaDefectuosa
                    ? 'border-red-600 bg-red-50'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    prendaDefectuosa: !prev.prendaDefectuosa,
                    motivo:
                      !prev.prendaDefectuosa && (!prev.motivo || prev.motivo.includes('Ajuste') || prev.motivo.includes('Talla'))
                        ? 'Tara de fábrica / Prenda rota o inservible'
                        : prev.motivo,
                  }))
                }
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="chk-prenda-defectuosa"
                    checked={formData.prendaDefectuosa}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        prendaDefectuosa: e.target.checked,
                        motivo:
                          e.target.checked && (!prev.motivo || prev.motivo.includes('Ajuste') || prev.motivo.includes('Talla'))
                            ? 'Tara de fábrica / Prenda rota o inservible'
                            : prev.motivo,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-400 text-red-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="chk-prenda-defectuosa"
                      className="font-bold text-xs text-slate-900 block font-mono cursor-pointer"
                    >
                      PRENDA DEFECTUOSA / TARA / ROTA (NO REINTEGRAR AL STOCK DE VENTA)
                    </label>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-mono leading-tight">
                      {formData.tipo === 'Cambio de Talla'
                        ? 'La prenda devuelta queda inservible: se entregará una nueva y el stock de almacén RESTARÁ 1 unidad (merma).'
                        : 'La prenda devuelta queda inservible: NO se sumará 1 unidad al stock para evitar que vuelva a ponerse a la venta.'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5 font-mono">
                  Causa / Justificación:
                </label>
                <input
                  type="text"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Ej: Inadecuación de tallaje tras prueba"
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-sans text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-end gap-2">
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
                  <span>Procesar en Mostrador</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resguardo Imprimible */}
      {selectedTicketToPrint && (
        <div
          onClick={() => setSelectedTicketToPrint(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md border-2 border-slate-600 bg-white p-5 font-mono text-xs shadow-xl my-6"
          >
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <h3 className="text-sm font-bold text-slate-900 uppercase">MODA URBAN S.L.</h3>
              <p className="text-[10px] text-slate-600">RESGUARDO OFICIAL DE CAMBIO / VALE</p>
              <div className="mt-1 font-bold text-slate-800">{selectedTicketToPrint.codigo}</div>
              <div className="text-[10px] text-slate-500">FECHA: {selectedTicketToPrint.fecha}</div>
            </div>

            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div><strong>Ticket Original:</strong> {selectedTicketToPrint.ticketOrigen}</div>
              <div><strong>Cliente:</strong> {selectedTicketToPrint.clienteNombre}</div>
              <div><strong>Operación:</strong> {selectedTicketToPrint.tipo}</div>
              <div><strong>Prenda:</strong> {selectedTicketToPrint.producto}</div>
              {selectedTicketToPrint.tipo === 'Cambio de Talla' ? (
                <div><strong>Permuta:</strong> Talla {selectedTicketToPrint.tallaDevuelta} &rarr; Talla {selectedTicketToPrint.nuevaTalla}</div>
              ) : (
                <div className="p-2 border border-slate-600 bg-slate-100 my-1 space-y-0.5">
                  <div className="text-center font-bold text-slate-900">
                    CÓDIGO DE VALE: {selectedTicketToPrint.codigo}
                  </div>
                  <div className="text-center font-bold text-green-700 text-sm">
                    VALOR: {parseFloat(selectedTicketToPrint.importe || 0).toFixed(2)} €
                  </div>
                  <div className="text-center text-[10px] text-slate-600">
                    ESTADO: {selectedTicketToPrint.estado === 'Canjeado' ? `CANJEADO EN ${selectedTicketToPrint.ticketCanje || ''}` : 'VIGENTE PARA CANJE EN CAJA'}
                  </div>
                </div>
              )}
              <div><strong>Atendido por:</strong> {selectedTicketToPrint.atendidoPor}</div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => imprimirTicketTermico(selectedTicketToPrint, tenantConfig)}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase font-mono flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Resguardo</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTicketToPrint(null)}
                className="erp-btn border-slate-400 text-slate-800 text-xs font-mono uppercase"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
