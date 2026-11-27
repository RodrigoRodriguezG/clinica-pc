import { useState } from "react";
import { useApp } from "../store.jsx";
import { ETIQUETA_PERMISO } from "../constantes.js";
import {
  crearRol,
  eliminarRol,
  guardarRol,
  motivoBloqueoEliminar,
  permisoFijo,
  usuariosConRol,
  validarNombreRol,
} from "../lib/roles.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import Paso from "../components/ui/Paso.jsx";
import PanelCreacion, {
  PieAcciones,
} from "../components/ui/PanelCreacion.jsx";
import { cx } from "../components/ui/cx.js";
import {
  IconoBasura,
  IconoChevronAbajo,
  IconoEscudo,
  IconoMas,
} from "../components/ui/iconos.jsx";

const TOTAL_PERMISOS = Object.keys(ETIQUETA_PERMISO).length;

const mismosPermisos = (a, b) =>
  a.length === b.length && a.every((p) => b.includes(p));

// Casillas de todos los permisos; los fijos del rol quedan marcados y bloqueados
function CasillasPermisos({ rolId = null, permisos, onAlternar, nombreRol }) {
  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {Object.entries(ETIQUETA_PERMISO).map(([permiso, etiqueta]) => {
        const fijo = rolId !== null && permisoFijo(rolId, permiso);
        return (
          <label
            key={permiso}
            className={cx(
              "flex min-h-11 items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-150",
              fijo
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-slate-50",
            )}
            title={
              fijo ? "El administrador siempre conserva este permiso" : undefined
            }
          >
            <input
              type="checkbox"
              className="h-4 w-4 shrink-0"
              checked={fijo || permisos.includes(permiso)}
              onChange={() => onAlternar(permiso)}
              disabled={fijo}
              aria-label={`${etiqueta}${nombreRol ? ` en ${nombreRol}` : ""}`}
            />
            {etiqueta}
          </label>
        );
      })}
    </div>
  );
}

const alternar = (lista, permiso) =>
  lista.includes(permiso)
    ? lista.filter((p) => p !== permiso)
    : [...lista, permiso];

