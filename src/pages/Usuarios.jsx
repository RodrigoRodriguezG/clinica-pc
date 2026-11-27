import { useState } from "react";
import { useApp } from "../store.jsx";
import { ETIQUETA_PERMISO, PERMISOS, ROLES, SEDES } from "../constantes.js";
import { nombreRol, permisosDeRol } from "../lib/roles.js";
import { normalizar } from "../lib/texto.js";
import { aplicarRol, motivoBloqueoCambioRol } from "../lib/usuarios.js";
import ImportarUsuarios from "../components/ImportarUsuarios.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import BarraFiltros from "../components/ui/BarraFiltros.jsx";
import Chips from "../components/ui/Chips.jsx";
import Paso from "../components/ui/Paso.jsx";
import PanelCreacion, {
  PieAcciones,
} from "../components/ui/PanelCreacion.jsx";
import { cx } from "../components/ui/cx.js";
import {
  IconoChevronAbajo,
  IconoDocumento,
  IconoInscripcion,
  IconoMas,
  IconoUsuarios,
} from "../components/ui/iconos.jsx";

const FORMULARIO_VACIO = {
  nombre: "",
  correo: "",
  clave: "",
  rol: ROLES.TECNICO,
  sede: "",
};

// Opciones de sede: "" = sin sede (por ejemplo, quien ve todas las sedes)
const OpcionesSede = () => (
  <>
    <option value="">Sin sede</option>
    {SEDES.map((s) => (
      <option key={s} value={s}>
        {s}
      </option>
    ))}
  </>
);
const POR_PAGINA = 20;

