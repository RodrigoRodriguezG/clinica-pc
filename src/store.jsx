import { createContext, useContext, useEffect, useState } from "react";
import { crearDatosIniciales } from "./data/seed.js";
import {
  PERMISOS,
  ROLES,
  copiarPlantillasServicio,
  copiarRolesBase,
} from "./constantes.js";

const CLAVE_DATOS = "clinica-pc-datos";
const CLAVE_SESION = "clinica-pc-sesion";

const AppContext = createContext(null);

// Hook para usar el almacén desde cualquier pantalla: const { datos } = useApp()
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);

// Datos guardados antes de que existieran los roles editables: se crean los
// roles base y los administradores reciben el permiso nuevo de gestionar roles
const migrarRoles = (datos) =>
  datos.roles
    ? datos
    : {
        ...datos,
        roles: copiarRolesBase(),
        usuarios: datos.usuarios.map((u) =>
          u.rol === ROLES.ADMIN && !u.permisos.includes(PERMISOS.GESTIONAR_ROLES)
            ? { ...u, permisos: [...u.permisos, PERMISOS.GESTIONAR_ROLES] }
            : u,
        ),
      };

// Datos de antes de los checklists por servicio: se agregan los 3 checklists
// de servicio. Las fichas que ya tenían ítems los conservan con el servicio
// "Checklist general"; las que no, quedan para que el técnico elija uno.
const migrarServicios = (datos) => {
  const faltantes = copiarPlantillasServicio().filter(
    (p) => !datos.plantillas.some((x) => x.id === p.id),
  );
  return {
    ...datos,
    plantillas: [...faltantes, ...datos.plantillas],
    fichas: datos.fichas.map((f) =>
      f.plantillaId !== undefined
        ? f
        : f.checklist.length > 0
          ? { ...f, plantillaId: "legacy", servicio: "Checklist general" }
          : { ...f, plantillaId: null, servicio: "" },
    ),
  };
};

// Ajusta datos guardados con versiones anteriores: "En diagnóstico" ya no existe
// y las fichas entregadas antes de la encuesta reciben su token
const migrar = (datos) =>
  migrarServicios(
    migrarRoles({
      ...datos,
      retros: datos.retros ?? [],
      fichas: datos.fichas.map((f) => {
        const ficha =
          f.estado === "En diagnóstico" ? { ...f, estado: "En reparación" } : f;
        return ficha.estado === "Entregado" && !ficha.tokenEncuesta
          ? { ...ficha, tokenEncuesta: crypto.randomUUID() }
          : ficha;
      }),
    }),
  );

// Lee los datos guardados; si no hay (o están dañados), usa los de ejemplo
function cargarDatos() {
  try {
    const guardado = localStorage.getItem(CLAVE_DATOS);
    if (guardado) return migrar(JSON.parse(guardado));
  } catch {
    // datos corruptos: se ignoran y se parte de cero
  }
  return crearDatosIniciales();
}

export function AppProvider({ children }) {
  const [datos, setDatos] = useState(cargarDatos);
  const [sesionId, setSesionId] = useState(() =>
    sessionStorage.getItem(CLAVE_SESION),
  );

  // Cada vez que cambian los datos, se copian al navegador
  useEffect(() => {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(datos));
  }, [datos]);

  // Usuario con sesión iniciada (null si no hay o fue dado de baja)
  const usuario =
    datos.usuarios.find((u) => u.id === sesionId && u.activo) ?? null;

  // Recibe una función que toma los datos actuales y devuelve los nuevos
  const actualizar = (fn) => setDatos(fn);

  const restablecer = () => setDatos(crearDatosIniciales());

  // Devuelve un mensaje de error, o null si el ingreso fue exitoso
  const ingresar = (correo, clave) => {
    const u = datos.usuarios.find(
      (x) => x.correo === correo.trim().toLowerCase(),
    );
    if (!u || u.clave !== clave) return "Correo o contraseña incorrectos.";
    if (!u.activo)
      return "Tu cuenta está desactivada. Contacta al administrador.";
    sessionStorage.setItem(CLAVE_SESION, u.id);
    setSesionId(u.id);
    return null;
  };

  const salir = () => {
    sessionStorage.removeItem(CLAVE_SESION);
    setSesionId(null);
  };

  return (
    <AppContext.Provider
      value={{
        datos,
        actualizar,
        restablecer,
        usuario,
        ingresar,
        salir,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
