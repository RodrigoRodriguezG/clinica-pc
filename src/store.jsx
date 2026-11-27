import { createContext, useContext, useEffect, useState } from "react";
import { crearDatosIniciales } from "./data/seed.js";
import {
  PERMISOS,
  ROLES,
  IDS_PLANTILLAS_SERVICIO,
  SEDES,
  copiarRolesBase,
} from "./constantes.js";
import { plantillasBaseFaltantes } from "./lib/checklists.js";

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

// Datos de antes de los checklists por clínica y de las sedes:
// - los usuarios quedan sin sede hasta que el administrador les asigne una;
// - los checklists globales se copian a cada clínica (los 3 de servicio
//   globales se reemplazan por las copias propias de cada clínica);
// - las fichas sin servicio que ya tenían ítems los conservan con el servicio
//   "Checklist general"; las que no, quedan para que el técnico elija uno.
const migrarServicios = (datos) => {
  const globales = datos.plantillas.filter((p) => !p.clinicaId);
  let plantillas = [
    ...datos.plantillas.filter((p) => p.clinicaId),
    ...datos.clinicas.flatMap((c) =>
      globales
        .filter((p) => !IDS_PLANTILLAS_SERVICIO.includes(p.id))
        .map((p) => ({
          ...p,
          id: `${p.id}-${c.id}`,
          clinicaId: c.id,
          items: p.items.map((i) => ({ ...i })),
        })),
    ),
  ];
  for (const c of datos.clinicas)
    plantillas = [...plantillasBaseFaltantes(plantillas, c.id), ...plantillas];

  return {
    ...datos,
    plantillas,
    usuarios: datos.usuarios.map((u) =>
      u.sede === undefined ? { ...u, sede: "" } : u,
    ),
    // La sede es de cada atención, no del propietario: el equipo sin sede toma
    // la de la clínica de su ficha más reciente; sin fichas, la que tenía su
    // propietario en una versión anterior o, si no, la primera sede
    equipos: datos.equipos.map((e) => {
      if (e.sede) return e;
      const ultima = datos.fichas
        .filter((f) => f.equipoId === e.id)
        .sort((a, b) => b.creada.localeCompare(a.creada))[0];
      const sede =
        (ultima &&
          datos.clinicas.find((c) => c.id === ultima.clinicaId)?.sede) ||
        datos.propietarios.find((p) => p.id === e.propietarioId)?.sede ||
        SEDES[0];
      return { ...e, sede };
    }),
    propietarios: datos.propietarios.map((p) => {
      if (p.sede === undefined) return p;
      const { sede: _sede, ...resto } = p;
      return resto;
    }),
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
