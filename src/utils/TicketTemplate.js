import { formatearFecha, formatearHora } from "./dates"

const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const decenas = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
]
const especiales = {
  11: 'ONCE',
  12: 'DOCE',
  13: 'TRECE',
  14: 'CATORCE',
  15: 'QUINCE',
  16: 'DIECISEIS',
  17: 'DIECISIETE',
  18: 'DIECIOCHO',
  19: 'DIECINUEVE',
  21: 'VEINTIUN',
  22: 'VEINTIDOS',
  23: 'VEINTITRES',
  24: 'VEINTICUATRO',
  25: 'VEINTICINCO',
  26: 'VEINTISEIS',
  27: 'VEINTISIETE',
  28: 'VEINTIOCHO',
  29: 'VEINTINUEVE',
}
const centenas = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
]

/**
 * Convierte un número a su representación en texto en español (hasta 999)
 * @param {number} n - Número a convertir
 * @returns {string} Representación en texto del número
 */

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
  return String(n)
}

/**
 * Convierte un monto numérico a su representación en texto en español, incluyendo decimales
 * @param {number} monto - Monto a convertir
 * @returns {string} Representación en texto del monto
 */
const montoEnLetras = (monto) => {
  const entero = Math.floor(monto)
  const decimales = Math.round((monto - entero) * 100)
  return `${numeroATexto(entero)} CON ${String(decimales).padStart(2, '0')}/100 SOLES`
}

/**
 * Genera el HTML para un ticket de venta basado en los datos de la venta y opciones de formato
 * @param {Object} sale - Objeto con los datos de la venta
 * @param {Object} options - Opciones de formato para el ticket
 * @returns {string} HTML formateado para el ticket de venta
 */
export const getTicketHTML = (sale, options = {}) => {
  const {
    nombreNegocio = 'MI NEGOCIO',
    ruc = '',
    direccion = '',
    telefono = '',
    cajero = '',
    logoUrl = '',
    anchoMm = 80,
  } = options

  const fullDate = formatearFecha(sale.timestamp);
  const time = formatearHora(sale.timestamp);
  const date = fullDate.split(',')[0];
  const total = Number(sale.totalAmount || 0)
  const items = sale.items || []

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* TIPOGRAFÍA ORGÁNICA: Sans-Serif moderna */
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    @page { size: ${anchoMm}mm auto; margin: 0; }
    
    body {
      width: ${anchoMm}mm;
      padding: 5mm; /* Un poco más de aire en los bordes */
      background-color: #fff;
      color: #000;
      line-height: 1.3;
      font-size: 11pt; /* Letra más grande como pediste */
    }

    .center { text-align: center; }
    .bold { font-weight: 700; }
    
    .negocio-nombre { 
      font-size: 15pt; 
      font-weight: 800; 
      text-align: center; 
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .negocio-logo { 
      display: block; 
      margin: 8px auto; 
      max-width: 150px; /* Logo imponente */
      filter: grayscale(1) contrast(1.2); 
    }

    .negocio-info { 
      text-align: center; 
      font-size: 10pt; 
      color: #333;
      margin-bottom: 2px;
    }

    .separator-bold { border-top: 2.5pt solid #000; margin: 8px 0; }
    .separator-dashed { border-top: 1pt dashed #000; margin: 8px 0; }

    .doc-info { text-align: center; margin: 12px 0; }
    .doc-title { font-size: 12pt; letter-spacing: 1px; }
    .doc-number { font-size: 15pt; font-weight: 800; margin-top: 2px; }

    .meta-info { font-size: 10pt; margin-bottom: 12px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 2px; }

    table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin: 10px 0; }
    th { border-bottom: 1.5pt solid #000; padding-bottom: 4px; text-align: left; }
    td { padding: 6px 0; vertical-align: top; }
    
    /* Ampliado el ancho para que entre la unidad (ej. "12 UNI") */
    .qty { width: 22%; text-align: left; }
    .desc { width: 48%; font-weight: 500; }
    .total-col { width: 30%; text-align: right; font-weight: 600; }

    .total-container { margin-top: 10px; }
    .total-row { 
      font-size: 18pt; /* El total debe gritar */
      display: flex; 
      justify-content: space-between; 
      border-top: 1.5pt solid #000;
      padding-top: 6px;
    }

    .letras { font-size: 9pt; font-weight: bold; margin-top: 8px; text-align: right; }

    .legal-msg { 
      border: 1.5pt solid #000; 
      padding: 6px; 
      font-size: 8.5pt; 
      text-align: center; 
      font-weight: 800; 
      margin: 15px 0;
      line-height: 1.1;
    }

    .footer { text-align: center; font-size: 10pt; margin-top: 10px; }
  </style>
</head>
<body>
    <div class="negocio-nombre">${nombreNegocio}</div>
    ${logoUrl ? `<img class="negocio-logo" src="${logoUrl}" />` : ''}
    
    <div class="negocio-info">${direccion}</div>
    ${telefono ? `<div class="negocio-info">TEL: ${telefono}</div>` : ''}
    ${ruc ? `<div class="center bold" style="font-size:11pt; margin-top:4px;">RUC: ${ruc}</div>` : ''}

    <div class="separator-bold"></div>

    <div class="doc-info">
      <div class="doc-title bold">NOTA DE VENTA</div>
      <div class="doc-number">${sale.ticketNumber || 'PENDIENTE'}</div>
    </div>

    <div class="separator-dashed"></div>

    <div class="meta-info">
      <div class="meta-row"><span>FECHA: ${date}</span> <span>HORA: ${time}</span></div>
      <div class="meta-row"><span>CAJERO: ${(cajero || 'S/N').toUpperCase()}</span></div>
      ${sale.clientName ? `<div class="meta-row"><span>CLIENTE: ${sale.clientName.toUpperCase()}</span></div>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th class="qty">CANT</th>
          <th class="desc">PRODUCTO</th>
          <th class="total-col">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
        <tr>
          <td class="qty">${item.qty} ${item.unidad || 'UNI'}</td>
          <td class="desc">${(item.name || '').toUpperCase()}</td>
          <td class="total-col">S/ ${(item.price * item.qty).toFixed(2)}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <div class="total-container">
      <div class="total-row bold">
        <span>TOTAL</span>
        <span>S/ ${total.toFixed(2)}</span>
      </div>
      
      <div class="payments-details" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #000; font-size: 10pt;">
        ${(sale.payments || []).map(p => {
          let mName = p.wallet || p.method || 'CASH';
          if(mName === 'CASH') mName = 'EFECTIVO';
          return `<div class="meta-row">
            <span>${mName.toUpperCase()}</span>
            <span>S/ ${(p.amount || 0).toFixed(2)}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="letras">SON: ${montoEnLetras(total)}</div>
    </div>

    <div class="legal-msg">ESTE NO ES UN COMPROBANTE DE PAGO VÁLIDO</div>
    <div class="footer bold">¡GRACIAS POR SU PREFERENCIA!</div>
</body>
</html>`
}