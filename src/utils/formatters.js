/**
 * Formatea un valor a moneda (S/ 0.00) de forma segura
 * @param {number|string} valor 
 * @returns {string}
 */
export const formatMonto = (valor) => {
  const num = parseFloat(valor);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
};