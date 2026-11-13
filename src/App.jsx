import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./store.jsx";
import { NOMBRE_ROL, PERMISOS } from "./constantes.js";
import { puede } from "./lib/permisos.js";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Clinicas from "./pages/Clinicas.jsx";
import Checklists from "./pages/Checklists.jsx";
import FormInscripcion from "./pages/FormInscripcion.jsx";
import Recepcion from "./pages/Recepcion.jsx";
import Fichas from "./pages/Fichas.jsx";
import ClinicaDetalle from "./pages/ClinicaDetalle.jsx";

const MENU = [
  { ruta: "/clinicas", texto: "Clínicas", permiso: PERMISOS.CREAR_CLINICAS },
  { ruta: "/recepcion", texto: "Recepción", permiso: PERMISOS.RECEPCIONAR },
  {
    ruta: "/fichas",
    texto: "Fichas",
    permiso: [PERMISOS.VER_TODAS_FICHAS, PERMISOS.REVISAR_EQUIPOS],
  },
  {
    ruta: "/checklists",
    texto: "Checklists",
    permiso: PERMISOS.EDITAR_CHECKLISTS,
  },
  {
    ruta: "/usuarios",
    texto: "Usuarios y permisos",
    permiso: PERMISOS.GESTIONAR_USUARIOS,
  },
  {
    ruta: "/inscripcion",
    texto: "Inscribir propietario",
    permiso: PERMISOS.RECEPCIONAR,
  },
];

function Protegida({ permiso, children }) {
  const { usuario } = useApp();
  const permitido = [].concat(permiso).some((p) => puede(usuario, p));
  return permitido ? children : <Navigate to="/" replace />;
}

function Panel() {
  const { usuario, salir, restablecer } = useApp();

  if (!usuario) return <Login />;

  const opciones = MENU.filter((m) =>
    [].concat(m.permiso).some((p) => puede(usuario, p)),
  );

  // La inscripción es una página pública sin menú lateral: nunca puede ser la vista de inicio
  const inicio = opciones.find((m) => m.ruta !== "/inscripcion")?.ruta;

  return (
    <div className="min-h-screen md:flex">
      <nav className="md:w-64 bg-neutral-800 text-white p-5 space-y-6">
        <div>
          <p className="font-bold text-lg">Clínica del PC</p>
          <p className="text-sm text-neutral-300">
            {usuario.nombre}
            <br />
            {NOMBRE_ROL[usuario.rol]}
          </p>
        </div>

        <ul className="space-y-1">
          {opciones.map((m) => (
            <li key={m.ruta}>
              <NavLink
                to={m.ruta}
                className={({ isActive }) =>
                  `block rounded px-3 py-2 ${isActive ? "bg-[#EE0000]" : "hover:bg-neutral-700"}`
                }
              >
                {m.texto}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="space-y-2 text-sm">
          <button onClick={restablecer} className="underline text-neutral-300">
            Restablecer datos demo
          </button>
          <br />
          <button onClick={salir} className="underline">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10">
        <Routes>
          <Route
            path="/"
            element={
              inicio ? (
                <Navigate to={inicio} replace />
              ) : (
                <p className="text-neutral-600">
                  Tu cuenta no tiene secciones habilitadas. Contacta al
                  administrador.
                </p>
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route
            path="/usuarios"
            element={
              <Protegida permiso={PERMISOS.GESTIONAR_USUARIOS}>
                <Usuarios />
              </Protegida>
            }
          />
          <Route
            path="/clinicas"
            element={
              <Protegida permiso={PERMISOS.CREAR_CLINICAS}>
                <Clinicas />
              </Protegida>
            }
          />
          <Route
            path="/checklists"
            element={
              <Protegida permiso={PERMISOS.EDITAR_CHECKLISTS}>
                <Checklists />
              </Protegida>
            }
          />
          <Route
            path="/recepcion"
            element={
              <Protegida permiso={PERMISOS.RECEPCIONAR}>
                <Recepcion />
              </Protegida>
            }
          />
          <Route
            path="/fichas"
            element={
              <Protegida
                permiso={[PERMISOS.VER_TODAS_FICHAS, PERMISOS.REVISAR_EQUIPOS]}
              >
                <Fichas />
              </Protegida>
            }
          />
            <Route
            path="/clinicas/:clinicaId"
            element={
              <Protegida permiso={PERMISOS.CREAR_CLINICAS}>
                <ClinicaDetalle />
              </Protegida>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          {/* Pública: el QR lleva aquí sin iniciar sesión */}
          <Route path="/inscripcion" element={<FormInscripcion />} />
          {/* Todo lo demás sigue pasando por el panel con login */}
          <Route path="*" element={<Panel />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
