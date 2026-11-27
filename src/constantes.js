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
// administrador puede editarlos, renombrarlos o eliminarlos como cualquier otro.
export const ROLES_BASE = [
  {
    id: "admin",
    nombre: "Administrador de sistema",
    permisos: ["gestionarUsuarios", "gestionarRoles", "verReportes"],
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
  },
  {
    id: "recepcionista",
    nombre: "Servicio al cliente",
    permisos: ["recepcionar", "generarQr"],
  },
  {
    id: "tecnico",
    nombre: "Técnico",
    permisos: ["revisarEquipos"],
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

// Un checklist por servicio. Su nombre es el del servicio, así que la ficha
// parte con él cuando el propietario elige el servicio al inscribirse. No se
// pueden eliminar (sus ítems sí se editan). Los checklists creados después
// usan su propio nombre como servicio.
export const PLANTILLAS_SERVICIO = [
  {
    id: "pl-logica",
    nombre: "Mantención lógica",
    items: [
      { id: "lg1", texto: "Revisión del arranque y rendimiento del sistema" },
      { id: "lg2", texto: "Desinstalación de programas innecesarios" },
      { id: "lg3", texto: "Limpieza de archivos temporales" },
      { id: "lg4", texto: "Análisis antivirus y antimalware" },
      { id: "lg5", texto: "Actualizaciones del sistema operativo" },
      { id: "lg6", texto: "Estado del disco sin errores (SMART)" },
    ],
  },
  {
    id: "pl-fisica",
    nombre: "Mantención física",
    items: [
      { id: "fs1", texto: "Enciende correctamente" },
      { id: "fs2", texto: "Limpieza interna de polvo" },
      { id: "fs3", texto: "Cambio de pasta térmica" },
      { id: "fs4", texto: "Ventiladores funcionan sin ruido" },
      { id: "fs5", texto: "Conectores y puertos en buen estado" },
      { id: "fs6", texto: "Pantalla, teclado y mouse/touchpad funcionan" },
    ],
  },
  {
    id: "pl-formateo",
    nombre: "Formateo",
    items: [
      { id: "fm1", texto: "Respaldo de archivos confirmado con el propietario" },
      { id: "fm2", texto: "Instalación del sistema operativo" },
      { id: "fm3", texto: "Instalación de controladores" },
      { id: "fm4", texto: "Actualizaciones del sistema" },
      { id: "fm5", texto: "Programas básicos instalados" },
      { id: "fm6", texto: "Verificación de arranque y conexión a red" },
    ],
  },
];

export const IDS_PLANTILLAS_SERVICIO = PLANTILLAS_SERVICIO.map((p) => p.id);

// Copia limpia de los checklists de servicio (datos iniciales y migración)
export const copiarPlantillasServicio = () =>
  PLANTILLAS_SERVICIO.map((p) => ({
    ...p,
    items: p.items.map((i) => ({ ...i })),
  }));

// Una ficha en estos estados ya terminó su atención
export const ESTADOS_CERRADOS = ["Entregado", "No retirado"];

// El estado avanza solo: "Recibido" al crear la ficha, "En reparación" al guardar
// los datos técnicos y "Listo" cuando el técnico cierra la ficha

// Estados en los que los técnicos están trabajando en la ficha
export const ESTADOS_EN_TRABAJO = ["Recibido", "En reparación"];
