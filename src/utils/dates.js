/**
 * Formatea una fecha (String ISO o Objeto Date) a un formato legible en español (Perú)
 * @param {string|Date} fechaInput - Fecha en formato ISO o Objeto Date
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fechaInput) => {
  if (!fechaInput) return 'Indefinido';

  let fecha;

  if (fechaInput instanceof Date) {
    fecha = fechaInput;
  } 
  else if (typeof fechaInput === 'string') {
    fecha = new Date(fechaInput.includes('T') ? fechaInput : `${fechaInput}T12:00:00`);
  }
  else {
    fecha = new Date(fechaInput);
  }

  if (isNaN(fecha.getTime())) return 'Fecha inválida';

  return fecha.toLocaleString('es-PE', {
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatearHora = (timestampRecibido) => {
  if (!timestampRecibido) return '--:--';
  const horaFormateada = timestampRecibido.toDate ? timestampRecibido.toDate() : new DAte(timestampRecibido);
  return horaFormateada.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}