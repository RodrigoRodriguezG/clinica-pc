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
  GENERAR_QR: "generarQr",
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
  generarQr: "Generar QR de inscripción",
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
    "generarQr",
  ],
  recepcionista: ["recepcionar", "generarQr"],
  tecnico: ["revisarEquipos"],
};

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
