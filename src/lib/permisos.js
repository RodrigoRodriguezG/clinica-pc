// ¿El usuario existe, está activo y tiene este permiso?
export const puede = (usuario, permiso) =>
  Boolean(usuario) && usuario.activo && usuario.permisos.includes(permiso);
