// Deja solo dígitos y K
export const limpiarRut = (rut) => rut.replace(/[^0-9kK]/g, "").toUpperCase();

// Validación con el algoritmo módulo 11
export function validarRut(rut) {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(limpio)) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === esperado;
}

// 12.345.678-5 -> ****678-5 (solo se muestran los últimos dígitos)
export function enmascararRut(rut) {
  const limpio = limpiarRut(rut);
  if (limpio.length < 4) return "***";
  return (
    "*".repeat(limpio.length - 4) +
    limpio.slice(-4, -1) +
    "-" +
    limpio.slice(-1)
  );
}
