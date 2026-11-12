import { createContext, useContext, useEffect, useState } from "react";
import { crearDatosIniciales } from "./data/seed.js";

const CLAVE_DATOS = "clinica-pc-datos";
const CLAVE_SESION = "clinica-pc-sesion";

const AppContext = createContext(null);

// Hook para usar el almacén desde cualquier pantalla: const { datos } = useApp()
// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => useContext(AppContext);

// Lee los datos guardados; si no hay (o están dañados), usa los de ejemplo
function cargarDatos() {
  try {
    const guardado = localStorage.getItem(CLAVE_DATOS);
    if (guardado) return JSON.parse(guardado);
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
      value={{ datos, actualizar, restablecer, usuario, ingresar, salir }}
    >
      {children}
    </AppContext.Provider>
  );
}
