/**
 * COMPOSABLE: usePrintTicket

 * ventana de impresión con formato de nota de venta
 * tamanio ajustable
 
 * campos opcionales del negocio (ruc, direccion, telefono) pueden
 * agregarse en el futuro desde la configuración de sucursal

 * @autor JoseGordilloMendoza 
 */

import { formatearFecha } from '@/utils/dates'


// numero a texto
// @param {number} monto
// @returns {string}

const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const especiales = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISEIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIUN', 22: 'VEINTIDOS', 23: 'VEINTITRES', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISEIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
}
const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function numeroATexto(n) {
    if (n === 0) return 'CERO'
    if (n === 100) return 'CIEN'
    if (n < 10) return unidades[n]
    if (especiales[n]) return especiales[n]
    if (n < 100) {
        const d = Math.floor(n / 10)
        const u = n % 10
        return u === 0 ? decenas[d] : `${decenas[d]} Y ${unidades[u]}`
    }
    if (n < 1000) {
        const c = Math.floor(n / 100)
        const resto = n % 100
        if (resto === 0) return n === 100 ? 'CIEN' : centenas[c]
        return `${centenas[c]} ${numeroATexto(resto)}`
    }
    if (n < 10000) {
        const miles = Math.floor(n / 1000)
        const resto = n % 1000
        const prefix = miles === 1 ? 'MIL' : `${numeroATexto(miles)} MIL`
        return resto === 0 ? prefix : `${prefix} ${numeroATexto(resto)}`
    }
    return String(n)
}

function montoEnLetras(monto) {
    const entero = Math.floor(monto)
    const decimales = Math.round((monto - entero) * 100)
    const centavosStr = String(decimales).padStart(2, '0')
    return `${numeroATexto(entero)} CON ${centavosStr}/100 SOLES`
}

// metodo de pago
function obtenerMetodoPago(sale) {
    if (!sale.payments || sale.payments.length === 0) return 'EFECTIVO'
    const pay = sale.payments[0]
    if (pay.method === 'CASH') return 'EFECTIVO'
    return (pay.wallet || pay.method || 'EFECTIVO').toUpperCase()
}

// formato a timestamp
function formatTimestamp(ts) {
    let fecha
    if (ts && typeof ts.toDate === 'function') {
        fecha = ts.toDate()
    } else if (ts instanceof Date) {
        fecha = ts
    } else if (ts?.seconds) {
        fecha = new Date(ts.seconds * 1000)
    } else {
        fecha = new Date(ts)
    }

    if (isNaN(fecha.getTime())) return { date: '--/--/----', time: '--:--' }

    const dateStr = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const timeStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })

    return { date: dateStr, time: timeStr }
}

