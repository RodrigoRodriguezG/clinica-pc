import { PERMISOS_POR_ROL } from "../constantes.js";
import { fichaEnCursoDe } from "./fichas.js";

// Cambio de rol: el usuario queda con los permisos base del nuevo rol
export const aplicarRol = (usuario, rol) => ({
  ...usuario,
  rol,
  permisos: PERMISOS_POR_ROL[rol],
});

// Motivo por el que no se puede cambiar el rol de alguien (null si se puede)
export function motivoBloqueoCambioRol(datos, usuario, yo) {
  if (usuario.id === yo.id) return "No puedes cambiar tu propio rol.";
  if (fichaEnCursoDe(datos, usuario.id))
    return "Tiene un equipo en trabajo. Espera a que quede en estado Listo.";
  return null;
}
