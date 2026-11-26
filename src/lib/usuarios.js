import { permisosDeRol } from "./roles.js";
import { fichasEnCursoDe } from "./fichas.js";
import { FORMATO_CORREO } from "./importacion.js";

// Cambio de rol: el usuario queda con los permisos base del nuevo rol
export const aplicarRol = (datos, usuario, rol) => ({
  ...usuario,
  rol,
  permisos: permisosDeRol(datos, rol),
});

// Motivo por el que no se puede cambiar el rol de alguien (null si se puede)
export function motivoBloqueoCambioRol(datos, usuario, yo) {
  if (usuario.id === yo.id) return "No puedes cambiar tu propio rol.";
  if (fichasEnCursoDe(datos, usuario.id).length > 0)
    return "Tiene equipos en trabajo. Espera a que cierre sus fichas.";
  return null;
}

// Cambio de nombre o correo desde "Mi cuenta". El correo es el usuario de
// ingreso, así que cambiarlo exige la contraseña actual. Devuelve un mensaje
// de error o null si los datos son válidos.
export function validarDatosCuenta(datos, yo, { nombre, correo, clave }) {
  const correoLimpio = correo.trim().toLowerCase();
  if (!nombre.trim()) return "Escribe tu nombre.";
  if (!FORMATO_CORREO.test(correoLimpio)) return "El correo no es válido.";
  if (datos.usuarios.some((u) => u.id !== yo.id && u.correo === correoLimpio))
    return "Ese correo ya está registrado.";
  if (correoLimpio !== yo.correo && clave !== yo.clave)
    return "La contraseña actual no es correcta.";
  return null;
}

// Cambio de contraseña desde "Mi cuenta" (misma regla de largo que al crear)
export function validarCambioClave(yo, { actual, nueva, confirmacion }) {
  if (actual !== yo.clave) return "La contraseña actual no es correcta.";
  if (nueva.length < 8)
    return "La nueva contraseña debe tener al menos 8 caracteres.";
  if (nueva !== confirmacion) return "Las contraseñas nuevas no coinciden.";
  if (nueva === actual)
    return "La nueva contraseña debe ser distinta de la actual.";
  return null;
}
