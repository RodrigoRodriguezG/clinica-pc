import { PERMISOS_FIJOS_ADMIN, ROLES } from "../constantes.js";
import { normalizar } from "./texto.js";

export const buscarRol = (datos, id) =>
  datos.roles.find((r) => r.id === id) ?? null;

export const nombreRol = (datos, id) => buscarRol(datos, id)?.nombre ?? "Sin rol";

// Permisos con los que parte un usuario de este rol (copia, para no compartir el arreglo)
export const permisosDeRol = (datos, id) => [
  ...(buscarRol(datos, id)?.permisos ?? []),
];

export const usuariosConRol = (datos, id) =>
  datos.usuarios.filter((u) => u.rol === id);

// ¿Este permiso está bloqueado en este rol? (el Administrador no puede perder los fijos)
export const permisoFijo = (rolId, permiso) =>
  rolId === ROLES.ADMIN && PERMISOS_FIJOS_ADMIN.includes(permiso);

// Mensaje de error del nombre, o null si es válido
export function validarNombreRol(datos, nombre, idActual = null) {
  const limpio = nombre.trim();
  if (!limpio) return "Escribe un nombre para el rol.";
  const repetido = datos.roles.some(
    (r) => r.id !== idActual && normalizar(r.nombre) === normalizar(limpio),
  );
  return repetido ? "Ya existe un rol con ese nombre." : null;
}

// Motivo por el que no se puede eliminar un rol (null si se puede)
export function motivoBloqueoEliminar(datos, rol) {
  if (rol.sistema) return "Los roles del sistema no se pueden eliminar.";
  const n = usuariosConRol(datos, rol.id).length;
  if (n > 0)
    return `Tiene ${n} ${n === 1 ? "usuario asignado" : "usuarios asignados"}. Cámbialos de rol primero.`;
  return null;
}

export const crearRol = (nombre, permisos) => ({
  id: crypto.randomUUID(),
  nombre: nombre.trim(),
  permisos: [...permisos],
  sistema: false,
});

// Guarda los cambios de un rol. Si aplicarAUsuarios, quienes tienen el rol
// reciben los permisos nuevos; quien edita ("yo") nunca pierde sus permisos
// de administración, para no quedarse fuera del sistema.
export function guardarRol(datos, rolId, { nombre, permisos }, aplicarAUsuarios, yoId) {
  const rol = buscarRol(datos, rolId);
  if (!rol) return datos;

  const fijos = rolId === ROLES.ADMIN ? PERMISOS_FIJOS_ADMIN : [];
  const nuevosPermisos = [...new Set([...permisos, ...fijos])];

  return {
    ...datos,
    roles: datos.roles.map((r) =>
      r.id === rolId
        ? {
            ...r,
            nombre: r.sistema ? r.nombre : nombre.trim(),
            permisos: nuevosPermisos,
          }
        : r,
    ),
    usuarios: !aplicarAUsuarios
      ? datos.usuarios
      : datos.usuarios.map((u) => {
          if (u.rol !== rolId) return u;
          const conservados =
            u.id === yoId
              ? PERMISOS_FIJOS_ADMIN.filter((p) => u.permisos.includes(p))
              : [];
          return {
            ...u,
            permisos: [...new Set([...nuevosPermisos, ...conservados])],
          };
        }),
  };
}

export const eliminarRol = (datos, rolId) => ({
  ...datos,
  roles: datos.roles.filter((r) => r.id !== rolId),
});
