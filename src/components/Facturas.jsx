import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import {
  FileText,
  Search,
  Printer,
  Eye,
  CheckCircle,
  X,
  Plus,
  Edit3,
  Building2,
  Calendar,
  CreditCard,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { tenantConfig } from '../config/tenantConfig';
import { imprimirFacturaA4 } from '../utils/invoicePrinter';

export default function Facturas() {
  const {
    facturas,
    ventas,
    clientes,
    productos,
    generarFacturaDeVenta,
    crearFacturaDirecta,
    actualizarFactura,
  } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);

  // Formulario para Emitir Nueva Factura Directa
  const [newInvoiceData, setNewInvoiceData] = useState({
    clienteId: '',
    clienteNombre: '',
    clienteDni: '',
    clienteDireccion: '',
    clienteTelefono: '',
    clienteEmail: '',
    fecha: new Date().toISOString().split('T')[0],
    fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    formaPago: 'Transferencia Bancaria (30 días)',
    observaciones: 'Factura oficial emitida según condiciones comerciales acordadas.',
    items: [
      {
        codigo: 'PRENDA-01',
        descripcion: 'Prenda o Servicio Textil',
        cantidad: 1,
        precioUnitario: 39.99,
      },
    ],
  });

  const ventasSinFacturar = ventas.filter((v) => !v.facturada);

  const filteredFacturas = facturas.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      (f.numeroFactura && f.numeroFactura.toLowerCase().includes(term)) ||
      (f.clienteNombre && f.clienteNombre.toLowerCase().includes(term)) ||
      (f.clienteDni && f.clienteDni.toLowerCase().includes(term))
    );
  });

  // Manejo de selección de cliente existente en el creador
  const handleSelectClienteChange = (clienteId) => {
    if (!clienteId) {
      setNewInvoiceData((prev) => ({
        ...prev,
        clienteId: '',
        clienteNombre: '',
        clienteDni: '',
        clienteDireccion: '',
        clienteTelefono: '',
        clienteEmail: '',
      }));
      return;
    }
    const c = clientes.find((item) => item.id === clienteId);
    if (c) {
      setNewInvoiceData((prev) => ({
        ...prev,
        clienteId: c.id,
        clienteNombre: c.nombre || '',
        clienteDni: c.dni || '',
        clienteDireccion: c.direccion ? `${c.direccion}, ${c.ciudad || ''}` : '',
        clienteTelefono: c.telefono || '',
        clienteEmail: c.email || '',
      }));
    }
  };

  // Manejo de partidas de la nueva factura
  const handleItemChange = (index, field, value) => {
    setNewInvoiceData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const handleSelectProductForItem = (index, productoId) => {
    const prod = productos.find((p) => p.id === productoId);
    if (prod) {
      setNewInvoiceData((prev) => {
        const items = [...prev.items];
        items[index] = {
          ...items[index],
          codigo: prod.referencia || `ART-${index + 1}`,
          descripcion: `${prod.nombre} · ${prod.categoria || 'Moda'}`,
          precioUnitario: prod.pvp || 0,
        };
        return { ...prev, items };
      });
    }
  };

  const handleAddItem = () => {
    setNewInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          codigo: `ART-${prev.items.length + 1}`,
          descripcion: '',
          cantidad: 1,
          precioUnitario: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (newInvoiceData.items.length <= 1) {
      alert('La factura debe contener al menos un concepto.');
      return;
    }
    setNewInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Cálculos de totales para la nueva factura
  const taxRate = tenantConfig.pos.defaultTaxRate || 21;
  const newSubtotalTotal = newInvoiceData.items.reduce((acc, it) => {
    const qty = Number(it.cantidad) || 0;
    const price = Number(it.precioUnitario) || 0;
    return acc + qty * price;
  }, 0);
  const newBaseImponible = Number((newSubtotalTotal / (1 + taxRate / 100)).toFixed(2));
  const newIvaCuota = Number((newSubtotalTotal - newBaseImponible).toFixed(2));

  // Guardar y emitir factura directa
  const handleEmitirFacturaSubmit = async (e) => {
    e.preventDefault();
    if (!newInvoiceData.clienteNombre.trim()) {
      alert('Indique el nombre o razón social del cliente.');
      return;
    }

    const itemsCalculados = newInvoiceData.items.map((it) => {
      const qty = Number(it.cantidad) || 1;
      const unit = Number(it.precioUnitario) || 0;
      return {
        codigo: it.codigo || 'CONCEPTO',
        descripcion: it.descripcion || 'Artículo / Servicio',
        cantidad: qty,
        precioUnitario: unit,
        total: Number((qty * unit).toFixed(2)),
      };
    });

    const creada = await crearFacturaDirecta({
      ...newInvoiceData,
      items: itemsCalculados,
      baseImponible: newBaseImponible,
      ivaPorcentaje: taxRate,
      ivaCuota: newIvaCuota,
      total: Number(newSubtotalTotal.toFixed(2)),
    });

    if (creada) {
      setIsNewModalOpen(false);
      setSelectedFactura(creada);
    }
  };

  // Guardar edición de datos fiscales en una factura existente
  const handleGuardarEdicionFiscal = async (e) => {
    e.preventDefault();
    if (!editingFactura) return;

    await actualizarFactura(editingFactura.id, {
      clienteNombre: editingFactura.clienteNombre,
      clienteDni: editingFactura.clienteDni,
      clienteDireccion: editingFactura.clienteDireccion,
      clienteTelefono: editingFactura.clienteTelefono,
      clienteEmail: editingFactura.clienteEmail,
      formaPago: editingFactura.formaPago,
      observaciones: editingFactura.observaciones,
    });

    setSelectedFactura((prev) => (prev?.id === editingFactura.id ? { ...prev, ...editingFactura } : prev));
    setEditingFactura(null);
  };

  return (
    <div className="space-y-3">
      {/* Cabecera Principal */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 05 · LIBRO DE FACTURACIÓN MERCANTIL
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Expedición de facturas oficiales con validez legal (RD 1619/2012), desglose impositivo y soporte A4
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="erp-btn-primary font-mono text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Emitir Nueva Factura</span>
        </button>
      </div>

      {/* Comprobantes de caja pendientes de conversión a factura formal */}
      {ventasSinFacturar.length > 0 && (
        <div className="bg-slate-100 border border-slate-400 p-2.5">
          <div className="text-[11px] font-mono font-bold text-slate-800 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>TICKETS DE CAJA PENDIENTES DE CONVERSIÓN A FACTURA ({ventasSinFacturar.length})</span>
            </span>
            <span className="text-slate-500 text-[10px]">SOLICITUD DE CLIENTE</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {ventasSinFacturar.map((v) => (
              <div
                key={v.id}
                className="bg-white p-2 border border-slate-300 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-slate-800">{v.numeroTicket}</div>
                  <div className="text-[11px] text-slate-600">{v.clienteNombre}</div>
                  <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                    {v.total.toFixed(2)} {tenantConfig.pos.currencySymbol}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const fac = await generarFacturaDeVenta(v.id);
                    if (fac) setSelectedFactura(fac);
                  }}
                  className="erp-btn-primary text-[10px] font-mono uppercase font-bold px-2 py-1 cursor-pointer shadow-xs"
                >
                  Facturar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Filtro y Búsqueda */}
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
            placeholder="Filtrar por Nº Factura (FAC-...), Cliente o NIF/CIF..."
            className="w-full text-xs text-slate-800 bg-transparent focus:outline-none font-mono"
          />
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Facturas Registradas: {filteredFacturas.length}
        </span>
      </div>

      {/* Tabla Cuadrícula de Facturas */}
      <div className="erp-window border-slate-400 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Serie / Nº Factura</th>
                <th style={{ width: '12%' }}>Fecha Emisión</th>
                <th style={{ width: '25%' }}>Titular Fiscal (Cliente)</th>
                <th style={{ width: '12%' }}>NIF / CIF</th>
                <th className="text-right" style={{ width: '12%' }}>Base Imponible</th>
                <th className="text-right" style={{ width: '10%' }}>IVA ({taxRate}%)</th>
                <th className="text-right" style={{ width: '12%' }}>Total</th>
                <th className="text-center" style={{ width: '8%' }}>Estado</th>
                <th className="text-center" style={{ width: '10%' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-6 text-center text-slate-500 font-mono text-xs">
                    NO HAY FACTURAS REGISTRADAS QUE COINCIDAN CON EL FILTRO.
                  </td>
                </tr>
              ) : (
                filteredFacturas.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono font-bold text-slate-800">
                      {f.numeroFactura}
                    </td>
                    <td className="font-mono text-slate-600 text-[11px]">{f.fecha}</td>
                    <td>
                      <div className="font-bold text-slate-900">{f.clienteNombre}</div>
                      {f.ticketOrigen && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Ref: {f.ticketOrigen}
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-[11px] text-slate-700">{f.clienteDni || '---'}</td>
                    <td className="text-right font-mono text-slate-700">
                      {parseFloat(f.baseImponible || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                    </td>
                    <td className="text-right font-mono text-slate-700">
                      {parseFloat(f.ivaCuota || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                    </td>
                    <td className="text-right font-bold font-mono text-slate-900">
                      {parseFloat(f.total || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                    </td>
                    <td className="text-center">
                      <span className="px-1.5 py-0.2 border border-slate-400 bg-slate-100 font-mono text-[10px] font-bold text-slate-800">
                        {f.estado ? f.estado.toUpperCase() : 'COBRADA'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedFactura(f)}
                          className="erp-btn px-2 py-0.5 text-[10px] font-mono flex items-center gap-1"
                          title="Ver documento oficial A4"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => imprimirFacturaA4(f, tenantConfig)}
                          className="erp-btn px-2 py-0.5 text-[10px] font-mono flex items-center gap-1 text-slate-800 hover:text-slate-950"
                          title="Imprimir directamente en A4 o PDF oficial"
                        >
                          <Printer className="w-3 h-3 text-slate-600" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFactura(f)}
                          className="erp-btn px-1.5 py-0.5 text-[10px] font-mono text-slate-700 hover:text-slate-950"
                          title="Editar datos fiscales del destinatario"
                        >
                          <Edit3 className="w-3 h-3 text-slate-600" />
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

      {/* =========================================================================
          MODAL 1: FACTURA REAL ESTÁNDAR (FOLIO BLANCO A4 DE TODA LA VIDA)
          Completamente inmune al modo oscuro para entregar a clientes y gestorías
          ========================================================================= */}
      {selectedFactura && (
        <div
          onClick={() => setSelectedFactura(null)}
          className="fixed inset-0 z-50 real-invoice-backdrop flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto"
        >
          {/* Barra superior de herramientas flotante (Oculta al imprimir) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[840px] mb-3 bg-slate-900 border border-slate-700 text-slate-100 px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs shadow-2xl no-print rounded-xs"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-300" />
              <span className="font-bold text-white">DOCUMENTO: {selectedFactura.numeroFactura}</span>
              <span className="bg-emerald-900 text-emerald-200 border border-emerald-700 text-[10px] px-1.5 py-0.2 font-bold uppercase">
                {selectedFactura.estado ? selectedFactura.estado.toUpperCase() : 'COBRADA'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imprimirFacturaA4(selectedFactura, tenantConfig)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 border border-slate-300 shadow-sm cursor-pointer transition"
                title="Imprimir folio A4 o Guardar en PDF oficial"
              >
                <Printer className="w-3.5 h-3.5 text-slate-900" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingFactura(selectedFactura)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-600 flex items-center gap-1 cursor-pointer transition"
                title="Completar o editar NIF y Dirección fiscal del cliente"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Datos Fiscales</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFactura(null)}
                className="px-2 py-1 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-white font-bold border border-slate-700 cursor-pointer"
                title="Cerrar visor"
              >
                ✕
              </button>
            </div>
          </div>

          {/* FOLIO A4 REAL DE FACTURA (SIEMPRE BLANCO Y CON ALTO CONTRASTE) */}
          <div
            onClick={(e) => e.stopPropagation()}
            data-invoice-sheet="true"
            className="real-invoice-paper w-full max-w-[840px] my-2"
            style={{
              backgroundColor: '#ffffff',
              color: '#111827',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              boxSizing: 'border-box',
              padding: '36px 40px',
              minHeight: 'auto',
            }}
          >
            {/* CABECERA SUPERIOR: EMISOR (IZQ) Y TÍTULO FACTURA CON METADATOS (DER) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '20px',
                borderBottom: '2px solid #111827',
                gap: '24px',
              }}
            >
              {/* Bloque del Emisor (Nosotros) */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}
                >
                  DATOS FISCALES DEL EMISOR
                </div>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#111827',
                    margin: '0 0 4px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {tenantConfig.company.legalName}
                </h1>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#4b5563', margin: '0 0 10px 0' }}>
                  {tenantConfig.company.activity}
                </p>
                <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#374151' }}>
                  <div><strong>NIF / CIF:</strong> {tenantConfig.company.cif}</div>
                  <div><strong>Domicilio:</strong> {tenantConfig.company.address}</div>
                  <div><strong>Teléfono:</strong> {tenantConfig.company.phone} | <strong>Email:</strong> {tenantConfig.company.email}</div>
                  {tenantConfig.company.website && <div><strong>Web:</strong> {tenantConfig.company.website}</div>}
                </div>
              </div>

              {/* Bloque Título y Metadatos de la Factura */}
              <div style={{ textAlign: 'right', minWidth: '240px' }}>
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    color: '#111827',
                    letterSpacing: '-0.03em',
                    lineHeight: '1',
                    marginBottom: '12px',
                  }}
                >
                  FACTURA
                </div>
                <div
                  style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '3px' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Nº Factura:</span>
                    <strong style={{ color: '#111827' }}>{selectedFactura.numeroFactura}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '3px 0' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Fecha Emisión:</span>
                    <strong style={{ color: '#111827' }}>{selectedFactura.fecha}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', padding: '3px 0' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Vencimiento:</span>
                    <strong style={{ color: '#111827' }}>{selectedFactura.fechaVencimiento || selectedFactura.fecha}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '3px' }}>
                    <span style={{ color: '#6b7280', fontWeight: '500' }}>Forma de Pago:</span>
                    <strong style={{ color: '#111827', textTransform: 'uppercase' }}>{selectedFactura.formaPago || 'Contado'}</strong>
                  </div>
                  {selectedFactura.ticketOrigen && (
                    <div style={{ marginTop: '4px', paddingTop: '3px', borderTop: '1px dashed #d1d5db', fontSize: '11px', color: '#6b7280' }}>
                      Ticket de origen: <strong>{selectedFactura.ticketOrigen}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN CLIENTE: FACTURAR A */}
            <div
              style={{
                marginTop: '22px',
                padding: '16px 20px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '4px',
                }}
              >
                <span>FACTURAR A / DATOS DEL DESTINATARIO</span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>DOCUMENTO FISCAL VÁLIDO</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Nombre / Razón Social:</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{selectedFactura.clienteNombre}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>NIF / CIF / DNI:</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{selectedFactura.clienteDni || 'No especificado'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Domicilio Fiscal:</div>
                  <div style={{ color: '#374151' }}>{selectedFactura.clienteDireccion || 'Venta presencial en tienda'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>Contacto:</div>
                  <div style={{ color: '#374151' }}>
                    {selectedFactura.clienteTelefono && `Tel: ${selectedFactura.clienteTelefono} `}
                    {selectedFactura.clienteEmail && `| Email: ${selectedFactura.clienteEmail}`}
                    {!selectedFactura.clienteTelefono && !selectedFactura.clienteEmail && '---'}
                  </div>
                </div>
              </div>
            </div>

            {/* TABLA DE CONCEPTOS / ARTÍCULOS */}
            <div style={{ marginTop: '26px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderTop: '1px solid #d1d5db', borderBottom: '2px solid #111827' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '700', color: '#374151', width: '15%' }}>CÓDIGO</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', color: '#374151', width: '47%' }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', color: '#374151', textAlign: 'center', width: '10%' }}>CANT.</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', color: '#374151', textAlign: 'right', width: '14%' }}>PRECIO UD.</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', color: '#374151', textAlign: 'right', width: '14%' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFactura.items && selectedFactura.items.length > 0 ? (
                    selectedFactura.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '11px 12px', color: '#6b7280', fontFamily: 'monospace' }}>
                          {it.codigo || `ART-${idx + 1}`}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#111827', fontWeight: '500' }}>
                          {it.descripcion}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                          {it.cantidad}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#111827', textAlign: 'right' }}>
                          {parseFloat(it.precioUnitario).toFixed(2)} {tenantConfig.pos.currencySymbol}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#111827', textAlign: 'right', fontWeight: '700' }}>
                          {parseFloat(it.total).toFixed(2)} {tenantConfig.pos.currencySymbol}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                        Sin líneas de detalle en esta factura.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* SECCIÓN INFERIOR: CONDICIONES DE PAGO + TOTALES */}
            <div
              className="print-avoid-break"
              style={{
                marginTop: '26px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '28px',
              }}
            >
              {/* Información de Pago y Cuenta Bancaria */}
              <div
                style={{
                  flex: 1,
                  padding: '16px 18px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: '#4b5563',
                }}
              >
                <div style={{ fontWeight: '700', color: '#111827', textTransform: 'uppercase', marginBottom: '6px', fontSize: '11px' }}>
                  DATOS BANCARIOS PARA PAGO / TRANSFERENCIA
                </div>
                <div><strong>Entidad Bancaria:</strong> {tenantConfig.company.bank}</div>
                <div><strong>IBAN:</strong> {tenantConfig.company.iban}</div>
                <div><strong>Titular:</strong> {tenantConfig.company.legalName}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>
                  * Indicar en el concepto de la transferencia el número de factura: <strong>{selectedFactura.numeroFactura}</strong>
                </div>
                {selectedFactura.observaciones && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #d1d5db', fontStyle: 'italic' }}>
                    <strong>Observaciones:</strong> {selectedFactura.observaciones}
                  </div>
                )}
              </div>

              {/* Cuadro de Liquidación Tributaria y Totales */}
              <div style={{ width: '270px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
                  <span>Base Imponible:</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {parseFloat(selectedFactura.baseImponible || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>
                  <span>I.V.A. ({selectedFactura.ivaPorcentaje || taxRate}%):</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>
                    {parseFloat(selectedFactura.ivaCuota || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    marginTop: '10px',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #111827',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#111827',
                  }}
                >
                  <span>TOTAL FACTURA:</span>
                  <span style={{ fontSize: '18px' }}>
                    {parseFloat(selectedFactura.total || 0).toFixed(2)} {tenantConfig.pos.currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* PIE LEGAL OFICIAL Y REGISTRO MERCANTIL */}
            <div
              className="print-avoid-break"
              style={{
                marginTop: '44px',
                paddingTop: '16px',
                borderTop: '1px solid #d1d5db',
                textAlign: 'center',
                fontSize: '10px',
                lineHeight: '1.5',
                color: '#6b7280',
              }}
            >
              <div><strong>{tenantConfig.company.legalName}</strong> · CIF: {tenantConfig.company.cif}</div>
              <div>{tenantConfig.company.regData}</div>
              <div style={{ marginTop: '3px' }}>
                Factura expedida en cumplimiento del Real Decreto 1619/2012, de 30 de noviembre, por el que se aprueba el Reglamento de facturación.
              </div>
              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
                Protección de Datos: En cumplimiento del RGPD (UE 2016/679), los datos personales de facturación se incorporan a nuestros tratamientos contables y fiscales legalmente exigibles.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: FORMULARIO PARA EMITIR NUEVA FACTURA DIRECTA (B2B / MANUAL)
          ========================================================================= */}
      {isNewModalOpen && (
        <div
          onClick={() => setIsNewModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto no-print"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl border-2 border-slate-600 bg-white shadow-2xl erp-window max-h-[92vh] overflow-y-auto"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase font-mono">
              <span className="flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>NUEVA FACTURA MERCANTIL · FORMULARIO DE EMISIÓN</span>
              </span>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-300 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmitirFacturaSubmit} className="p-4 space-y-4 text-xs font-sans text-slate-800">
              {/* Sección 1: Datos del Destinatario */}
              <div className="p-3 border border-slate-300 bg-slate-50 space-y-3">
                <div className="font-mono font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>1. DATOS FISCALES DEL CLIENTE / RECEPTOR</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Seleccione un cliente registrado o rellene manualmente)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                      Cargar Cliente Existente:
                    </label>
                    <select
                      value={newInvoiceData.clienteId}
                      onChange={(e) => handleSelectClienteChange(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-400 bg-white text-xs"
                    >
                      <option value="">-- Cliente Manual / Nuevo --</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.dni || 'Sin NIF'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                      Nombre o Razón Social *:
                    </label>
                    <input
                      type="text"
                      required
                      value={newInvoiceData.clienteNombre}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clienteNombre: e.target.value })
                      }
                      placeholder="Ej: Confecciones y Ropa Madrid S.L."
                      className="w-full px-2 py-1 border border-slate-400 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                      NIF / CIF / DNI *:
                    </label>
                    <input
                      type="text"
                      required
                      value={newInvoiceData.clienteDni}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clienteDni: e.target.value })
                      }
                      placeholder="Ej: B-88776655"
                      className="w-full px-2 py-1 border border-slate-400 bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                      Domicilio Fiscal Completo:
                    </label>
                    <input
                      type="text"
                      value={newInvoiceData.clienteDireccion}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clienteDireccion: e.target.value })
                      }
                      placeholder="Calle, Número, CP, Localidad, Provincia"
                      className="w-full px-2 py-1 border border-slate-400 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                      Email de Facturación:
                    </label>
                    <input
                      type="email"
                      value={newInvoiceData.clienteEmail}
                      onChange={(e) =>
                        setNewInvoiceData({ ...newInvoiceData, clienteEmail: e.target.value })
                      }
                      placeholder="facturas@cliente.com"
                      className="w-full px-2 py-1 border border-slate-400 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Condiciones y Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border border-slate-300 bg-slate-50">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                    Fecha de Emisión:
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.fecha}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, fecha: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-slate-400 bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                    Fecha de Vencimiento:
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceData.fechaVencimiento}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, fechaVencimiento: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-slate-400 bg-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                    Forma de Pago:
                  </label>
                  <select
                    value={newInvoiceData.formaPago}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, formaPago: e.target.value })
                    }
                    className="w-full px-2 py-1 border border-slate-400 bg-white text-xs font-mono"
                  >
                    <option value="Transferencia Bancaria (30 días)">Transferencia Bancaria (30 días)</option>
                    <option value="Contado (Tarjeta de Crédito)">Contado (Tarjeta de Crédito)</option>
                    <option value="Contado (Efectivo)">Contado (Efectivo)</option>
                    <option value="Pagaré a 60 días">Pagaré a 60 días</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Partidas de la Factura */}
              <div className="p-3 border border-slate-300 bg-white space-y-2">
                <div className="flex justify-between items-center font-mono font-bold text-slate-700 text-xs">
                  <span>2. PARTIDAS Y CONCEPTOS A FACTURAR</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="erp-btn px-2 py-0.5 text-[10px] font-mono"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Añadir Fila</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newInvoiceData.items.map((item, idx) => (
                    <div key={idx} className="p-2 border border-slate-300 bg-slate-50 flex flex-col sm:flex-row gap-2 items-center">
                      <div className="w-full sm:w-28">
                        <input
                          type="text"
                          value={item.codigo}
                          onChange={(e) => handleItemChange(idx, 'codigo', e.target.value)}
                          placeholder="CÓDIGO"
                          className="w-full px-1.5 py-1 border border-slate-400 bg-white text-xs font-mono"
                        />
                      </div>

                      <div className="flex-1 w-full flex gap-1">
                        <select
                          onChange={(e) => handleSelectProductForItem(idx, e.target.value)}
                          className="w-36 px-1.5 py-1 border border-slate-400 bg-white text-[11px]"
                          defaultValue=""
                        >
                          <option value="">-- Ropa --</option>
                          {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} ({p.pvp} €)
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          value={item.descripcion}
                          onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                          placeholder="Descripción detallada del artículo o servicio..."
                          className="flex-1 px-2 py-1 border border-slate-400 bg-white text-xs"
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                          placeholder="Cant."
                          className="w-full px-1.5 py-1 border border-slate-400 bg-white text-xs font-mono text-center"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.precioUnitario}
                          onChange={(e) => handleItemChange(idx, 'precioUnitario', e.target.value)}
                          placeholder="PVP Ud"
                          className="w-full px-1.5 py-1 border border-slate-400 bg-white text-xs font-mono text-right"
                        />
                      </div>

                      <div className="w-24 font-mono font-bold text-right text-xs text-slate-900 pr-1">
                        {((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0)).toFixed(2)} €
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar partida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Resumen de totales */}
                <div className="pt-2 flex justify-end">
                  <div className="w-64 border border-slate-400 bg-slate-50 p-2.5 font-mono text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Imponible:</span>
                      <span>{newBaseImponible.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>I.V.A. ({taxRate}%):</span>
                      <span>{newIvaCuota.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-400">
                      <span>TOTAL A FACTURAR:</span>
                      <span>{newSubtotalTotal.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones y botón de emisión */}
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                  Observaciones / Cláusulas particulares:
                </label>
                <textarea
                  rows={2}
                  value={newInvoiceData.observaciones}
                  onChange={(e) =>
                    setNewInvoiceData({ ...newInvoiceData, observaciones: e.target.value })
                  }
                  className="w-full p-2 border border-slate-400 bg-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="erp-btn px-4 py-1.5 font-mono uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="erp-btn-primary px-4 py-1.5 font-mono uppercase text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Emitir y Generar Documento Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDICIÓN RÁPIDA DE DATOS FISCALES DEL CLIENTE EN LA FACTURA
          ========================================================================= */}
      {editingFactura && (
        <div
          onClick={() => setEditingFactura(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3 overflow-y-auto no-print"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg border-2 border-slate-600 bg-white shadow-2xl erp-window"
          >
            <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between text-xs font-bold uppercase font-mono">
              <span>EDITAR DATOS FISCALES: {editingFactura.numeroFactura}</span>
              <button
                type="button"
                onClick={() => setEditingFactura(null)}
                className="text-slate-300 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicionFiscal} className="p-4 space-y-3 text-xs font-sans text-slate-800">
              <p className="text-[11px] text-slate-600 font-mono">
                Actualice los datos legales del cliente para que figuren en la factura oficial a entregar:
              </p>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                  Nombre o Razón Social *:
                </label>
                <input
                  type="text"
                  required
                  value={editingFactura.clienteNombre}
                  onChange={(e) =>
                    setEditingFactura({ ...editingFactura, clienteNombre: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                  NIF / CIF / DNI *:
                </label>
                <input
                  type="text"
                  required
                  value={editingFactura.clienteDni || ''}
                  onChange={(e) =>
                    setEditingFactura({ ...editingFactura, clienteDni: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                  Domicilio Fiscal Completo:
                </label>
                <input
                  type="text"
                  value={editingFactura.clienteDireccion || ''}
                  onChange={(e) =>
                    setEditingFactura({ ...editingFactura, clienteDireccion: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                    Teléfono:
                  </label>
                  <input
                    type="text"
                    value={editingFactura.clienteTelefono || ''}
                    onChange={(e) =>
                      setEditingFactura({ ...editingFactura, clienteTelefono: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                    Email de Contacto:
                  </label>
                  <input
                    type="email"
                    value={editingFactura.clienteEmail || ''}
                    onChange={(e) =>
                      setEditingFactura({ ...editingFactura, clienteEmail: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-600 uppercase mb-0.5">
                  Forma de Pago:
                </label>
                <input
                  type="text"
                  value={editingFactura.formaPago || ''}
                  onChange={(e) =>
                    setEditingFactura({ ...editingFactura, formaPago: e.target.value })
                  }
                  className="w-full px-2 py-1.5 border border-slate-400 bg-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-300">
                <button
                  type="button"
                  onClick={() => setEditingFactura(null)}
                  className="erp-btn px-3 py-1 font-mono uppercase text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="erp-btn-primary px-3 py-1 font-mono uppercase text-xs font-bold"
                >
                  Guardar Datos Fiscales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
