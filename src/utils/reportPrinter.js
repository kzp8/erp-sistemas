/**
 * Utilidad oficial para generación e impresión de Informes Estadísticos y Balances A4.
 * Genera un documento corporativo formal con membrete legal, KPIs, tablas analíticas y pie de firma.
 * Utiliza un iframe invisible aislado para evitar interferencias con el modo oscuro y estilos web.
 */

export function generarHtmlInforme(reportType, reportData, tenantConfig, user) {
  const company = tenantConfig?.company || {
    legalName: 'MODA URBAN S.L.',
    activity: 'Comercio Minorista de Confección Textil y Ropa',
    cif: 'B-99887766',
    address: 'Calle Gran Vía 10 · 28013 Madrid (España)',
    phone: '(+34) 91 555 44 33',
    email: 'facturas@modaurban.es',
    regData: 'Inscrita en el Registro Mercantil de Madrid, Tomo 34.201, Folio 88, Sección 8, Hoja M-615243',
    website: 'www.modadaw.es',
  };

  const currency = tenantConfig?.pos?.currencySymbol || '€';
  const fechaActual = new Date();
  const fechaStr = fechaActual.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaStr = fechaActual.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const emisorNombre = user?.nombre || user?.username || 'Administrador del Sistema';
  const emisorRol = user?.role === 'admin' ? 'DIRECCIÓN GENERAL / ADMIN' : 'RESPONSABLE DE TIENDA';

  let reportTitle = '';
  let reportSubtitle = '';
  let reportCode = '';
  let kpiCardsHtml = '';
  let contentHtml = '';

  if (reportType === 'mensual') {
    reportCode = `INF-MEN-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    reportTitle = 'INFORME 01 · BALANCE MENSUAL DE LIQUIDACIÓN Y RECAUDACIÓN DE IVA (21%)';
    reportSubtitle = 'Cómputo acumulado de operaciones comerciales, base imponible e impuestos devengados';

    const ventasPorMes = reportData?.ventasPorMes || [];
    const totalTickets = ventasPorMes.reduce((acc, m) => acc + (Number(m.tickets) || 0), 0);
    const totalBase = ventasPorMes.reduce((acc, m) => acc + (parseFloat(m.baseImponible) || 0), 0);
    const totalIva = ventasPorMes.reduce((acc, m) => acc + (parseFloat(m.iva) || 0), 0);
    const totalVentas = ventasPorMes.reduce((acc, m) => acc + (parseFloat(m.total) || 0), 0);
    const maxTotalMes = Math.max(...ventasPorMes.map((m) => parseFloat(m.total) || 0), 1);

    kpiCardsHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">TOTAL OPERACIONES</div>
          <div class="kpi-value">${totalTickets}</div>
          <div class="kpi-sub">Tickets y facturas registradas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">BASE IMPONIBLE TOTAL</div>
          <div class="kpi-value">${totalBase.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Total neto antes de impuestos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">IVA RECAUDADO (21%)</div>
          <div class="kpi-value">${totalIva.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Impuesto devengado liquidable</div>
        </div>
        <div class="kpi-card kpi-card-highlight">
          <div class="kpi-label">TOTAL FACTURACIÓN BRUTA</div>
          <div class="kpi-value">${totalVentas.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Ingresos brutos del ejercicio</div>
        </div>
      </div>
    `;

    const rows = ventasPorMes
      .map((m) => {
        const valTotal = parseFloat(m.total) || 0;
        const valBase = parseFloat(m.baseImponible) || 0;
        const valIva = parseFloat(m.iva) || 0;
        const pct = totalVentas > 0 ? Math.round((valTotal / totalVentas) * 100) : 0;
        return `
          <tr>
            <td class="font-bold font-mono">${m.mes}</td>
            <td class="text-center font-mono">${m.tickets} tickets</td>
            <td class="text-right font-mono">${valBase.toFixed(2)} ${currency}</td>
            <td class="text-right font-mono">${valIva.toFixed(2)} ${currency}</td>
            <td class="text-right font-mono font-bold">${valTotal.toFixed(2)} ${currency}</td>
            <td class="text-right font-mono font-bold">${pct}%</td>
          </tr>
        `;
      })
      .join('');

    contentHtml = `
      <div class="table-section">
        <div class="section-title">DESGLOSE TEMPORAL POR PERIODOS MENSUALES</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 18%;">Periodo Mensual</th>
              <th class="text-center" style="width: 16%;">Operaciones</th>
              <th class="text-right" style="width: 18%;">Base Imponible</th>
              <th class="text-right" style="width: 18%;">IVA Recaudado (21%)</th>
              <th class="text-right" style="width: 18%;">Total Facturación</th>
              <th class="text-right" style="width: 12%;">Cuota %</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="text-center">No hay registros de ventas disponibles.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td class="font-bold">TOTALES EJERCICIO</td>
              <td class="text-center font-mono font-bold">${totalTickets} tickets</td>
              <td class="text-right font-mono font-bold">${totalBase.toFixed(2)} ${currency}</td>
              <td class="text-right font-mono font-bold">${totalIva.toFixed(2)} ${currency}</td>
              <td class="text-right font-mono font-bold text-accent">${totalVentas.toFixed(2)} ${currency}</td>
              <td class="text-right font-bold font-mono">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (reportType === 'estrella') {
    reportCode = `INF-EST-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    reportTitle = 'INFORME 02 · RANKING DE ROTACIÓN DE PRENDAS (TOP ARTÍCULOS VENDIDOS)';
    reportSubtitle = 'Volumen acumulado de prendas expedidas, ranking de demanda y desglose por tallas';

    const productosEstrella = reportData?.productosEstrella || [];
    const totalPrendasVendidas = productosEstrella.reduce((acc, p) => acc + (Number(p.unidadesVendidas) || 0), 0);
    const totalFacturadoPrendas = productosEstrella.reduce((acc, p) => acc + (parseFloat(p.totalFacturado) || 0), 0);
    const prendaTop = productosEstrella[0]?.nombre || 'Ninguna';

    kpiCardsHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">ARTÍCULOS AUDITADOS</div>
          <div class="kpi-value">${productosEstrella.length}</div>
          <div class="kpi-sub">Referencias con ventas registradas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TOTAL PRENDAS VENDIDAS</div>
          <div class="kpi-value">${totalPrendasVendidas} uds.</div>
          <div class="kpi-sub">Volumen de unidades despachadas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">FACTURACIÓN GENERADA</div>
          <div class="kpi-value">${totalFacturadoPrendas.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Ingreso imputable a referencias</div>
        </div>
        <div class="kpi-card kpi-card-highlight">
          <div class="kpi-label">PRENDA NÚMERO 1 EN VENTAS</div>
          <div class="kpi-value" style="font-size: 13px; line-height: 1.2; margin-top: 4px;">${prendaTop}</div>
          <div class="kpi-sub">Prenda líder en volumen y preferencia</div>
        </div>
      </div>
    `;

    const rows = productosEstrella
      .map((p, idx) => {
        const tallasBadges = Object.entries(p.tallasVendidas || {})
          .map(([t, q]) => `<span class="tag">T.${t}: <strong>${q}</strong></span>`)
          .join(' ');

        return `
          <tr>
            <td class="text-center font-bold font-mono">#${idx + 1}</td>
            <td class="font-mono text-muted">${p.sku}</td>
            <td class="font-bold">${p.nombre}</td>
            <td><div class="tags-container">${tallasBadges || '<span class="text-muted">Estándar</span>'}</div></td>
            <td class="text-center font-mono font-bold">${Number(p.unidadesVendidas) || 0}</td>
            <td class="text-right font-mono font-bold">${(parseFloat(p.totalFacturado) || 0).toFixed(2)} ${currency}</td>
          </tr>
        `;
      })
      .join('');

    contentHtml = `
      <div class="table-section">
        <div class="section-title">RANKING DESGLOSADO POR ROTACIÓN Y VOLUMEN DE VENTA</div>
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 8%;">Pos.</th>
              <th style="width: 14%;">Referencia</th>
              <th style="width: 32%;">Descripción de la Prenda</th>
              <th style="width: 24%;">Desglose de Tallas Vendidas</th>
              <th class="text-center" style="width: 10%;">Uds.</th>
              <th class="text-right" style="width: 12%;">Facturación</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="text-center">No hay productos vendidos en el registro.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td colspan="4" class="font-bold">TOTALES CONSOLIDADOS PRENDAS ESTRELLA</td>
              <td class="text-center font-mono font-bold">${totalPrendasVendidas}</td>
              <td class="text-right font-mono font-bold text-accent">${totalFacturadoPrendas.toFixed(2)} ${currency}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (reportType === 'clientes') {
    reportCode = `INF-CLI-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    reportTitle = 'INFORME 03 · RANKING DE FIDELIZACIÓN Y COMPRADORES HABITUALES';
    reportSubtitle = 'Análisis de cartera de clientes fidelizados, historial de consumo y saldo de puntos';

    const mejoresClientes = reportData?.mejoresClientes || [];
    const totalGastoCartera = mejoresClientes.reduce((acc, c) => acc + (parseFloat(c.totalGastado) || 0), 0);
    const totalPuntosCartera = mejoresClientes.reduce((acc, c) => acc + (Number(c.puntosFidelidad) || 0), 0);
    const promedioGasto = mejoresClientes.length > 0 ? totalGastoCartera / mejoresClientes.length : 0;

    kpiCardsHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">CLIENTES EN CARTERA</div>
          <div class="kpi-value">${mejoresClientes.length}</div>
          <div class="kpi-sub">Titulares fidelizados registrados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">GASTO TOTAL CARTERA</div>
          <div class="kpi-value">${totalGastoCartera.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Volumen total consumido</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TOTAL PUNTOS VIGENTES</div>
          <div class="kpi-value">${totalPuntosCartera} pts</div>
          <div class="kpi-sub">Saldo acumulado en programa fidelidad</div>
        </div>
        <div class="kpi-card kpi-card-highlight">
          <div class="kpi-label">GASTO MEDIO POR TITULAR</div>
          <div class="kpi-value">${promedioGasto.toFixed(2)} ${currency}</div>
          <div class="kpi-sub">Ticket promedio de cliente recurrente</div>
        </div>
      </div>
    `;

    const rows = mejoresClientes
      .map(
        (c, idx) => `
        <tr>
          <td class="text-center font-bold font-mono">#${idx + 1}</td>
          <td class="font-bold">${c.nombre}</td>
          <td class="font-mono text-muted">${c.dni || 'Sin NIF'}</td>
          <td class="font-mono text-muted" style="font-size: 10px;">${c.email || ''} · ${c.telefono || ''}</td>
          <td class="text-center font-mono font-bold"><span class="points-badge">${Number(c.puntosFidelidad) || 0} pts</span></td>
          <td class="text-right font-mono font-bold">${(parseFloat(c.totalGastado) || 0).toFixed(2)} ${currency}</td>
        </tr>
      `
      )
      .join('');

    contentHtml = `
      <div class="table-section">
        <div class="section-title">LISTADO DE COMPRADORES DESTACADOS Y VOLUMEN DE ADQUISICIONES</div>
        <table class="report-table">
          <thead>
            <tr>
              <th class="text-center" style="width: 8%;">Orden</th>
              <th style="width: 30%;">Titular Fiscal / Cliente</th>
              <th style="width: 14%;">NIF / CIF</th>
              <th style="width: 26%;">Datos de Contacto</th>
              <th class="text-center" style="width: 10%;">Puntos</th>
              <th class="text-right" style="width: 12%;">Gasto Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="text-center">No hay clientes con compras registradas.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td colspan="4" class="font-bold">TOTAL CONSUMO CARTERA FIDELIZADA</td>
              <td class="text-center font-mono font-bold">${totalPuntosCartera} pts</td>
              <td class="text-right font-mono font-bold text-accent">${totalGastoCartera.toFixed(2)} ${currency}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  } else if (reportType === 'stock') {
    reportCode = `INF-STK-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}`;
    reportTitle = 'INFORME 04 · AUDITORÍA DE STOCK CRÍTICO Y AVISOS DE ROTURA';
    reportSubtitle = 'Existencias inferiores o iguales al umbral mínimo de seguridad (5 unidades) para reposición urgente';

    const stockCritico = reportData?.stockCritico || [];
    const totalUnidadesRestantes = stockCritico.reduce((acc, p) => acc + (p.stock || 0), 0);
    const articulosCriticosSeveros = stockCritico.filter((p) => p.stock <= 2).length;

    kpiCardsHtml = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">REFERENCIAS EN RIESGO</div>
          <div class="kpi-value">${stockCritico.length}</div>
          <div class="kpi-sub">Prendas con existencias ≤ 5 uds.</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">ALERTAS SEVERAS (≤ 2 UDS)</div>
          <div class="kpi-value" style="color: #b91c1c;">${articulosCriticosSeveros}</div>
          <div class="kpi-sub">Riesgo inminente de rotura total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">TOTAL UNIDADES EN STOCK</div>
          <div class="kpi-value">${totalUnidadesRestantes} uds.</div>
          <div class="kpi-sub">Volumen remanente global afectado</div>
        </div>
        <div class="kpi-card kpi-card-highlight">
          <div class="kpi-label">ESTADO OPERATIVO</div>
          <div class="kpi-value" style="font-size: 13px; line-height: 1.2; margin-top: 4px; color: #b91c1c;">
            ${stockCritico.length > 0 ? 'REPOSICIÓN REQUERIDA' : 'STOCK NORMALIZADO'}
          </div>
          <div class="kpi-sub">Emisión recomendada a proveedores</div>
        </div>
      </div>
    `;

    const rows = stockCritico
      .map((p) => {
        const tallasStr = Array.isArray(p.tallas) ? p.tallas.join(', ') : p.tallas || 'Tallas varias';
        const isSevero = p.stock <= 2;
        return `
          <tr>
            <td class="font-mono font-bold">${p.sku}</td>
            <td class="font-bold">${p.nombre}</td>
            <td class="font-mono text-muted uppercase">${p.categoria || 'Textil'}</td>
            <td class="font-mono text-muted">${tallasStr}</td>
            <td class="text-center font-mono font-bold" style="color: ${isSevero ? '#b91c1c' : '#c2410c'};">
              ${p.stock} uds.
            </td>
            <td class="text-center">
              <span class="stock-status-badge ${isSevero ? 'badge-danger' : 'badge-warning'}">
                ${isSevero ? 'URGENTE (CRÍTICO)' : 'BAJO MÍNIMO'}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    contentHtml = `
      <div class="table-section">
        <div class="section-title">ARTÍCULOS CON REPOSICIÓN OBLIGATORIA A PROVEEDORES</div>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 15%;">Código SKU</th>
              <th style="width: 32%;">Prenda / Modelo</th>
              <th style="width: 16%;">Categoría</th>
              <th style="width: 17%;">Tallas Afectadas</th>
              <th class="text-center" style="width: 10%;">Existencias</th>
              <th class="text-center" style="width: 10%;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="6" class="text-center">No hay artículos con existencias críticas. Todos los niveles son óptimos.</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="table-total-row">
              <td colspan="4" class="font-bold">TOTAL EXISTENCIAS EN REFERENCIAS AFECTADAS</td>
              <td class="text-center font-mono font-bold text-accent">${totalUnidadesRestantes} uds.</td>
              <td class="text-center font-bold font-mono">${stockCritico.length} ref.</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }

    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      width: 100%;
    }

    .report-container {
      width: 100%;
      max-width: 210mm;
      box-sizing: border-box;
      padding: 12mm 15mm 12mm 15mm;
      margin: 0 auto;
      background: #ffffff;
    }

    /* CABECERA CORPORATIVA OFICIAL */
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin: 0 0 3px 0;
    }

    .company-activity {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin: 0 0 5px 0;
    }

    .company-meta {
      font-size: 10px;
      color: #334155;
      line-height: 1.4;
    }

    .header-badge-box {
      text-align: right;
    }

    .official-badge {
      display: inline-block;
      border: 1px solid #0f172a;
      background: #0f172a;
      color: #ffffff;
      font-family: monospace;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 8px;
      margin-bottom: 6px;
    }

    .report-code-badge {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }

    /* BLOQUE DE TÍTULO Y METADATOS DEL INFORME */
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      gap: 15px;
    }

    .title-col {
      flex: 1;
    }

    .report-main-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }

    .report-subtitle {
      font-size: 10.5px;
      color: #475569;
      margin: 0;
    }

    .meta-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 10px;
      min-width: 220px;
    }

    .meta-line {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .meta-line:last-child {
      border-bottom: none;
    }

    .meta-label {
      color: #64748b;
      font-weight: 500;
    }

    .meta-value {
      font-weight: 700;
      color: #0f172a;
    }

    /* TARJETAS RESUMEN (KPIS) */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }

    .kpi-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 2px;
    }

    .kpi-card-highlight {
      border-color: #0f172a;
      background: #f1f5f9;
    }

    .kpi-label {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
      margin: 3px 0 2px 0;
    }

    .kpi-sub {
      font-size: 8.5px;
      color: #64748b;
    }

    /* SECCIÓN Y TABLA ANALÍTICA */
    .table-section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    .report-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.04em;
      padding: 6px 8px;
      border-top: 1px solid #94a3b8;
      border-bottom: 2px solid #0f172a;
      text-align: left;
    }

    .report-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #0f172a;
    }

    .report-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .table-total-row td {
      background: #e2e8f0 !important;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 7px 8px;
      font-size: 11px;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-mono { font-family: monospace; }
    .text-muted { color: #64748b; }
    .text-accent { color: #0f172a; }


    .tag {
      display: inline-block;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 1px 4px;
      font-size: 9px;
      font-family: monospace;
      color: #334155;
      margin: 1px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
    }

    .points-badge {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      padding: 1px 5px;
      font-size: 9px;
      font-weight: 700;
    }

    .stock-status-badge {
      display: inline-block;
      padding: 2px 5px;
      font-size: 8.5px;
      font-weight: 700;
      font-family: monospace;
      text-transform: uppercase;
      border-radius: 2px;
    }

    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    /* ZONA DE FIRMA Y LEGALIDAD */
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 22px;
      page-break-inside: avoid;
    }

    .signature-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px 12px;
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .signature-title {
      font-size: 9px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .signature-line {
      border-bottom: 1px dashed #94a3b8;
      margin-top: 35px;
      margin-bottom: 4px;
    }

    .signature-signee {
      font-size: 9.5px;
      color: #64748b;
      text-align: center;
    }

    /* PIE LEGAL OFICIAL */
    .report-footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #cbd5e1;
      font-size: 8px;
      color: #64748b;
      line-height: 1.4;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- CABECERA -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top; width: 65%;">
          <div class="company-title">${company.legalName}</div>
          <div class="company-activity">${company.activity}</div>
          <div class="company-meta">
            CIF: <strong>${company.cif}</strong> · ${company.address}<br />
            Tel: ${company.phone} · Email: ${company.email} · Web: ${company.website}
          </div>
        </td>
        <td style="vertical-align: top; width: 35%;" class="header-badge-box">
          <div class="official-badge">INFORME OFICIAL AUDITADO</div>
          <div class="report-code-badge">${reportCode}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">
            MÓDULO 08 · BALANCES ERP
          </div>
        </td>
      </tr>
    </table>

    <!-- TÍTULO Y METADATOS -->
    <div class="title-row">
      <div class="title-col">
        <h1 class="report-main-title">${reportTitle}</h1>
        <p class="report-subtitle">${reportSubtitle}</p>
      </div>
      <div class="meta-box">
        <div class="meta-line">
          <span class="meta-label">Fecha emisión:</span>
          <span class="meta-value">${fechaStr} ${horaStr}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">Ejercicio / Periodo:</span>
          <span class="meta-value">${fechaActual.getFullYear()} (Actual)</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">Operador responsable:</span>
          <span class="meta-value">${emisorNombre}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">Rango funcional:</span>
          <span class="meta-value">${emisorRol}</span>
        </div>
      </div>
    </div>

    <!-- TARJETAS KPIS -->
    ${kpiCardsHtml}

    <!-- TABLA DE DATOS -->
    ${contentHtml}

    <!-- FIRMAS DE VALIDACIÓN -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-title">INTERVENCIÓN / DIRECCIÓN FINANCIERA</div>
        <div class="signature-line"></div>
        <div class="signature-signee">Fdo: ${emisorNombre} (Validación de Balances)</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">CONTROL DE GESTIÓN Y EXISTENCIAS</div>
        <div class="signature-line"></div>
        <div class="signature-signee">Sello y Firma de Conformidad Oficial</div>
      </div>
    </div>

    <!-- PIE LEGAL -->
    <div class="report-footer">
      <div><strong>${company.legalName}</strong> · Registro Mercantil: ${company.regData}</div>
      <div>
        Documento interno de control económico, comercial y fiscal emitido conforme a las directrices de auditoría del sistema ERP ModaDAW.
        La información aquí contenida es de carácter estrictamente confidencial.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Imprime el informe oficial en un iframe invisible para evitar interferencias visuales.
 */
export function imprimirInformeOficial(reportType, reportData, tenantConfig, user) {
  const htmlContent = generarHtmlInforme(reportType, reportData, tenantConfig, user);

  let iframe = document.getElementById('erp-report-print-frame');
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement('iframe');
  iframe.id = 'erp-report-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Error al imprimir informe vía iframe:', err);
      // Fallback a ventana emergente
      const win = window.open('', '_blank', 'width=840,height=900');
      if (win) {
        win.document.open();
        win.document.write(htmlContent);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
      }
    }
  }, 250);
}
