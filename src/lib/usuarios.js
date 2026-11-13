import { PERMISOS_POR_ROL } from "../constantes.js";
import { fichasEnCursoDe } from "./fichas.js";

// Cambio de rol: el usuario queda con los permisos base del nuevo rol
export const aplicarRol = (usuario, rol) => ({
  ...usuario,
  rol,
  permisos: PERMISOS_POR_ROL[rol],
});

// Motivo por el que no se puede cambiar el rol de alguien (null si se puede)
export function motivoBloqueoCambioRol(datos, usuario, yo) {
  if (usuario.id === yo.id) return "No puedes cambiar tu propio rol.";
  if (fichasEnCursoDe(datos, usuario.id).length > 0)
    return "Tiene equipos en trabajo. Espera a que queden en estado Listo.";
  return null;
}
