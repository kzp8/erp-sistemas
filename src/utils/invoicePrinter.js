/**
 * Utilidad oficial para generación e impresión de Facturas Mercantiles en formato A4 estándar.
 * Genera un documento HTML aislado en un iframe invisible para garantizar que:
 * 1. Solo se imprima el folio de la factura (sin elementos de la web, sin menús, sin tablas de fondo).
 * 2. Sea 100% inmune al modo oscuro o estilos de la aplicación.
 * 3. Encaje limpiamente en un único folio A4 para facturas habituales.
 * 4. El navegador proponga automáticamente el nombre oficial del archivo (ej. Factura_FAC-2026-001.pdf).
 */

export function generarHtmlFactura(factura, config) {
  const currency = config?.pos?.currencySymbol || '€';
  const taxRate = factura.ivaPorcentaje || config?.pos?.defaultTaxRate || 21;
  const baseImponible = parseFloat(factura.baseImponible || 0).toFixed(2);
  const ivaCuota = parseFloat(factura.ivaCuota || 0).toFixed(2);
  const total = parseFloat(factura.total || 0).toFixed(2);

  const itemsRows = (factura.items || [])
    .map(
      (it, idx) => `
      <tr>
        <td class="col-code">${it.codigo || `ART-${idx + 1}`}</td>
        <td class="col-desc">${it.descripcion || 'Concepto'}</td>
        <td class="col-qty">${it.cantidad || 1}</td>
        <td class="col-price">${parseFloat(it.precioUnitario || 0).toFixed(2)} ${currency}</td>
        <td class="col-total">${parseFloat(it.total || 0).toFixed(2)} ${currency}</td>
      </tr>
    `
    )
    .join('');

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
      color: #111827 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      width: 100%;
    }

    .invoice-container {
      width: 100%;
      max-width: 210mm;
      box-sizing: border-box;
      padding: 12mm 15mm 10mm 15mm;
      margin: 0 auto;
      background: #ffffff;
    }

    /* CABECERA: EMISOR Y METADATOS FACTURA */
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 14px;
      gap: 20px;
    }

    .issuer-col {
      flex: 1;
    }

    .section-eyebrow {
      font-size: 9px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }

    .issuer-name {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 3px 0;
      text-transform: uppercase;
      letter-spacing: -0.01em;
    }

    .issuer-activity {
      font-size: 11px;
      font-weight: 500;
      color: #4b5563;
      margin: 0 0 8px 0;
    }

    .issuer-data {
      font-size: 11px;
      line-height: 1.45;
      color: #374151;
    }

    .invoice-meta-col {
      text-align: right;
      min-width: 230px;
    }

    .invoice-title {
      font-size: 28px;
      font-weight: 900;
      color: #111827;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
      line-height: 1;
    }

    .meta-box {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 3px;
      padding: 8px 10px;
      font-size: 11px;
      text-align: left;
    }

    .meta-item {
      display: flex;
      justify-content: space-between;
      padding: 2.5px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .meta-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .meta-label {
      color: #6b7280;
      font-weight: 500;
    }

    .meta-value {
      font-weight: 700;
      color: #111827;
    }

    /* RECEPTOR / CLIENTE */
    .client-box {
      margin-top: 14px;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 3px;
    }

    .client-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 11px;
      margin-top: 6px;
    }

    .client-field-label {
      font-size: 9.5px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }

    .client-field-value {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
    }

    .client-field-sub {
      font-size: 11px;
      color: #374151;
    }

    /* TABLA DE CONCEPTOS */
    .table-container {
      margin-top: 16px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 10px;
      border-top: 1px solid #d1d5db;
      border-bottom: 2px solid #111827;
      text-align: left;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
      color: #111827;
    }

    .col-code {
      width: 14%;
      font-family: monospace;
      color: #4b5563;
    }

    .col-desc {
      width: 50%;
      font-weight: 500;
    }

    .col-qty {
      width: 8%;
      text-align: center;
      font-weight: 600;
    }

    .col-price {
      width: 14%;
      text-align: right;
    }

    .col-total {
      width: 14%;
      text-align: right;
      font-weight: 700;
    }

    /* CONDICIONES PAGO + TOTALES */
    .bottom-row {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .payment-box {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 3px;
      font-size: 10.5px;
      line-height: 1.45;
      color: #374151;
    }

    .payment-title {
      font-size: 10px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .totals-box {
      width: 250px;
      font-size: 11.5px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #e5e7eb;
      color: #4b5563;
    }

    .total-row-highlight {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      margin-top: 6px;
      background: #f3f4f6;
      border: 2px solid #111827;
      border-radius: 3px;
      font-size: 13px;
      font-weight: 800;
      color: #111827;
    }

    .grand-total {
      font-size: 16px;
    }

    /* PIE LEGAL */
    .legal-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #d1d5db;
      text-align: center;
      font-size: 9px;
      line-height: 1.45;
      color: #6b7280;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- CABECERA -->
    <div class="header-row">
      <div class="issuer-col">
        <div class="section-eyebrow">DATOS FISCALES DEL EMISOR</div>
        <h1 class="issuer-name">${config.company.legalName}</h1>
        <div class="issuer-activity">${config.company.activity}</div>
        <div class="issuer-data">
          <div><strong>NIF / CIF:</strong> ${config.company.cif}</div>
          <div><strong>Domicilio:</strong> ${config.company.address}</div>
          <div><strong>Teléfono:</strong> ${config.company.phone} | <strong>Email:</strong> ${config.company.email}</div>
          ${config.company.website ? `<div><strong>Web:</strong> ${config.company.website}</div>` : ''}
        </div>
      </div>

      <div class="invoice-meta-col">
        <div class="invoice-title">FACTURA</div>
        <div class="meta-box">
          <div class="meta-item">
            <span class="meta-label">Nº Factura:</span>
            <span class="meta-value">${factura.numeroFactura || '---'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Fecha Emisión:</span>
            <span class="meta-value">${factura.fecha || '---'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Vencimiento:</span>
            <span class="meta-value">${factura.fechaVencimiento || factura.fecha || '---'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Forma de Pago:</span>
            <span class="meta-value" style="text-transform:uppercase;">${factura.formaPago || 'Contado'}</span>
          </div>
          ${
            factura.ticketOrigen
              ? `
            <div class="meta-item" style="font-size:10px; color:#6b7280;">
              <span>Ticket de origen:</span>
              <span><strong>${factura.ticketOrigen}</strong></span>
            </div>
          `
              : ''
          }
        </div>
      </div>
    </div>

    <!-- CLIENTE -->
    <div class="client-box">
      <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding-bottom:3px;">
        <span class="section-eyebrow" style="color:#4b5563;">FACTURAR A / DATOS DEL DESTINATARIO</span>
        <span style="font-size:9px; color:#9ca3af; font-weight:600;">DOCUMENTO FISCAL VÁLIDO</span>
      </div>
      <div class="client-grid">
        <div>
          <div class="client-field-label">Nombre / Razón Social:</div>
          <div class="client-field-value">${factura.clienteNombre || 'Cliente General'}</div>
        </div>
        <div>
          <div class="client-field-label">NIF / CIF / DNI:</div>
          <div class="client-field-value">${factura.clienteDni || 'No especificado'}</div>
        </div>
        <div>
          <div class="client-field-label">Domicilio Fiscal:</div>
          <div class="client-field-sub">${factura.clienteDireccion || 'Venta presencial en tienda'}</div>
        </div>
        <div>
          <div class="client-field-label">Contacto:</div>
          <div class="client-field-sub">
            ${[factura.clienteTelefono && `Tel: ${factura.clienteTelefono}`, factura.clienteEmail && `Email: ${factura.clienteEmail}`].filter(Boolean).join(' | ') || '---'}
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA DE CONCEPTOS -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-code">CÓDIGO</th>
            <th class="col-desc">DESCRIPCIÓN</th>
            <th class="col-qty">CANT.</th>
            <th class="col-price">PRECIO UD.</th>
            <th class="col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="5" style="text-align:center; padding:15px; color:#9ca3af;">Sin líneas de detalle.</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- PAGO Y TOTALES -->
    <div class="bottom-row">
      <div class="payment-box">
        <div class="payment-title">DATOS BANCARIOS PARA PAGO / TRANSFERENCIA</div>
        <div><strong>Entidad Bancaria:</strong> ${config.company.bank || 'CaixaBank / Operativa Comercial'}</div>
        <div><strong>IBAN:</strong> ${config.company.iban}</div>
        <div><strong>Titular de la Cuenta:</strong> ${config.company.legalName}</div>
        <div style="font-size:9.5px; color:#6b7280; margin-top:4px;">
          * Indicar en el concepto de la transferencia el número de factura: <strong>${factura.numeroFactura}</strong>
        </div>
        ${
          factura.observaciones
            ? `<div style="margin-top:6px; padding-top:4px; border-top:1px dashed #d1d5db; font-style:italic;">
                <strong>Observaciones:</strong> ${factura.observaciones}
               </div>`
            : ''
        }
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Base Imponible:</span>
          <span style="font-weight:700; color:#111827;">${baseImponible} ${currency}</span>
        </div>
        <div class="total-row">
          <span>I.V.A. (${taxRate}%):</span>
          <span style="font-weight:700; color:#111827;">${ivaCuota} ${currency}</span>
        </div>
        <div class="total-row-highlight">
          <span>TOTAL FACTURA:</span>
          <span class="grand-total">${total} ${currency}</span>
        </div>
      </div>
    </div>

    <!-- PIE LEGAL -->
    <div class="legal-footer">
      <div><strong>${config.company.legalName}</strong> · CIF: ${config.company.cif} · ${config.company.address}</div>
      <div>${config.company.regData}</div>
      <div style="margin-top:2px;">
        Factura expedida en cumplimiento del Real Decreto 1619/2012, de 30 de noviembre, por el que se aprueba el Reglamento de facturación.
      </div>
      <div style="font-size:8.5px; color:#9ca3af; margin-top:2px;">
        Protección de Datos: En cumplimiento del RGPD (UE 2016/679), los datos personales de facturación se incorporan a nuestros tratamientos contables y fiscales legalmente exigibles.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Lanza la impresión de la factura aislada de forma 100% limpia sin tocar el DOM principal
 */
export function imprimirFacturaA4(factura, config) {
  if (!factura) return;

  const htmlContent = generarHtmlFactura(factura, config);

  // Buscar o crear iframe de impresión aislado
  let iframe = document.getElementById('erp-invoice-print-frame');
  if (iframe) {
    iframe.remove();
  }

  iframe = document.createElement('iframe');
  iframe.id = 'erp-invoice-print-frame';
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

  // Esperar a que el documento termine de renderizar fuentes y estilos
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('Error al imprimir factura vía iframe:', err);
      // Fallback a ventana emergente si el navegador bloquea iframe print
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

/**
 * Impresión limpia y aislada de comprobantes / tickets de caja (80mm o folio)
 */
export function imprimirTicketTermico(ticket, config) {
  if (!ticket) return;

  const currency = config?.pos?.currencySymbol || '€';
  const taxRate = config?.pos?.defaultTaxRate || 21;

  // Si es un comprobante de cambio o vale de devolución
  if (ticket.tipo === 'Devolución con Vale' || (ticket.codigo && ticket.tipo && !ticket.numeroTicket)) {
    const isVale = ticket.tipo === 'Devolución con Vale';
    const htmlVale = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Resguardo_${ticket.codigo}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 280px;
    }
    .text-center { text-align: center; }
    .border-b { border-bottom: 1px dashed #444; padding-bottom: 6px; margin-bottom: 6px; }
    .flex-between { display: flex; justify-content: space-between; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="text-center border-b">
    <div style="font-size:14px;" class="bold">${config.company.legalName}</div>
    <div style="font-size:10px;">${config.company.activity}</div>
    <div>CIF: ${config.company.cif}</div>
    <div style="font-size:10px;">${config.company.address}</div>
    <div>TEL: ${config.company.phone}</div>
  </div>

  <div class="border-b" style="font-size:10px;">
    <div class="bold" style="font-size:12px; text-align:center; margin-bottom:4px;">
      ${isVale ? '*** VALE DE CAJA / TIENDA ***' : '*** EXPEDIENTE DE CAMBIO ***'}
    </div>
    <div>CÓDIGO: <strong>${ticket.codigo}</strong></div>
    <div>FECHA: ${ticket.fecha || new Date().toISOString().split('T')[0]}</div>
    <div>CLIENTE: <strong>${ticket.clienteNombre || 'Cliente General'}</strong></div>
    <div>TICKET ORIGEN: ${ticket.ticketOrigen || '---'}</div>
    <div>PRENDA: ${ticket.producto || 'Prenda'}</div>
    ${isVale ? `<div>TALLA DEVUELTA: ${ticket.tallaDevuelta || 'M'}</div>` : `<div>PERMUTA: ${ticket.tallaDevuelta} &rarr; ${ticket.nuevaTalla}</div>`}
    <div>ATENDIDO POR: ${ticket.atendidoPor || 'Cajero'}</div>
  </div>

  ${isVale ? `
  <div class="border-b" style="text-align:center; padding:8px 0;">
    <div style="font-size:10px; color:#555;">SALDO DEL VALE:</div>
    <div class="bold" style="font-size:18px;">${parseFloat(ticket.importe || 0).toFixed(2)} ${currency}</div>
    <div style="font-size:10px; margin-top:2px;">ESTADO: <strong>${(ticket.estado || 'PENDIENTE').toUpperCase()}</strong></div>
  </div>
  <div class="text-center" style="font-size:9px; color:#555; margin-top:6px;">
    <div>CANJEABLE EN CUALQUIER COMPRA EN TIENDA</div>
    <div>VÁLIDO POR 1 AÑO DESDE LA FECHA DE EMISIÓN</div>
    <div>CONSERVE ESTE DOCUMENTO</div>
  </div>
  ` : `
  <div class="text-center" style="font-size:9px; color:#555; margin-top:6px;">
    <div>CAMBIO DE TALLA REGISTRADO EN SISTEMA</div>
    <div>GRACIAS POR SU CONFIANZA</div>
  </div>
  `}
</body>
</html>`;

    let iframe = document.getElementById('erp-ticket-print-frame');
    if (iframe) iframe.remove();
    iframe = document.createElement('iframe');
    iframe.id = 'erp-ticket-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlVale);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error(e);
      }
    }, 250);
    return;
  }

  const base = (ticket.baseImponible || ticket.total / (1 + taxRate / 100) || 0).toFixed(2);
  const iva = (ticket.iva || ticket.total - base || 0).toFixed(2);
  const total = parseFloat(ticket.total || 0).toFixed(2);

  const itemsHtml = (ticket.lineas || ticket.items || [])
    .map(
      (l) => `
      <div style="display:flex; justify-content:space-between; margin-bottom:3px; font-size:11px;">
        <span style="flex:1;">${l.cantidad || 1}x ${l.nombre || l.descripcion || 'Artículo'}</span>
        <span style="font-weight:bold; font-family:monospace;">${parseFloat(l.subtotal || (l.cantidad * l.precio) || l.total || 0).toFixed(2)} ${currency}</span>
      </div>
    `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket_${ticket.numeroTicket || ticket.codigo || 'TPV'}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 6px;
      width: 280px;
    }
    .text-center { text-align: center; }
    .border-b { border-bottom: 1px dashed #444; padding-bottom: 6px; margin-bottom: 6px; }
    .border-t { border-top: 1px dashed #444; padding-top: 6px; margin-top: 6px; }
    .flex-between { display: flex; justify-content: space-between; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="text-center border-b">
    <div style="font-size:14px;" class="bold">${config.company.legalName}</div>
    <div style="font-size:10px;">${config.company.activity}</div>
    <div>CIF: ${config.company.cif}</div>
    <div style="font-size:10px;">${config.company.address}</div>
    <div>TEL: ${config.company.phone}</div>
  </div>

  <div class="border-b" style="font-size:10px;">
    <div>COMPROBANTE: <strong>${ticket.numeroTicket || ticket.codigo || 'TICK-TPV'}</strong></div>
    <div>FECHA: ${ticket.fecha || new Date().toISOString().split('T')[0]}</div>
    <div>CLIENTE: ${ticket.clienteNombre || 'Cliente General'}</div>
    <div>FORMA PAGO: ${(ticket.metodoPago || ticket.tipo || 'EFECTIVO').toUpperCase()}</div>
  </div>

  <div class="border-b">
    <div style="margin-bottom:4px; font-weight:bold; font-size:10px;">DETALLE DE ARTÍCULOS:</div>
    ${itemsHtml || '<div>Artículos de venta</div>'}
  </div>

  <div class="border-b" style="font-size:10px;">
    ${ticket.descuentoVale > 0 ? `
    <div class="flex-between"><span>SUBTOTAL BRUTO:</span><span>${parseFloat(ticket.subtotalBruto || 0).toFixed(2)} ${currency}</span></div>
    <div class="flex-between bold"><span>DESCUENTO VALE (${ticket.valeCodigo || 'CANJE'}):</span><span>-${parseFloat(ticket.descuentoVale).toFixed(2)} ${currency}</span></div>
    ` : ''}
    <div class="flex-between"><span>BASE IMPONIBLE:</span><span>${base} ${currency}</span></div>
    <div class="flex-between"><span>I.V.A. (${taxRate}%):</span><span>${iva} ${currency}</span></div>
    <div class="flex-between bold" style="font-size:13px; margin-top:4px; border-top:1px solid #000; padding-top:2px;">
      <span>TOTAL:</span><span>${total} ${currency}</span>
    </div>
  </div>

  <div class="text-center" style="font-size:9px; color:#555;">
    <div>FACTURA SIMPLIFICADA (RD 1619/2012)</div>
    <div>PLAZO DEVOLUCIÓN: 30 DÍAS</div>
    <div>GRACIAS POR SU VISITA</div>
  </div>
</body>
</html>`;

  let iframe = document.getElementById('erp-ticket-print-frame');
  if (iframe) iframe.remove();
  iframe = document.createElement('iframe');
  iframe.id = 'erp-ticket-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error(e);
    }
  }, 250);
}

export { imprimirInformeOficial, generarHtmlInforme } from './reportPrinter';

