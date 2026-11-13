import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  NOMBRE_ROL,
  ETIQUETA_PERMISO,
  PERMISOS_POR_ROL,
  PERMISOS,
} from "../constantes.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { cx } from "../components/ui/cx.js";
import { IconoUsuarios } from "../components/ui/iconos.jsx";

const FORMULARIO_VACIO = { nombre: "", correo: "", clave: "", rol: "tecnico" };

export default function Usuarios() {
  const { datos, actualizar, usuario: yo } = useApp();
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("");

  // Normaliza texto para buscar sin distinguir mayúsculas ni acentos
  const normalizar = (texto) =>
    String(texto ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const busqueda = normalizar(filtro.trim());
  const usuariosVisibles = datos.usuarios.filter((u) => {
    if (!busqueda) return true;
    return (
      normalizar(u.nombre).includes(busqueda) ||
      normalizar(u.correo).includes(busqueda) ||
      normalizar(u.rol).includes(busqueda) ||
      normalizar(NOMBRE_ROL[u.rol]).includes(busqueda)
    );
  });

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

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Usuarios y permisos"
        descripcion="Crea cuentas y ajusta qué puede hacer cada persona en el sistema."
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
        <Campo
          etiqueta="Buscar usuario"
          type="search"
          placeholder="Filtrar por nombre, correo o rol"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          aria-label="Filtrar usuarios"
          autoComplete="off"
        />
      </Tarjeta>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-700">
          Usuarios registrados
        </h2>
        <p className="text-sm text-neutral-600" aria-live="polite">
          {usuariosVisibles.length}{" "}
          {usuariosVisibles.length === 1 ? "usuario" : "usuarios"}
        </p>
      </div>

      {usuariosVisibles.length === 0 ? (
        <EstadoVacio
          icono={<IconoUsuarios className="h-6 w-6" />}
          titulo="No hay usuarios que coincidan"
          descripcion={
            filtro.trim()
              ? `No encontramos usuarios para “${filtro.trim()}”.`
              : "Aún no hay usuarios registrados."
          }
          accion={
            filtro ? (
              <Boton variante="secundario" onClick={() => setFiltro("")}>
                Limpiar búsqueda
              </Boton>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {usuariosVisibles.map((u) => {
            const esYo = u.id === yo.id;
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
                        {u.correo} · {NOMBRE_ROL[u.rol]}
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

                <fieldset className="mt-4 border-t border-neutral-200 pt-4">
                  <legend className="text-sm font-semibold text-neutral-700">
                    Permisos
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
                </fieldset>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </div>
  );
}
