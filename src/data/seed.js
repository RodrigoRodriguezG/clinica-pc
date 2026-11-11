import { PERMISOS_POR_ROL } from "../constantes.js";

// Datos de demostración. Es una función para que "restablecer" siempre
// devuelva una copia limpia.
export const crearDatosIniciales = () => ({
  usuarios: [
    {
      id: "u1",
      nombre: "Administrador Sistema",
      correo: "pablo@pesce.cl",
      clave: "Demo1234",
      rol: "admin",
      permisos: PERMISOS_POR_ROL.admin,
      activo: true,
    },
    {
      id: "u2",
      nombre: "Prof. German Mardones",
      correo: "german@mardones.cl",
      clave: "Patito123",
      rol: "encargado",
      permisos: PERMISOS_POR_ROL.encargado,
      activo: true,
    },
    {
      id: "u3",
      nombre: "Sebastian Neira",
      correo: "sebastian@neira.cl",
      clave: "Demo1234",
      rol: "recepcionista",
      permisos: PERMISOS_POR_ROL.recepcionista,
      activo: true,
    },
    {
      id: "u4",
      nombre: "Rodrigo Rodriguez",
      correo: "rodrigo@rodriguez.cl",
      clave: "Demo1234",
      rol: "tecnico",
      permisos: PERMISOS_POR_ROL.tecnico,
      activo: true,
    },
    {
      id: "u5",
      nombre: "Cristian Millaqueo",
      correo: "cristian@millaqueo.cl",
      clave: "Demo1234",
      rol: "tecnico",
      permisos: PERMISOS_POR_ROL.tecnico,
      activo: true,
    },
  ],
  plantillas: [
    {
      id: "pl1",
      nombre: "Checklist general",
      items: [
        { id: "i1", texto: "Enciende correctamente" },
        { id: "i2", texto: "Pantalla sin fallas" },
        { id: "i3", texto: "Teclado y mouse funcionan" },
        { id: "i4", texto: "Red / Wi-Fi operativa" },
        { id: "i5", texto: "Almacenamiento sin errores" },
      ],
    },
  ],
  clinicas: [
    {
      id: "c1",
      nombre: "Clínica del PC 2026",
      sede: "Sede San Pedro de la Paz",
      dias: ["2026-07-09", "2026-07-10"],
      plantillaId: "pl1",
    },
  ],
  // Se llenan cuando construyamos recepción (con datos de ejemplo)
  propietarios: [],
  equipos: [],
  fichas: [],
  retros: [],
});
