import { useEffect, useRef, useState } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppProvider, useApp } from "./store.jsx";
import { PERMISOS } from "./constantes.js";
import { nombreRol } from "./lib/roles.js";
import { puede } from "./lib/permisos.js";
import Login from "./pages/Login.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import Clinicas from "./pages/Clinicas.jsx";
import Checklists from "./pages/Checklists.jsx";
import FormInscripcion from "./pages/FormInscripcion.jsx";
import Recepcion from "./pages/Recepcion.jsx";
import Fichas from "./pages/Fichas.jsx";
import ClinicaDetalle from "./pages/ClinicaDetalle.jsx";
import GenerarQR from "./pages/GenerarQR.jsx";
import Roles from "./pages/Roles.jsx";
import MiCuenta from "./pages/MiCuenta.jsx";
import Boton from "./components/ui/Boton.jsx";
import Tarjeta from "./components/ui/Tarjeta.jsx";
import { cx } from "./components/ui/cx.js";
import {
  IconoCerrar,
  IconoChecklist,
  IconoClinicas,
  IconoEscudo,
  IconoFichas,
  IconoInscripcion,
  IconoMenu,
  IconoMonitor,
  IconoQR,
  IconoRecepcion,
  IconoRestablecer,
  IconoSalir,
  IconoUsuarios,
} from "./components/ui/iconos.jsx";

// Menú lateral agrupado en secciones. Un grupo solo aparece si el usuario
// tiene al menos una de sus opciones; el orden define la vista de inicio.
const MENU = [
  {
    grupo: "Gestión de clínicas",
    opciones: [
      {
        ruta: "/clinicas",
        texto: "Clínicas",
        permiso: PERMISOS.CREAR_CLINICAS,
        Icono: IconoClinicas,
      },
      {
        ruta: "/checklists",
        texto: "Checklists",
        permiso: PERMISOS.EDITAR_CHECKLISTS,
        Icono: IconoChecklist,
      },
    ],
  },
  {
    grupo: "Atención",
    opciones: [
      {
        ruta: "/recepcion",
        texto: "Recepción",
        permiso: PERMISOS.RECEPCIONAR,
        Icono: IconoRecepcion,
      },
      {
        ruta: "/inscripcion",
        texto: "Inscribir propietario",
        permiso: PERMISOS.RECEPCIONAR,
        Icono: IconoInscripcion,
      },
      {
        ruta: "/qr",
        texto: "QR de inscripción",
        permiso: PERMISOS.GENERAR_QR,
        Icono: IconoQR,
      },
      {
        ruta: "/fichas",
        texto: "Fichas",
        permiso: [PERMISOS.VER_TODAS_FICHAS, PERMISOS.REVISAR_EQUIPOS],
        Icono: IconoFichas,
      },
    ],
  },
  {
    grupo: "Administración",
    opciones: [
      {
        ruta: "/usuarios",
        texto: "Usuarios y permisos",
        permiso: PERMISOS.GESTIONAR_USUARIOS,
        Icono: IconoUsuarios,
      },
      {
        ruta: "/roles",
        texto: "Roles",
        permiso: PERMISOS.GESTIONAR_ROLES,
        Icono: IconoEscudo,
      },
    ],
  },
];

// ¿Tiene el usuario alguno de estos permisos? (acepta uno o una lista)
const tieneAlguno = (usuario, permiso) =>
  [].concat(permiso).some((p) => puede(usuario, p));

function Protegida({ permiso, children }) {
  const { usuario } = useApp();
  return tieneAlguno(usuario, permiso) ? (
    children
  ) : (
    <Navigate to="/" replace />
  );
}

function Marca({ compacta = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={cx(
          "flex shrink-0 items-center justify-center rounded-xl bg-inacap text-white shadow-sm",
          compacta ? "h-10 w-10" : "h-11 w-11",
        )}
      >
        <IconoMonitor className={compacta ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <div className="min-w-0">
        <p
          className={cx(
            "truncate font-bold leading-tight tracking-tight",
            compacta ? "text-base text-tinta" : "text-lg text-white",
          )}
        >
          Clínica del PC
        </p>
        <p
          className={cx(
            "text-[0.7rem] font-semibold uppercase tracking-[0.18em]",
            compacta ? "text-neutral-500" : "text-neutral-400",
          )}
        >
          INACAP
        </p>
      </div>
    </div>
  );
}

function Iniciales({ nombre, oscuro = true }) {
  const iniciales = String(nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1",
        oscuro
          ? "bg-white/10 text-white ring-white/15"
          : "bg-neutral-100 text-tinta ring-neutral-200",
      )}
    >
      {iniciales || "PC"}
    </span>
  );
}

