import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "../store.jsx";
import { NOMBRE_ROL, PERMISOS } from "./constantes.js";
import { puede } from "./lib/permisos.js";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";

const MENU = [
  {
    ruta: "/usuarios",
    texto: "Usuarios y permisos",
    permiso: PERMISOS.GESTIONAR_USUARIOS,
  },
];

function Protegida({ permiso, children }) {
  const { usuario } = useApp();
  return puede(usuario, permiso) ? children : <Navigate to="/" replace />;
}

function Panel() {
  const { usuario, salir, restablecer } = useApp();

  if (!usuario) return <Login />;

  const opciones = MENU.filter((m) => puede(usuario, m.permiso));

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
              <p className="text-neutral-600">
                Selecciona una opción del menú.
              </p>
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
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Panel />
      </HashRouter>
    </AppProvider>
  );
}
