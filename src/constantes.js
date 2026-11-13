// Roles del sistema (los 3 del diagrama de clases + administrador)
export const ROLES = {
  ADMIN: "admin",
  ENCARGADO: "encargado",
  RECEPCIONISTA: "recepcionista",
  TECNICO: "tecnico",
};

export const NOMBRE_ROL = {
  admin: "Administrador de sistema",
  encargado: "Encargado de clínica",
  recepcionista: "Servicio al cliente",
  tecnico: "Técnico",
};

// Permisos que el administrador puede activar o desactivar por usuario
export const PERMISOS = {
  GESTIONAR_USUARIOS: "gestionarUsuarios",
  CREAR_CLINICAS: "crearClinicas",
  EDITAR_CHECKLISTS: "editarChecklists",
  VER_TODAS_FICHAS: "verTodasFichas",
  VER_REPORTES: "verReportes",
  VER_RETROALIMENTACION: "verRetroalimentacion",
  RECEPCIONAR: "recepcionar",
  REVISAR_EQUIPOS: "revisarEquipos",
};

export const ETIQUETA_PERMISO = {
  gestionarUsuarios: "Gestionar usuarios y permisos",
  crearClinicas: "Crear y editar clínicas",
  editarChecklists: "Editar plantillas de checklist",
  verTodasFichas: "Ver todas las fichas",
  verReportes: "Ver reportes",
  verRetroalimentacion: "Ver retroalimentación",
  recepcionar: "Recepcionar equipos",
  revisarEquipos: "Revisar equipos",
};

// Permisos que recibe un usuario al crearse, según su rol
export const PERMISOS_POR_ROL = {
  admin: ["gestionarUsuarios", "verReportes"],
  encargado: [
    "crearClinicas",
    "editarChecklists",
    "verTodasFichas",
    "verReportes",
    "verRetroalimentacion",
  ],
  recepcionista: ["recepcionar"],
  tecnico: ["revisarEquipos"],
};

export const ESTADOS_FICHA = [
  "Recibido",
  "En diagnóstico",
  "En reparación",
  "Listo",
  "Entregado",
  "No retirado",
];

export const SERVICIOS = ["Mantención lógica", "Mantención física", "Formateo"];

// Una ficha en estos estados ya terminó su atención
export const ESTADOS_CERRADOS = ["Entregado", "No retirado"];

// Estados que el técnico puede asignar. "Entregado" y "No retirado" son del cierre (Paso 8)
export const ESTADOS_TECNICO = [
  "Recibido",
  "En diagnóstico",
  "En reparación",
  "Listo",
];

// Estados en los que los técnicos están trabajando en la ficha. "Listo" los libera
export const ESTADOS_EN_TRABAJO = [
  "Recibido",
  "En diagnóstico",
  "En reparación",
];
