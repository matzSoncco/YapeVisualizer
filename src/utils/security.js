/**
 * Genera un hash SHA-256 de una cadena de texto (PIN)
 * @param {string} text - El PIN en texto plano
 * @returns {Promise<string>} - El hash en formato hexadecimal
 */
export async function hashPin(text) {
  const msgUint8 = new TextEncoder().encode(text);                           // Codificar como (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // Hashear el mensaje
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // Convertir buffer a byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convertir bytes a string hexadecimal
  return hashHex;
}