function NuevoRol({ onCerrar }) {
  const { datos, actualizar } = useApp();
  const [nombre, setNombre] = useState("");
  const [base, setBase] = useState("");
  const [permisos, setPermisos] = useState([]);
  const [error, setError] = useState("");

  const elegirBase = (id) => {
    setBase(id);
    const rol = datos.roles.find((r) => r.id === id);
    if (rol) setPermisos([...rol.permisos]);
  };

  const crear = (e) => {
    e.preventDefault();
    const motivo = validarNombreRol(datos, nombre);
    if (motivo) return setError(motivo);
    if (permisos.length === 0)
      return setError("Elige al menos un permiso para el rol.");
    const nuevo = crearRol(nombre, permisos);
    actualizar((d) => ({ ...d, roles: [...d.roles, nuevo] }));
    onCerrar();
  };

  return (
    <PanelCreacion
      titulo="Nuevo rol"
      descripcion="Los usuarios que reciban este rol partirán con los permisos que elijas."
      icono={<IconoEscudo className="h-5 w-5" />}
      onCerrar={onCerrar}
    >
      <form onSubmit={crear}>
        <Paso numero={1} titulo="Nombre" ayuda="Cómo se verá en la lista de usuarios.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Nombre del rol"
              placeholder="Ej.: Ayudante de recepción"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoComplete="off"
            />
            <Campo
              as="select"
              etiqueta="Basado en (opcional)"
              value={base}
              onChange={(e) => elegirBase(e.target.value)}
              ayuda="Copia los permisos de un rol existente."
            >
              <option value="">Partir de cero</option>
              {datos.roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </Campo>
          </div>
        </Paso>

        <Paso
          numero={2}
          titulo="Permisos"
          ayuda={`${permisos.length} de ${TOTAL_PERMISOS} seleccionados.`}
        >
          <div className="rounded-control border border-slate-200 p-2">
            <CasillasPermisos
              permisos={permisos}
              onAlternar={(p) => setPermisos(alternar(permisos, p))}
            />
          </div>
        </Paso>

        {error && (
          <Alerta variante="error" role="alert" className="mt-5">
            {error}
          </Alerta>
        )}

        <PieAcciones>
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit">Crear rol</Boton>
        </PieAcciones>
      </form>
    </PanelCreacion>
  );
}

function TarjetaRol({ rol }) {
  const { datos, actualizar, usuario: yo } = useApp();
  // Cambios sin guardar; null = igual a lo guardado
  const [borrador, setBorrador] = useState(null);
  const nombre = borrador?.nombre ?? rol.nombre;
  const permisos = borrador?.permisos ?? rol.permisos;
  const setNombre = (valor) => setBorrador({ nombre: valor, permisos });
  const setPermisos = (lista) => setBorrador({ nombre, permisos: lista });
  const [aplicar, setAplicar] = useState(true);
  const [error, setError] = useState("");
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);

  const usuarios = usuariosConRol(datos, rol.id);
  const bloqueoBorrar = motivoBloqueoEliminar(datos, rol);
  const hayCambios =
    nombre.trim() !== rol.nombre || !mismosPermisos(permisos, rol.permisos);

  const descartar = () => {
    setBorrador(null);
    setAplicar(true);
    setError("");
  };

  const guardar = () => {
    const motivo = validarNombreRol(datos, nombre, rol.id);
    if (motivo) return setError(motivo);
    setError("");
    actualizar((d) =>
      guardarRol(d, rol.id, { nombre, permisos }, aplicar, yo.id),
    );
    descartar();
  };

  const borrar = () => {
    if (motivoBloqueoEliminar(datos, rol)) return setConfirmarBorrar(false);
    actualizar((d) => eliminarRol(d, rol.id));
  };

  return (
    <Tarjeta>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <IconoEscudo className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900">{rol.nombre}</h3>
            <p className="text-sm tabular-nums text-slate-600">
              {usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}{" "}
              · {rol.permisos.length} de {TOTAL_PERMISOS} permisos
            </p>
          </div>
        </div>
        <Boton
          variante="peligro-enlace"
          onClick={() => setConfirmarBorrar(true)}
          disabled={Boolean(bloqueoBorrar)}
          className="self-start sm:self-auto"
        >
          <IconoBasura className="h-4 w-4" />
          Eliminar
        </Boton>
      </div>

      {bloqueoBorrar && (
        <p className="-mt-2 px-4 pb-3 text-xs text-slate-500 sm:px-5">
          No se puede eliminar: {bloqueoBorrar}
        </p>
      )}

      <div className="space-y-4 border-t border-slate-100 px-4 py-4 sm:px-5">
        {confirmarBorrar && (
          <Alerta
            variante="aviso"
            role="alert"
            titulo="Eliminar rol"
            acciones={
              <>
                <Boton tamano="sm" variante="peligro" onClick={borrar}>
                  Sí, eliminar
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  onClick={() => setConfirmarBorrar(false)}
                >
                  Cancelar
                </Boton>
              </>
            }
          >
            ¿Eliminar el rol <strong>{rol.nombre}</strong>? Esta acción no se
            puede deshacer.
          </Alerta>
        )}

        <details className="group rounded-control border border-slate-200">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-control px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
            Editar nombre y permisos
            <IconoChevronAbajo className="h-4 w-4 shrink-0 transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <div className="space-y-3 border-t border-slate-200 p-2">
            <Campo
              etiqueta="Nombre del rol"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="off"
              className="px-2 pt-2 sm:max-w-sm"
            />
            <CasillasPermisos
              rolId={rol.id}
              permisos={permisos}
              nombreRol={rol.nombre}
              onAlternar={(p) => setPermisos(alternar(permisos, p))}
            />
          </div>
        </details>

        {error && (
          <Alerta variante="error" role="alert">
            {error}
          </Alerta>
        )}

        {hayCambios && (
          <Alerta
            variante="info"
            titulo="Cambios sin guardar"
            acciones={
              <>
                <Boton tamano="sm" onClick={guardar}>
                  Guardar cambios
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={descartar}>
                  Descartar
                </Boton>
              </>
            }
          >
            {usuarios.length > 0 ? (
              <label className="mt-1 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  checked={aplicar}
                  onChange={(e) => setAplicar(e.target.checked)}
                />
                <span>
                  Aplicar también a{" "}
                  {usuarios.length === 1
                    ? "el usuario"
                    : `los ${usuarios.length} usuarios`}{" "}
                  con este rol. Si lo desmarcas, solo cambia para las próximas
                  asignaciones.
                </span>
              </label>
            ) : (
              "Nadie tiene este rol todavía; los cambios aplican a las próximas asignaciones."
            )}
          </Alerta>
        )}
      </div>
    </Tarjeta>
  );
}

export default function Roles() {
  const { datos } = useApp();
  const [creando, setCreando] = useState(false);

  const roles = [...datos.roles].sort((a, b) =>
    a.nombre.localeCompare(b.nombre),
  );

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Roles"
        descripcion="Conjuntos de permisos que se asignan a los usuarios."
        acciones={
          <Boton
            onClick={() => setCreando(true)}
            aria-pressed={creando}
            className="pl-4.5"
          >
            <IconoMas className="h-4 w-4" />
            Nuevo rol
          </Boton>
        }
      />

      {creando && <NuevoRol onCerrar={() => setCreando(false)} />}

      <Seccion titulo="Roles registrados" contador={roles.length}>
        <div className="space-y-3">
          {roles.map((r) => (
            <TarjetaRol key={r.id} rol={r} />
          ))}
        </div>
      </Seccion>
    </div>
  );
}
