import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { useAuth } from '../context/AuthContext';
import { tenantConfig } from '../config/tenantConfig';
import { imprimirInformeOficial } from '../utils/reportPrinter';
import {
  BarChart3,
  TrendingUp,
  Shirt,
  Users,
  AlertTriangle,
  Printer,
} from 'lucide-react';

export default function Informes() {
  const { ventas, productos, clientes } = useErp();
  const { user } = useAuth();
  const [activeReport, setActiveReport] = useState(() => {
    try {
      return localStorage.getItem('erp_active_report') || 'mensual';
    } catch {
      return 'mensual';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('erp_active_report', activeReport);
    } catch {
      // ignore
    }
  }, [activeReport]);

  // 1. Informe: Ventas por Mes
  const ventasPorMesMap = {};
  ventas.forEach((v) => {
    const mesKey = v.mes || v.fecha?.substring(0, 7) || '2026-03';
    if (!ventasPorMesMap[mesKey]) {
      ventasPorMesMap[mesKey] = {
        mes: mesKey,
        tickets: 0,
        total: 0,
        baseImponible: 0,
        iva: 0,
      };
    }
    ventasPorMesMap[mesKey].tickets += 1;
    ventasPorMesMap[mesKey].total += v.total;
    ventasPorMesMap[mesKey].baseImponible += v.baseImponible;
    ventasPorMesMap[mesKey].iva += v.iva;
  });

  const ventasPorMes = Object.values(ventasPorMesMap).sort((a, b) =>
    a.mes.localeCompare(b.mes)
  );

  const maxTotalMes = Math.max(...ventasPorMes.map((m) => m.total), 1);

  // 2. Informe: Prenda Estrella
  const productosVendidosMap = {};
  ventas.forEach((v) => {
    v.items?.forEach((it) => {
      if (!productosVendidosMap[it.productoId]) {
        productosVendidosMap[it.productoId] = {
          id: it.productoId,
          nombre: it.nombre,
          sku: it.sku || 'MOD',
          unidadesVendidas: 0,
          totalFacturado: 0,
          tallasVendidas: {},
        };
      }
      productosVendidosMap[it.productoId].unidadesVendidas += it.cantidad;
      productosVendidosMap[it.productoId].totalFacturado += it.subtotal || it.cantidad * it.precioUnitario;

      if (it.talla) {
        productosVendidosMap[it.productoId].tallasVendidas[it.talla] =
          (productosVendidosMap[it.productoId].tallasVendidas[it.talla] || 0) + it.cantidad;
      }
    });
  });

  const productosEstrella = Object.values(productosVendidosMap).sort(
    (a, b) => b.unidadesVendidas - a.unidadesVendidas
  );

  // 3. Informe: Mejores Clientes
  const mejoresClientes = [...clientes]
    .filter((c) => c.id !== 'cli-5')
    .sort((a, b) => (b.totalGastado || 0) - (a.totalGastado || 0));

  // 4. Informe: Alerta de Stock Bajo
  const stockCritico = productos
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock);

  const handlePrintReport = () => {
    let reportData = {};
    if (activeReport === 'mensual') {
      reportData = { ventasPorMes };
    } else if (activeReport === 'estrella') {
      reportData = { productosEstrella };
    } else if (activeReport === 'clientes') {
      reportData = { mejoresClientes };
    } else if (activeReport === 'stock') {
      reportData = { stockCritico };
    }
    imprimirInformeOficial(activeReport, reportData, tenantConfig, user);
  };

  return (
    <div className="space-y-3">
      {/* Cabecera */}
      <div className="erp-window p-3 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wide">
              MÓDULO 08 · INFORMES ESTADÍSTICOS Y BALANCES DE EXPLOTACIÓN
            </h2>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
            Exigencia 4.3 PDF: Liquidaciones mensuales, ranking de prendas estrella, clientes y control de existencias
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintReport}
          className="erp-btn-primary px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Informe Oficial</span>
        </button>
      </div>

      {/* Pestañas de Selección de Informe */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 select-none">
        {[
          { id: 'mensual', label: '1. VENTAS POR MES', desc: 'Liquidación temporal', icon: TrendingUp },
          { id: 'estrella', label: '2. PRENDA ESTRELLA', desc: 'Ranking de rotación', icon: Shirt },
          { id: 'clientes', label: '3. MEJORES CLIENTES', desc: 'Fidelización y gasto', icon: Users },
          { id: 'stock', label: '4. STOCK CRÍTICO', desc: 'Avisos de rotura', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id)}
              style={
                isSelected
                  ? { backgroundColor: 'var(--erp-primary)', borderColor: 'var(--erp-primary-hover)', color: '#ffffff' }
                  : {}
              }
              className={`p-2.5 border text-left transition cursor-pointer ${
                isSelected
                  ? 'font-bold shadow-xs'
                  : 'bg-white text-slate-800 border-slate-400 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </div>
              <span className="text-[10px] block opacity-80 mt-0.5 font-mono">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* INFORME 1: Ventas por Mes */}
      {activeReport === 'mensual' && (
        <div className="erp-window printable-report border-slate-400 p-4 space-y-4">
          <div className="border-b border-slate-300 pb-2">
            <h3 className="font-bold text-xs uppercase font-mono text-slate-900">
              INFORME 01: BALANCE MENSUAL DE LIQUIDACIÓN Y RECAUDACIÓN DE IVA (21%)
            </h3>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              Cómputo acumulado de operaciones, base imponible e impuestos devengados
            </p>
          </div>

          {/* Gráfico de barras monocromo */}
          <div className="border border-slate-300 bg-slate-50 p-3 space-y-3">
            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block">
              Evolución Comparativa de Facturación (€):
            </span>
            <div className="space-y-2">
              {ventasPorMes.map((m) => {
                const porcentaje = Math.round((m.total / maxTotalMes) * 100);
                return (
                  <div key={m.mes} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-mono text-slate-800">
                      <span>PERIODO: {m.mes} ({m.tickets} tickets)</span>
                      <span className="font-bold">{m.total.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-slate-200 border border-slate-400 h-4 flex">
                      <div
                        className="h-full flex items-center justify-end pr-2 text-[10px] text-white font-mono font-bold transition-all"
                        style={{ width: `${Math.max(porcentaje, 12)}%`, backgroundColor: 'var(--erp-primary)' }}
                      >
                        {porcentaje}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla Desglosada */}
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Periodo Mensual</th>
                  <th className="text-center">Operaciones</th>
                  <th className="text-right">Base Imponible</th>
                  <th className="text-right">IVA Recaudado (21%)</th>
                  <th className="text-right">Total Facturación</th>
                </tr>
              </thead>
              <tbody>
                {ventasPorMes.map((m) => (
                  <tr key={m.mes}>
                    <td className="font-bold font-mono text-slate-800">{m.mes}</td>
                    <td className="text-center font-mono">{m.tickets} tickets</td>
                    <td className="text-right font-mono text-slate-700">
                      {m.baseImponible.toFixed(2)} €
                    </td>
                    <td className="text-right font-mono text-slate-700">
                      {m.iva.toFixed(2)} €
                    </td>
                    <td className="text-right font-mono font-bold text-slate-900 text-xs">
                      {m.total.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INFORME 2: Prenda Estrella */}
      {activeReport === 'estrella' && (
        <div className="erp-window printable-report border-slate-400 p-4 space-y-3">
          <div className="border-b border-slate-300 pb-2">
            <h3 className="font-bold text-xs uppercase font-mono text-slate-900">
              INFORME 02: RANKING DE ROTACIÓN DE PRENDAS (TOP ARTÍCULOS VENDIDOS)
            </h3>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              Volumen de unidades expedidas y desglose de tallas demandadas por clientes
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '8%' }}>Pos</th>
                  <th style={{ width: '15%' }}>Referencia</th>
                  <th style={{ width: '32%' }}>Descripción del Artículo</th>
                  <th style={{ width: '25%' }}>Tallas Vendidas</th>
                  <th className="text-center" style={{ width: '10%' }}>Uds</th>
                  <th className="text-right" style={{ width: '10%' }}>Facturado</th>
                </tr>
              </thead>
              <tbody>
                {productosEstrella.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="text-center font-mono font-bold text-slate-700">
                      #{idx + 1}
                    </td>
                    <td className="font-mono text-slate-700">{p.sku}</td>
                    <td className="font-bold text-slate-900">{p.nombre}</td>
                    <td>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {Object.entries(p.tallasVendidas || {}).map(([talla, qty]) => (
                          <span
                            key={talla}
                            className="px-1 border border-slate-300 bg-slate-100 text-slate-800"
                          >
                            T.{talla}: <strong>{qty}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-center font-bold font-mono text-slate-900">
                      {p.unidadesVendidas}
                    </td>
                    <td className="text-right font-bold font-mono text-slate-900">
                      {p.totalFacturado.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INFORME 3: Mejores Clientes */}
      {activeReport === 'clientes' && (
        <div className="erp-window printable-report border-slate-400 p-4 space-y-3">
          <div className="border-b border-slate-300 pb-2">
            <h3 className="font-bold text-xs uppercase font-mono text-slate-900">
              INFORME 03: RANKING DE FIDELIZACIÓN Y COMPRADORES HABITUALES
            </h3>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              Historial de gasto acumulado y saldo de puntos promocionales
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '8%' }}>Orden</th>
                  <th style={{ width: '30%' }}>Titular Fiscal</th>
                  <th style={{ width: '15%' }}>NIF / CIF</th>
                  <th style={{ width: '25%' }}>Contacto</th>
                  <th className="text-center" style={{ width: '10%' }}>Puntos</th>
                  <th className="text-right" style={{ width: '12%' }}>Gasto Total</th>
                </tr>
              </thead>
              <tbody>
                {mejoresClientes.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="text-center font-mono font-bold text-slate-600">
                      #{idx + 1}
                    </td>
                    <td className="font-bold text-slate-900">{c.nombre}</td>
                    <td className="font-mono text-slate-700">{c.dni}</td>
                    <td className="text-slate-600 text-[11px] font-mono">
                      {c.email} | {c.telefono}
                    </td>
                    <td className="text-center">
                      <span className="px-1.5 py-0.2 border border-slate-400 bg-slate-100 font-mono text-[10px] font-bold">
                        {c.puntosFidelidad} pts
                      </span>
                    </td>
                    <td className="text-right font-bold font-mono text-slate-900 text-xs">
                      {(c.totalGastado || 0).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INFORME 4: Stock Crítico */}
      {activeReport === 'stock' && (
        <div className="erp-window printable-report border-slate-400 p-4 space-y-3">
          <div className="border-b border-slate-300 pb-2">
            <h3 className="font-bold text-xs uppercase font-mono text-slate-900">
              INFORME 04: AVISOS DE ROTURA DE STOCK (EXISTENCIAS &le; 5 UDS)
            </h3>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              Listado de reposición obligatoria para emisión de pedidos a proveedores textiles
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Código SKU</th>
                  <th style={{ width: '35%' }}>Prenda / Modelo</th>
                  <th style={{ width: '15%' }}>Categoría</th>
                  <th style={{ width: '20%' }}>Tallas Afectadas</th>
                  <th className="text-center" style={{ width: '15%' }}>Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                {stockCritico.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono font-bold text-slate-800">{p.sku}</td>
                    <td className="font-bold text-slate-900">{p.nombre}</td>
                    <td className="font-mono text-[11px] uppercase text-slate-700">{p.categoria}</td>
                    <td className="text-slate-600 font-mono text-[11px]">
                      {Array.isArray(p.tallas) ? p.tallas.join(', ') : p.tallas}
                    </td>
                    <td className="text-center font-bold font-mono text-red-700">
                      {p.stock} uds. (CRÍTICO)
                    </td>
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
