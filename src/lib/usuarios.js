import { permisosDeRol } from "./roles.js";
import { fichasEnCursoDe } from "./fichas.js";

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
