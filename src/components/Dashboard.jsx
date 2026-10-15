import React from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Shirt,
  Users,
  FileCheck,
  AlertTriangle,
  ShoppingCart,
  Truck,
  RotateCcw,
} from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { ventas, productos, clientes, facturas } = useErp();
  const { user } = useAuth();

  const totalFacturado = ventas.reduce((acc, v) => acc + v.total, 0);
  const totalPrendasStock = productos.reduce((acc, p) => acc + p.stock, 0);
  const stockBajo = productos.filter((p) => p.stock <= 5);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Siempre las últimas 5 operaciones: arriba la más reciente, hacia abajo conforme son más viejas
  const ultimasVentas = [...ventas]
    .sort((a, b) => {
      const fechaA = String(a.fecha || a.created || '');
      const fechaB = String(b.fecha || b.created || '');
      const cmp = fechaB.localeCompare(fechaA);
      if (cmp !== 0) return cmp;
      return (b.numeroTicket || b.id || '').localeCompare(a.numeroTicket || a.id || '');
    })
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {/* Barra de estado de sesión administrativa */}
      <div className="erp-window p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-400">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
            PANEL DE CONTROL GENERAL
          </h2>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            OPERADOR: <strong>{user?.name?.toUpperCase()}</strong> | NIVEL:{' '}
            <strong>{user?.role === 'admin' ? 'ADMINISTRADOR (ACCESO TOTAL)' : 'DEPENDIENTE / CAJA'}</strong> | FECHA: {fechaHoy}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ventas')}
            className="erp-btn-primary px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Abrir TPV Caja</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devoluciones')}
            className="erp-btn px-3 py-1 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cambios y Vales</span>
          </button>
        </div>
      </div>

      {/* Métricas contables principales en cuadrícula sobria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* KPI 1: Ventas */}
        <div className="bg-white border border-slate-400 p-3 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
              TOTAL CAJA EMITIDA
            </span>
            <span className="text-slate-500 font-mono text-[10px]">#01</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {totalFacturado.toFixed(2)} €
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            {ventas.length} tickets de venta liquidados
          </div>
        </div>

        {/* KPI 2: Inventario */}
        <div className="bg-white border border-slate-400 p-3 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
              EXISTENCIAS TOTALES
            </span>
            <span className="text-slate-500 font-mono text-[10px]">#02</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {totalPrendasStock} uds.
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            En {productos.length} referencias de ropa
          </div>
        </div>

        {/* KPI 3: Clientes */}
        <div className="bg-white border border-slate-400 p-3 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
              LIBRO DE CLIENTES
            </span>
            <span className="text-slate-500 font-mono text-[10px]">#03</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {clientes.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Fichas fiscales registradas
          </div>
        </div>

        {/* KPI 4: Facturación */}
        <div className="bg-white border border-slate-400 p-3 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase font-mono">
              FACTURAS ORDINARIAS
            </span>
            <span className="text-slate-500 font-mono text-[10px]">#04</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {facturas.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Con desglose oficial IVA (21%)
          </div>
        </div>
      </div>

      {/* Tablas administrativas de actividad y avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Alertas de inventario / stock bajo */}
        <div className="erp-window border-slate-400">
          <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>AVISOS DE REPOSICIÓN · UMBRAL &le; 5 UDS</span>
            </div>
            {user?.role === 'admin' ? (
              <button
                type="button"
                onClick={() => setActiveTab('proveedores')}
                className="text-[11px] underline text-slate-300 hover:text-white font-mono"
              >
                [Emitir Pedido de Compra]
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-mono">
                [SOLO ADMIN]
              </span>
            )}
          </div>

          <div className="p-2 bg-white">
            {stockBajo.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 font-mono">
                SIN AVISOS ACTIVOS: EXISTENCIAS EN PARÁMETROS NOMINALES.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Prenda</th>
                    <th>Tallas</th>
                    <th className="text-right">Stock</th>
                    <th className="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stockBajo.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-[11px] font-bold">{p.sku}</td>
                      <td className="font-semibold text-slate-800">{p.nombre}</td>
                      <td className="text-slate-600">{p.tallas?.join(', ')}</td>
                      <td className="text-right font-mono font-bold text-red-700">
                        {p.stock} uds.
                      </td>
                      <td className="text-center">
                        <span className="px-1.5 py-0.2 border border-red-300 bg-red-100 text-red-800 font-mono text-[10px] font-bold">
                          CRÍTICO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Registro de últimos comprobantes de caja */}
        <div className="erp-window border-slate-400">
          <div className="erp-header-bar px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-300" />
              <span>ÚLTIMAS OPERACIONES DE CAJA (TPV)</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ventas')}
              className="text-[11px] underline text-slate-300 hover:text-white font-mono"
            >
              [Ver Diario de Caja]
            </button>
          </div>

          <div className="p-2 bg-white">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Nº Ticket</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {ultimasVentas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-400 font-mono text-xs">
                      [NO HAY OPERACIONES DE CAJA REGISTRADAS]
                    </td>
                  </tr>
                ) : (
                  ultimasVentas.map((v) => (
                    <tr key={v.id}>
                      <td className="font-mono text-[11px] font-bold text-slate-700">
                        {v.numeroTicket}
                      </td>
                      <td className="text-slate-600 font-mono text-[11px]">{v.fecha}</td>
                      <td className="text-slate-800 font-medium">{v.clienteNombre}</td>
                      <td className="text-slate-600 uppercase text-[11px]">{v.metodoPago}</td>
                      <td className="text-right font-mono font-bold text-slate-900">
                        {Number(v.total || 0).toFixed(2)} €
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
