/**
 * Formatea una fecha ISO a un formato legible en español (Perú)
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string} Fecha formateada o 'Indefinido' si no se proporciona fechaIso
 */
export const formatearFecha = (fechaISO) => {
  if (!fechaISO) return 'Indefinido';
  const fecha = new Date(fechaISO.includes('T') ? fechaISO : `${fechaISO}T12:00:00`); 
  
  return fecha.toLocaleDateString('es-PE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
};