function Navegacion({ grupos, usuario, onNavegar }) {
  const { datos, salir, restablecer } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        aria-label="Navegación principal"
        className="-mx-1 min-h-0 flex-1 space-y-5 overflow-y-auto px-1"
      >
        {grupos.map(({ grupo, opciones }) => (
          <div key={grupo}>
            <h3 className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {grupo}
            </h3>
            <ul className="space-y-1">
              {opciones.map((m) => (
                <li key={m.ruta}>
                  <NavLink
                    to={m.ruta}
                    onClick={onNavegar}
                    className={({ isActive }) =>
                      cx(
                        "group flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                        isActive
                          ? "bg-inacap text-white shadow-sm"
                          : "text-neutral-300 hover:bg-white/10 hover:text-white",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <m.Icono
                          className={cx(
                            "h-5 w-5 shrink-0",
                            isActive
                              ? "text-white"
                              : "text-neutral-400 group-hover:text-white",
                          )}
                        />
                        <span className="truncate">{m.texto}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 shrink-0 space-y-3 border-t border-white/10 pt-4">
        <NavLink
          to="/cuenta"
          onClick={onNavegar}
          title="Mi cuenta"
          className={({ isActive }) =>
            cx(
              "flex items-center gap-3 rounded-control p-3 transition-colors duration-150",
              isActive
                ? "bg-white/15 ring-1 ring-white/20"
                : "bg-white/5 hover:bg-white/10",
            )
          }
        >
          <Iniciales nombre={usuario.nombre} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {usuario.nombre}
            </p>
            <p className="truncate text-xs text-neutral-400">
              {nombreRol(datos, usuario.rol)} · Mi cuenta
            </p>
          </div>
        </NavLink>

        <div className="space-y-1">
          <button
            type="button"
            onClick={restablecer}
            className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left text-xs font-medium text-neutral-400 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <IconoRestablecer className="h-4 w-4 shrink-0" />
            Restablecer datos demo
          </button>
          <button
            type="button"
            onClick={() => {
              // Cierra el drawer móvil y deja la URL en la raíz: sin esto
              // quedaría la última sección visitada y "atrás" volvería a ella
              onNavegar?.();
              navigate("/", { replace: true });
              salir();
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left text-sm font-semibold text-neutral-200 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <IconoSalir className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel() {
  const { usuario } = useApp();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const refPanel = useRef(null);
  const refCerrar = useRef(null);
  const refAbrir = useRef(null);

  const grupos = usuario
    ? MENU.map((g) => ({
        ...g,
        opciones: g.opciones.filter((m) => tieneAlguno(usuario, m.permiso)),
      })).filter((g) => g.opciones.length > 0)
    : [];

  const inicio = grupos[0]?.opciones[0]?.ruta;

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    refCerrar.current?.focus();

    const alPresionarTecla = (e) => {
      if (e.key === "Escape") {
        setMenuAbierto(false);
        return;
      }

      if (e.key !== "Tab" || !refPanel.current) return;

      const enfocables = refPanel.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [menuAbierto]);

  const cerrarMenu = () => {
    setMenuAbierto(false);
    refAbrir.current?.focus();
  };

  if (!usuario) return <Login />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Barra lateral fija en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-tinta px-5 py-6 shadow-lateral lg:flex">
        <div className="mb-8 shrink-0">
          <Marca />
        </div>
        <Navegacion grupos={grupos} usuario={usuario} />
      </aside>

      {/* Barra superior en móvil */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Boton
            variante="secundario"
            className="w-11 shrink-0 px-0!"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú de navegación"
            aria-expanded={menuAbierto}
            aria-controls="menu-lateral"
            ref={refAbrir}
          >
            <IconoMenu className="h-5 w-5" />
          </Boton>
          <Marca compacta />
        </div>
        <Link
          to="/cuenta"
          aria-label="Mi cuenta"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inacap/30"
        >
          <Iniciales nombre={usuario.nombre} oscuro={false} />
        </Link>
      </header>

      {/* Drawer móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            tabIndex={-1}
            onClick={cerrarMenu}
            className="animar-overlay absolute inset-0 h-full w-full cursor-default bg-black/55"
          />
          <div
            id="menu-lateral"
            ref={refPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-lateral-titulo"
            className="animar-menu absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col bg-tinta px-5 py-5 shadow-lateral"
          >
            <div className="mb-6 flex shrink-0 items-start justify-between gap-3">
              <h2 id="menu-lateral-titulo">
                <Marca />
                <span className="sr-only">Menú de navegación</span>
              </h2>
              <button
                ref={refCerrar}
                type="button"
                onClick={cerrarMenu}
                aria-label="Cerrar menú de navegación"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-neutral-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
              >
                <IconoCerrar className="h-5 w-5" />
              </button>
            </div>
            <Navegacion
              grupos={grupos}
              usuario={usuario}
              onNavegar={cerrarMenu}
            />
          </div>
        </div>
      )}

      <main className="min-h-screen lg:ml-72">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Routes>
            <Route
              path="/"
              element={
                inicio ? (
                  <Navigate to={inicio} replace />
                ) : (
                  <Tarjeta className="p-6">
                    <p className="text-neutral-600">
                      Tu cuenta no tiene secciones habilitadas. Contacta al
                      administrador.
                    </p>
                  </Tarjeta>
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
            {/* Disponible para cualquier usuario con sesión */}
            <Route path="/cuenta" element={<MiCuenta />} />
            <Route
              path="/usuarios"
              element={
                <Protegida permiso={PERMISOS.GESTIONAR_USUARIOS}>
                  <Usuarios />
                </Protegida>
              }
            />
            <Route
              path="/inscripcion"
              element={
                <Protegida permiso={PERMISOS.RECEPCIONAR}>
                  <FormInscripcion enPanel />
                </Protegida>
              }
            />
            <Route
              path="/roles"
              element={
                <Protegida permiso={PERMISOS.GESTIONAR_ROLES}>
                  <Roles />
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
              path="/qr"
              element={
                <Protegida permiso={PERMISOS.GENERAR_QR}>
                  <GenerarQR />
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
        </div>
      </main>
    </div>
  );
}

// El QR lleva a /inscripcion sin iniciar sesión (página pública). Con sesión y
// permiso de recepción, el formulario se muestra dentro del panel como una
// sección más. Se decide con la URL en vez de una ruta propia: si el panel se
// renderizara bajo <Route path="/inscripcion">, sus rutas internas quedarían
// relativas a ella y "/" redirigiría al inicio.
function Raiz() {
  const { usuario } = useApp();
  const { pathname } = useLocation();
  const publica =
    pathname === "/inscripcion" && !puede(usuario, PERMISOS.RECEPCIONAR);
  return publica ? <FormInscripcion /> : <Panel />;
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Raiz />
      </HashRouter>
    </AppProvider>
  );
}