export function usePrintTicket() {

    /**
     * HTML del ticket y abre ventana de impresión
     * @param {Object} sale - documento de venta con items, payments, totalAmount, etc.
     * @param {Object} options - Opciones del negocio
     * @param {string} options.nombreNegocio - Nombre del negocio/sucursal
     * @param {string} [options.ruc] - RUC del negocio (opcional)
     * @param {string} [options.direccion] - Dirección (opcional)
     * @param {string} [options.telefono] - Teléfono (opcional)
     * @param {string} [options.cajero] - Nombre del cajero (opcional)
     * @param {number} [options.anchoMm=80] - Ancho del papel en mm (58 o 80)
     */
    const imprimirTicket = (sale, options = {}) => {
        if (!sale) return

        const {
            nombreNegocio = 'MI NEGOCIO',
            ruc = '',
            direccion = '',
            telefono = '',
            logoUrl = '',
            cajero = '',
            logoUrl = '',
            anchoMm = 80
        } = options

        const total = Number(sale.totalAmount || sale.amount || 0)
        const metodoPago = obtenerMetodoPago(sale)
        const { date, time } = formatTimestamp(sale.timestamp)
        const items = sale.items || []

        // Construir filas de productos
        const itemsHTML = items.map(item => {
            return `
        <tr>
          <td class="qty">${item.qty}</td>
          <td class="desc">${(item.name || '').toUpperCase()}</td>
          <td class="price">${Number(item.price).toFixed(2)}</td>
          <td class="total">${(item.price * item.qty).toFixed(2)}</td>
        </tr>`
        }).join('')

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: ${anchoMm}mm auto;
      margin: 0;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      width: ${anchoMm}mm;
      padding: 4mm;
      background-color: #fff;
      color: #000;
      line-height: 1.2;
    }

    .ticket-wrapper { width: 100%; }

    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    
    .negocio-nombre {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .negocio-logo {
      display: block;
      margin: 4px auto 2px;
      max-width: 80px;
      max-height: 60px;
      object-fit: contain;
    }

    .negocio-info {
      text-align: center;
      font-size: 9px;
      color: #333;
      line-height: 1.4;
    }

    .separator { border-top: 1px dashed #000; margin: 5px 0; }
    .separator-bold { border-top: 2px solid #000; margin: 5px 0; }

    .doc-info { text-align: center; margin: 8px 0; }
    .doc-title { font-size: 13px; font-weight: bold; }
    .doc-number { font-size: 14px; font-weight: bold; }

    .meta-info { font-size: 9px; margin-bottom: 10px; }
    .meta-row { display: flex; justify-content: space-between; }

    table { width: 100%; border-collapse: collapse; font-size: 9px; margin: 10px 0; }
    th { border-bottom: 1px solid #000; padding: 3px 0; text-align: left; }
    td { padding: 3px 0; vertical-align: top; }
    .qty { width: 10%; text-align: center; }
    .desc { width: 55%; }
    .price { width: 15%; text-align: right; }
    .total { width: 20%; text-align: right; }

    .total-container { text-align: right; margin: 10px 0; }
    .total-row { font-size: 15px; font-weight: bold; display: flex; justify-content: space-between; }
    
    .legal-msg { 
      border: 1px solid #000; 
      padding: 5px; 
      font-size: 8px; 
      text-align: center; 
      font-weight: bold;
      margin: 10px 0;
    }

    .footer { text-align: center; font-size: 9px; margin-top: 15px; }

    @media print {
      body { width: ${anchoMm}mm; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- ENCABEZADO DEL NEGOCIO -->
    <div class="negocio-nombre">${nombreNegocio}</div>
    ${logoUrl ? `<img class="negocio-logo" src="${logoUrl}" alt="logo" />` : ''}
    ${direccion ? `<div class="negocio-info">${direccion}</div>` : ''}
    ${telefono ? `<div class="negocio-info">TEL: ${telefono}</div>` : ''}
    ${ruc ? `<div class="center bold" style="font-size:11px; margin-top:3px">RUC: ${ruc}</div>` : ''}

    <hr class="separator-double">

    <!-- TITULO DEL DOCUMENTO -->
    <div class="doc-title">NOTA DE VENTA</div>
    ${sale.ticketNumber ? `<div class="ticket-number">${sale.ticketNumber}</div>` : ''}

    <hr class="separator">

    <!-- INFO DE LA VENTA -->
    ${sale.clientName ? `
    <div class="info-row">
      <span class="info-label">CLIENTE:</span>
      <span>${sale.clientName}</span>
    </div>` : ''}
    <div class="info-row">
      <span class="info-label">FECHA EMISIÓN:</span>
      <span>${date}</span>
    </div>

    <div class="separator-bold"></div>
    
    <div class="doc-info">
      <div class="doc-title">NOTA DE VENTA</div>
      <div class="doc-number">${sale.ticketNumber || 'PENDIENTE'}</div>
    </div>

    <div class="separator"></div>

    <div class="meta-info">
      <div class="meta-row"><span>FECHA: ${date}</span> <span>HORA: ${time}</span></div>
      ${sale.clientName ? `<div class="meta-row"><span>CLIENTE: ${sale.clientName.toUpperCase()}</span></div>` : ''}
      ${cajero ? `<div class="meta-row"><span>CAJERO: ${cajero.toUpperCase()}</span></div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th class="qty">CANT</th>
          <th class="desc">DESCRIPCIÓN</th>
          <th class="price">P/U</th>
          <th class="total">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="separator-bold"></div>

    <div class="total-container">
      <div class="total-row">
        <span>TOTAL:</span>
        <span>S/ ${total.toFixed(2)}</span>
      </div>
      <div style="font-size: 8px; font-weight: bold; margin-top: 5px;">
        SON: ${montoEnLetras(total)}
      </div>
    </div>

    <div class="legal-msg">
      ESTE NO ES UN COMPROBANTE DE PAGO VÁLIDO
    </div>

    <div class="footer">
      <div>PAGO CON: ${metodoPago}</div>
      <div style="margin-top: 5px; font-weight: bold;">¡GRACIAS POR SU PREFERENCIA!</div>
    </div>
  </div>

  <script>
    window.onload = () => {
      window.print();
      window.onafterprint = () => window.close();
    };
  <\/script>
</body>
</html>`

        const printWindow = window.open('', '_blank', 'width=600,height=800,top=100,left=100')
        if (printWindow) {
            printWindow.document.body.innerHTML = html;
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        }
    }

    return { imprimirTicket }
}
