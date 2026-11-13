import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  NOMBRE_ROL,
  ETIQUETA_PERMISO,
  PERMISOS_POR_ROL,
  PERMISOS,
} from "../constantes.js";
import { normalizar } from "../lib/texto.js";
import { aplicarRol, motivoBloqueoCambioRol } from "../lib/usuarios.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { cx } from "../components/ui/cx.js";
import { IconoChevronAbajo, IconoUsuarios } from "../components/ui/iconos.jsx";

const FORMULARIO_VACIO = { nombre: "", correo: "", clave: "", rol: "tecnico" };
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

  // Al cambiar un filtro se vuelve a la primera página
  const conFiltro = (setter) => (valor) => {
    setter(valor);
    setLimite(POR_PAGINA);
  };

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
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

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
      permisos: PERMISOS_POR_ROL[form.rol], // permisos iniciales según el rol
      activo: true,
    };
    actualizar((d) => ({ ...d, usuarios: [...d.usuarios, nuevo] }));
    setForm(FORMULARIO_VACIO);
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
        x.id === u.id ? aplicarRol(x, cambioRol.rol) : x,
      ),
    }));
    setCambioRol(null);
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Usuarios y permisos"
        descripcion="Los técnicos se registran solos desde el login. Aquí puedes cambiar el rol de una cuenta, ajustar permisos o dar de baja."
      />

      <Tarjeta className="p-4 sm:p-5">
        <form onSubmit={crear} className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              <IconoUsuarios className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-tinta">Nuevo usuario</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              {Object.keys(NOMBRE_ROL).map((r) => (
                <option key={r} value={r}>
                  {NOMBRE_ROL[r]}
                </option>
              ))}
            </Campo>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Boton type="submit" bloque className="sm:w-auto">
              Crear usuario
            </Boton>
          </div>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
        </form>
      </Tarjeta>

      <Tarjeta className="p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
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
            {Object.keys(NOMBRE_ROL).map((r) => (
              <option key={r} value={r}>
                {NOMBRE_ROL[r]}
              </option>
            ))}
          </Campo>
          <Campo
            as="select"
            etiqueta="Estado"
            value={filtroEstado}
            onChange={(e) => conFiltro(setFiltroEstado)(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </Campo>
        </div>
      </Tarjeta>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Usuarios registrados
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-neutral-600" aria-live="polite">
            {usuariosFiltrados.length} de {datos.usuarios.length}
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-sm font-medium text-inacap underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

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
        <div className="space-y-4">
          {usuariosMostrados.map((u) => {
            const esYo = u.id === yo.id;
            const bloqueoRol = motivoBloqueoCambioRol(datos, u, yo);
            const pendiente = cambioRol?.id === u.id ? cambioRol : null;
            const permisosActivos = u.permisos.length;

            return (
              <Tarjeta
                key={u.id}
                className={cx("p-4 sm:p-5", !u.activo && "opacity-70")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
                    >
                      <IconoUsuarios className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-tinta">
                          {u.nombre} {esYo && "(tú)"}
                        </h2>
                        <Insignia tono={u.activo ? "exito" : "neutral"}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </Insignia>
                      </div>
                      <p className="break-all text-sm text-neutral-600">
                        {u.correo}
                      </p>
                    </div>
                  </div>
                  {!esYo && (
                    <Boton
                      variante="secundario"
                      onClick={() => alternarActivo(u.id)}
                    >
                      {u.activo ? "Dar de baja" : "Reactivar"}
                    </Boton>
                  )}
                </div>

                {/* Rol */}
                <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4">
                  <Campo
                    as="select"
                    etiqueta="Rol"
                    className="sm:max-w-xs"
                    value={pendiente ? pendiente.rol : u.rol}
                    disabled={Boolean(bloqueoRol)}
                    ayuda={bloqueoRol ?? undefined}
                    onChange={(e) =>
                      e.target.value === u.rol
                        ? setCambioRol(null)
                        : setCambioRol({ id: u.id, rol: e.target.value })
                    }
                  >
                    {Object.keys(NOMBRE_ROL).map((r) => (
                      <option key={r} value={r}>
                        {NOMBRE_ROL[r]}
                      </option>
                    ))}
                  </Campo>

                  {pendiente && (
                    <div
                      role="alert"
                      className="space-y-3 rounded-control border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                    >
                      <p>
                        ¿Cambiar a {u.nombre} de {NOMBRE_ROL[u.rol]} a{" "}
                        <strong>{NOMBRE_ROL[pendiente.rol]}</strong>? Sus
                        permisos se reemplazarán por los del nuevo rol.
                      </p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Boton onClick={confirmarRol}>Sí, cambiar rol</Boton>
                        <Boton
                          variante="secundario"
                          onClick={() => setCambioRol(null)}
                        >
                          Cancelar
                        </Boton>
                      </div>
                    </div>
                  )}
                </div>

                {/* Permisos, plegados para que la lista sea manejable */}
                <details className="group mt-4 rounded-control border border-neutral-200 bg-neutral-50">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-neutral-700 [&::-webkit-details-marker]:hidden">
                    Permisos ({permisosActivos} de{" "}
                    {Object.keys(ETIQUETA_PERMISO).length} activos)
                    <IconoChevronAbajo className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
                  </summary>
                  <div className="grid gap-2 border-t border-neutral-200 p-3 sm:grid-cols-2">
                    {Object.entries(ETIQUETA_PERMISO).map(
                      ([permiso, etiqueta]) => {
                        const deshabilitado =
                          esYo && permiso === PERMISOS.GESTIONAR_USUARIOS;
                        return (
                          <label
                            key={permiso}
                            className={cx(
                              "flex min-h-11 items-center gap-3 rounded-control border border-neutral-200 bg-white px-3 py-2 text-sm transition-colors duration-150",
                              deshabilitado
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:border-neutral-300 hover:bg-neutral-50",
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
                              onChange={() => alternarPermiso(u.id, permiso)}
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
              </Tarjeta>
            );
          })}

          {usuariosFiltrados.length > usuariosMostrados.length && (
            <div className="text-center">
              <Boton
                variante="secundario"
                onClick={() => setLimite(limite + POR_PAGINA)}
              >
                Mostrar más (
                {usuariosFiltrados.length - usuariosMostrados.length} restantes)
              </Boton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
