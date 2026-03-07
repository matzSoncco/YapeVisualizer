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
            cajero = '',
            anchoMm = 80
        } = options

        // conversión pixel a tamanio hojas: ~4px por mm (96dpi / 25.4mm)
        const anchoPx = Math.round(anchoMm * 4)

        const total = Number(sale.totalAmount || sale.amount || 0)
        const metodoPago = obtenerMetodoPago(sale)
        const { date, time } = formatTimestamp(sale.timestamp)
        const items = sale.items || []

        // Construir filas de productos
        const itemsHTML = items.map(item => {
            const subtotal = (item.price * item.qty).toFixed(2)
            return `
        <tr>
          <td style="text-align:center">${item.qty}</td>
          <td>${(item.name || '').toUpperCase()}</td>
          <td style="text-align:right">${Number(item.price).toFixed(2)}</td>
          <td style="text-align:right">${subtotal}</td>
        </tr>`
        }).join('')

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nota de Venta ${sale.ticketNumber || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: ${anchoMm}mm auto;
      margin: 2mm;
    }

    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${anchoMm <= 58 ? '9px' : '11px'};
      color: #000;
      width: ${anchoPx}px;
      margin: 0 auto;
      padding: ${anchoMm <= 58 ? '4px' : '8px'};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ticket { width: 100%; }

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

    .negocio-info {
      text-align: center;
      font-size: 9px;
      color: #333;
      line-height: 1.4;
    }

    .separator {
      border: none;
      border-top: 1px dashed #000;
      margin: 6px 0;
    }

    .separator-double {
      border: none;
      border-top: 2px solid #000;
      margin: 6px 0;
    }

    .doc-title {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 4px 0;
    }

    .ticket-number {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      margin: 2px 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin: 1px 0;
    }

    .info-label {
      font-weight: bold;
      color: #333;
    }

    .disclaimer {
      text-align: center;
      font-size: 8px;
      font-weight: bold;
      margin: 4px 0;
      padding: 3px;
      border: 1px solid #000;
    }

    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    table.items thead th {
      font-weight: bold;
      text-align: left;
      padding: 2px 3px;
      border-bottom: 1px solid #000;
      font-size: 9px;
    }

    table.items tbody td {
      padding: 2px 3px;
      vertical-align: top;
    }

    .total-section {
      margin-top: 4px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: bold;
      padding: 3px 0;
    }

    .monto-letras {
      font-size: 9px;
      font-weight: bold;
      margin: 2px 0;
    }

    .pago-info {
      font-size: 10px;
      margin: 1px 0;
    }

    .footer-msg {
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      margin-top: 8px;
      letter-spacing: 1px;
    }

    .cajero-info {
      font-size: 9px;
      margin: 2px 0;
    }

    @media print {
      body { width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- ENCABEZADO DEL NEGOCIO -->
    <div class="negocio-nombre">${nombreNegocio}</div>
    ${direccion ? `<div class="negocio-info">${direccion}</div>` : ''}
    ${telefono ? `<div class="negocio-info">TEL: ${telefono}</div>` : ''}
    ${ruc ? `<div class="center bold" style="font-size:11px; margin-top:3px">RUC: ${ruc}</div>` : ''}

    <hr class="separator-double">

    <!-- TITULO DEL DOCUMENTO -->
    <div class="doc-title">NOTA DE VENTA</div>
    <div class="ticket-number">${sale.ticketNumber || 'PENDIENTE'}</div>

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
    <div class="info-row">
      <span class="info-label">HORA:</span>
      <span>${time}</span>
    </div>
    <div class="info-row">
      <span class="info-label">MONEDA:</span>
      <span>SOLES</span>
    </div>

    <hr class="separator">

    <div class="disclaimer">ESTE NO ES UN COMPROBANTE DE PAGO VÁLIDO</div>

    <!-- DETALLE DE PRODUCTOS -->
    <table class="items">
      <thead>
        <tr>
          <th style="width:35px; text-align:center">CANT.</th>
          <th>DESCRIPCIÓN</th>
          <th style="text-align:right">P/U</th>
          <th style="text-align:right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <hr class="separator-double">

    <!-- TOTALES -->
    <div class="total-section">
      <div class="total-row">
        <span>TOTAL S/</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>

    <hr class="separator">

    <!-- MONTO EN LETRAS Y PAGO -->
    <div class="monto-letras">SON: ${montoEnLetras(total)}</div>
    <div class="pago-info bold">PAGO CON: ${metodoPago}    MONTO: ${total.toFixed(2)}</div>
    ${cajero ? `<div class="cajero-info">ATENDIDO POR: ${cajero}</div>` : ''}

    <hr class="separator">

    <!-- PIE -->
    <div class="footer-msg">¡ GRACIAS POR SU PREFERENCIA !</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  <\/script>
</body>
</html>`

        const popupWidth = anchoPx + 40
        const printWindow = window.open('', '_blank', `width=${popupWidth},height=600`)
        if (printWindow) {
            printWindow.document.write(html)
            printWindow.document.close()
        }
    }

    return { imprimirTicket }
}
