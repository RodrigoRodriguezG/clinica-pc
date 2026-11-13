// Para buscar sin distinguir mayúsculas ni acentos
export const normalizar = (texto) =>
  String(texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Deja solo los 9 dígitos de un celular, aunque escriban "+56 9 1234 5678"
export function normalizarTelefono(telefono) {
  let digitos = String(telefono ?? "").replace(/\D/g, "");
  if (digitos.length === 11 && digitos.startsWith("56"))
    digitos = digitos.slice(2);
  return digitos;
}

// Nombre completo de un propietario, tolerando campos vacíos
export const nombreCompleto = (p) =>
  [p.nombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(" ");

// 912345678 -> +56 9 1234 5678
export function mostrarTelefono(telefono) {
  const d = normalizarTelefono(telefono);
  return d.length === 9 ? `+56 ${d[0]} ${d.slice(1, 5)} ${d.slice(5)}` : d;
}
