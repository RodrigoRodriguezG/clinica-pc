// Ids de los roles del sistema (los 3 del diagrama de clases + administrador)
export const ROLES = {
  ADMIN: "admin",
  ENCARGADO: "encargado",
  RECEPCIONISTA: "recepcionista",
  TECNICO: "tecnico",
};

// Permisos que el administrador asigna a cada rol (y puede ajustar por usuario)
export const PERMISOS = {
  GESTIONAR_USUARIOS: "gestionarUsuarios",
  GESTIONAR_ROLES: "gestionarRoles",
  CREAR_CLINICAS: "crearClinicas",
  EDITAR_CHECKLISTS: "editarChecklists",
  VER_TODAS_FICHAS: "verTodasFichas",
  VER_REPORTES: "verReportes",
  VER_RETROALIMENTACION: "verRetroalimentacion",
  RECEPCIONAR: "recepcionar",
  REVISAR_EQUIPOS: "revisarEquipos",
  GENERAR_QR: "generarQr",
};

export const ETIQUETA_PERMISO = {
  gestionarUsuarios: "Gestionar usuarios y permisos",
  gestionarRoles: "Crear y editar roles",
  crearClinicas: "Crear y editar clínicas",
  editarChecklists: "Editar plantillas de checklist",
  verTodasFichas: "Ver todas las fichas",
  verReportes: "Ver reportes",
  verRetroalimentacion: "Ver retroalimentación",
  recepcionar: "Recepcionar equipos",
  revisarEquipos: "Revisar equipos",
  generarQr: "Generar QR de inscripción",
};

// Permisos que el rol Administrador nunca puede perder (evita quedar sin acceso)
export const PERMISOS_FIJOS_ADMIN = ["gestionarUsuarios", "gestionarRoles"];

// Roles con los que parte el sistema. Se copian a datos.roles, donde el
// administrador puede editar sus permisos y crear roles nuevos.
// Los marcados "sistema" no se pueden eliminar ni renombrar.
export const ROLES_BASE = [
  {
    id: "admin",
    nombre: "Administrador de sistema",
    permisos: ["gestionarUsuarios", "gestionarRoles", "verReportes"],
    sistema: true,
  },
  {
    id: "encargado",
    nombre: "Encargado de clínica",
    permisos: [
      "crearClinicas",
      "editarChecklists",
      "verTodasFichas",
      "verReportes",
      "verRetroalimentacion",
      "generarQr",
    ],
    sistema: true,
  },
  {
    id: "recepcionista",
    nombre: "Servicio al cliente",
    permisos: ["recepcionar", "generarQr"],
    sistema: true,
  },
  {
    id: "tecnico",
    nombre: "Técnico",
    permisos: ["revisarEquipos"],
    sistema: true,
  },
];

// Copia limpia de los roles base (para los datos iniciales y la migración)
export const copiarRolesBase = () =>
  ROLES_BASE.map((r) => ({ ...r, permisos: [...r.permisos] }));

// Resultado "no aplica" de un ítem del checklist
export const NO_APLICA = "na";

export const ESTADO_CIERRE_ANTICIPADO = "Cierre anticipado";
export const ESTADO_POR_REASIGNAR = "Por reasignar";

export const ESTADO_EN_REPARACION = "En reparación";
export const ESTADO_LISTO = "Listo";
export const ESTADO_ENTREGADO = "Entregado"; // desde Listo o Cierre anticipado

export const ESTADOS_FICHA = [
  "Recibido",
  "En reparación",
  "Listo",
  "Cierre anticipado",
  "Por reasignar",
  "Entregado",
  "No retirado",
];

export const SERVICIOS = ["Mantención lógica", "Mantención física", "Formateo"];

// Una ficha en estos estados ya terminó su atención
export const ESTADOS_CERRADOS = ["Entregado", "No retirado"];

// El estado avanza solo: "Recibido" al crear la ficha, "En reparación" al guardar
// los datos técnicos y "Listo" cuando el técnico cierra la ficha

// Estados en los que los técnicos están trabajando en la ficha
export const ESTADOS_EN_TRABAJO = ["Recibido", "En reparación"];