export default function Usuarios() {
  const { datos, actualizar, usuario: yo } = useApp();
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [limite, setLimite] = useState(POR_PAGINA);
  const [cambioRol, setCambioRol] = useState(null); // { id, rol } pendiente de confirmar
  // Solo visual: panel desplegado ("crear", "importar" o ninguno)
  const [panel, setPanel] = useState(null);

  // Al cambiar un filtro se vuelve a la primera página
  const conFiltro = (setter) => (valor) => {
    setter(valor);
    setLimite(POR_PAGINA);
  };

  const opcionesRol = [...datos.roles].sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  );

  const busqueda = normalizar(filtro.trim());
  const usuariosFiltrados = datos.usuarios
    .filter((u) => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (filtroEstado === "activos" && !u.activo) return false;
      if (filtroEstado === "inactivos" && u.activo) return false;
      if (!busqueda) return true;
      return (
        normalizar(u.nombre).includes(busqueda) ||
        normalizar(u.correo).includes(busqueda)
      );
    })
    // La cuenta con sesión iniciada va primero; el resto, por nombre
    .sort(
      (a, b) =>
        (b.id === yo.id) - (a.id === yo.id) ||
        a.nombre.localeCompare(b.nombre),
    );

  const usuariosMostrados = usuariosFiltrados.slice(0, limite);
  const hayFiltros = Boolean(filtro.trim() || filtroRol || filtroEstado);

  const limpiarFiltros = () => {
    setFiltro("");
    setFiltroRol("");
    setFiltroEstado("");
    setLimite(POR_PAGINA);
  };

  // Actualiza un solo campo del formulario sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm({ ...form, [campo]: e.target.value });

  const crear = (e) => {
    e.preventDefault();
    const correo = form.correo.trim().toLowerCase();

    if (!datos.roles.some((r) => r.id === form.rol))
      return setError("Elige un rol válido.");
    if (form.sede && !SEDES.includes(form.sede))
      return setError("Elige una sede válida.");
    if (form.clave.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres.");
    if (datos.usuarios.some((u) => u.correo === correo))
      return setError("Ese correo ya está registrado.");

    setError("");
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: form.nombre.trim(),
      correo,
      clave: form.clave,
      rol: form.rol,
      permisos: permisosDeRol(datos, form.rol), // permisos iniciales según el rol
      sede: form.sede,
      activo: true,
    };
    actualizar((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }));
    setForm(FORMULARIO_VACIO);
    setPanel(null);
  };

  // Activa o desactiva un permiso de un usuario
  const alternarPermiso = (id, permiso) =>
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((u) => {
        if (u.id !== id) return u;
        const tiene = u.permisos.includes(permiso);
        return {
          ...u,
          permisos: tiene
            ? u.permisos.filter((p) => p !== permiso)
            : [...u.permisos, permiso],
        };
      }),
    }));

  // La sede define qué clínicas ve con los permisos "de su sede"
  const cambiarSede = (id, sede) =>
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((u) => (u.id === id ? { ...u, sede } : u)),
    }));

  // Dar de baja o reactivar (no se borra: se conserva el historial)
  const alternarActivo = (id) =>
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((u) =>
        u.id === id ? { ...u, activo: !u.activo } : u,
      ),
    }));

  // Cambio de rol con confirmación; se vuelve a validar al aplicarlo
  const confirmarRol = () => {
    const u = datos.usuarios.find((x) => x.id === cambioRol.id);
    if (!u || motivoBloqueoCambioRol(datos, u, yo)) return setCambioRol(null);
    actualizar((d) => ({
      ...d,
      usuarios: d.usuarios.map((x) =>
        x.id === u.id ? aplicarRol(d, x, cambioRol.rol) : x,
      ),
    }));
    setCambioRol(null);
  };

  const cerrarPanel = () => {
    setPanel(null);
    setError("");
  };

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Usuarios y permisos"
        descripcion="Crea las cuentas del equipo una por una o impórtalas desde Excel, cambia su rol, ajusta permisos o da de baja."
        acciones={
          <>
            <Boton
              variante="contorno"
              onClick={() => {
                setPanel("importar");
                setError("");
              }}
              aria-pressed={panel === "importar"}
              className="pl-4.5"
            >
              <IconoDocumento className="h-4 w-4" />
              Importar desde Excel
            </Boton>
            <Boton
              onClick={() => setPanel("crear")}
              aria-pressed={panel === "crear"}
              className="pl-4.5"
            >
              <IconoMas className="h-4 w-4" />
              Nuevo usuario
            </Boton>
          </>
        }
      />

      {panel === "crear" && (
        <PanelCreacion
          titulo="Nuevo usuario"
          descripcion="La persona podrá ingresar con este correo y la contraseña inicial."
          icono={<IconoInscripcion className="h-5 w-5" />}
          onCerrar={cerrarPanel}
        >
          <form onSubmit={crear}>
            <Paso
              numero={1}
              titulo="Datos de la persona"
              ayuda="Nombre y correo institucional."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta="Nombre"
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={cambiar("nombre")}
                  required
                  autoComplete="name"
                />
                <Campo
                  etiqueta="Correo"
                  type="email"
                  placeholder="correo@inacap.cl"
                  value={form.correo}
                  onChange={cambiar("correo")}
                  required
                  inputMode="email"
                  autoComplete="off"
                />
              </div>
            </Paso>

            <Paso
              numero={2}
              titulo="Acceso"
              ayuda="El rol define sus permisos iniciales; luego puedes ajustarlos."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  etiqueta="Contraseña inicial"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.clave}
                  onChange={cambiar("clave")}
                  required
                  autoComplete="new-password"
                  ayuda="Mínimo 8 caracteres."
                />
                <Campo
                  as="select"
                  etiqueta="Rol"
                  value={form.rol}
                  onChange={cambiar("rol")}
                >
                  {opcionesRol.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </Campo>
                <Campo
                  as="select"
                  etiqueta="Sede"
                  value={form.sede}
                  onChange={cambiar("sede")}
                  ayuda="Con los permisos “de su sede” solo verá las clínicas de esta sede."
                >
                  <OpcionesSede />
                </Campo>
              </div>
            </Paso>

            {error && (
              <Alerta variante="error" role="alert" className="mt-5">
                {error}
              </Alerta>
            )}

            <PieAcciones>
              <Boton variante="secundario" onClick={cerrarPanel}>
                Cancelar
              </Boton>
              <Boton type="submit">Crear usuario</Boton>
            </PieAcciones>
          </form>
        </PanelCreacion>
      )}

      {panel === "importar" && <ImportarUsuarios onCerrar={cerrarPanel} />}

      <Seccion
        titulo="Usuarios registrados"
        contador={`${usuariosFiltrados.length} de ${datos.usuarios.length}`}
      >
        <BarraFiltros
          hayFiltros={hayFiltros}
          onLimpiar={limpiarFiltros}
          chips={
            <Chips
              etiqueta="Filtrar por estado"
              valor={filtroEstado}
              onChange={conFiltro(setFiltroEstado)}
              opciones={[
                { valor: "", texto: "Todos" },
                { valor: "activos", texto: "Activos" },
                { valor: "inactivos", texto: "Inactivos" },
              ]}
            />
          }
        >
          <Campo
            etiqueta="Buscar usuario"
            type="search"
            placeholder="Nombre o correo"
            value={filtro}
            onChange={(e) => conFiltro(setFiltro)(e.target.value)}
            autoComplete="off"
          />
          <Campo
            as="select"
            etiqueta="Rol"
            value={filtroRol}
            onChange={(e) => conFiltro(setFiltroRol)(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {opcionesRol.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </Campo>
        </BarraFiltros>

        {usuariosFiltrados.length === 0 ? (
          <EstadoVacio
            icono={<IconoUsuarios className="h-6 w-6" />}
            titulo="No hay usuarios que coincidan"
            descripcion={
              hayFiltros
                ? "Prueba con otros filtros."
                : "Aún no hay usuarios registrados."
            }
            accion={
              hayFiltros ? (
                <Boton variante="secundario" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Boton>
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            {usuariosMostrados.map((u) => {
              const esYo = u.id === yo.id;
              const bloqueoRol = motivoBloqueoCambioRol(datos, u, yo);
              const pendiente = cambioRol?.id === u.id ? cambioRol : null;
              const permisosActivos = u.permisos.length;

              return (
                <Tarjeta
                  key={u.id}
                  className={cx(!u.activo && "bg-slate-50")}
                >
                  {/* Identidad y acción principal */}
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div
                      className={cx(
                        "flex min-w-0 items-center gap-3",
                        !u.activo && "opacity-70",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                      >
                        <IconoUsuarios className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-inacap">
                          {nombreRol(datos, u.rol)}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {u.nombre}{" "}
                            {esYo && (
                              <span className="font-normal text-slate-500">
                                (tú)
                              </span>
                            )}
                          </h3>
                          <Insignia tono={u.activo ? "exito" : "neutral"}>
                            {u.activo ? "Activo" : "Inactivo"}
                          </Insignia>
                        </div>
                        <p className="break-all text-sm text-slate-600">
                          {u.correo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {u.sede || "Sin sede asignada"}
                        </p>
                      </div>
                    </div>
                    {!esYo && (
                      <Boton
                        variante={u.activo ? "peligro-enlace" : "secundario"}
                        onClick={() => alternarActivo(u.id)}
                        className="self-start sm:self-auto"
                      >
                        {u.activo ? "Dar de baja" : "Reactivar"}
                      </Boton>
                    )}
                  </div>

                  {/* Rol y permisos */}
                  <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-[16rem_minmax(0,1fr)] sm:items-start sm:px-5">
                    <div className="space-y-3">
                    <Campo
                      as="select"
                      etiqueta="Rol"
                      value={pendiente ? pendiente.rol : u.rol}
                      disabled={Boolean(bloqueoRol)}
                      ayuda={bloqueoRol ?? undefined}
                      onChange={(e) =>
                        e.target.value === u.rol
                          ? setCambioRol(null)
                          : setCambioRol({ id: u.id, rol: e.target.value })
                      }
                    >
                      {opcionesRol.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </Campo>
                    <Campo
                      as="select"
                      etiqueta="Sede"
                      value={u.sede ?? ""}
                      onChange={(e) => cambiarSede(u.id, e.target.value)}
                    >
                      <OpcionesSede />
                    </Campo>
                    </div>

                    {/* Permisos, plegados para que la lista sea manejable */}
                    <details className="group rounded-control border border-slate-200 sm:mt-[1.625rem]">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                        <span>
                          Permisos{" "}
                          <span className="font-normal tabular-nums text-slate-500">
                            · {permisosActivos} de{" "}
                            {Object.keys(ETIQUETA_PERMISO).length} activos
                          </span>
                        </span>
                        <IconoChevronAbajo className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
                      </summary>
                      <div className="grid gap-1 border-t border-slate-200 p-2 sm:grid-cols-2">
                        {Object.entries(ETIQUETA_PERMISO).map(
                          ([permiso, etiqueta]) => {
                            const deshabilitado =
                              esYo &&
                              (permiso === PERMISOS.GESTIONAR_USUARIOS ||
                                permiso === PERMISOS.GESTIONAR_ROLES);
                            return (
                              <label
                                key={permiso}
                                className={cx(
                                  "flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-150",
                                  deshabilitado
                                    ? "cursor-not-allowed opacity-60"
                                    : "cursor-pointer hover:bg-slate-50",
                                )}
                                title={
                                  deshabilitado
                                    ? "No puedes quitarte este permiso"
                                    : undefined
                                }
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 shrink-0"
                                  checked={u.permisos.includes(permiso)}
                                  onChange={() =>
                                    alternarPermiso(u.id, permiso)
                                  }
                                  disabled={deshabilitado}
                                  aria-label={`${etiqueta} de ${u.nombre}`}
                                />
                                {etiqueta}
                              </label>
                            );
                          },
                        )}
                      </div>
                    </details>

                    {pendiente && (
                      <Alerta
                        variante="aviso"
                        role="alert"
                        titulo="Confirmar cambio de rol"
                        className="sm:col-span-2"
                        acciones={
                          <>
                            <Boton tamano="sm" onClick={confirmarRol}>
                              Sí, cambiar rol
                            </Boton>
                            <Boton
                              variante="secundario"
                              tamano="sm"
                              onClick={() => setCambioRol(null)}
                            >
                              Cancelar
                            </Boton>
                          </>
                        }
                      >
                        ¿Cambiar a {u.nombre} de {nombreRol(datos, u.rol)} a{" "}
                        <strong>{nombreRol(datos, pendiente.rol)}</strong>? Sus
                        permisos se reemplazarán por los del nuevo rol.
                      </Alerta>
                    )}
                  </div>
                </Tarjeta>
              );
            })}

            {usuariosFiltrados.length > usuariosMostrados.length && (
              <div className="pt-2 text-center">
                <Boton
                  variante="secundario"
                  onClick={() => setLimite(limite + POR_PAGINA)}
                >
                  Mostrar más (
                  {usuariosFiltrados.length - usuariosMostrados.length}{" "}
                  restantes)
                </Boton>
              </div>
            )}
          </div>
        )}
      </Seccion>
    </div>
  );
}
