import { createElement, useState } from "react";
import { useApp } from "../store.jsx";
import { ESTADOS_TECNICO } from "../constantes.js";
import { nombreCompleto, mostrarTelefono, normalizar } from "../lib/texto.js";
import {
  propietarioDeFicha,
  puedeEditarFicha,
  puedeVerContacto,
  fichasDeEquipo,
} from "../lib/fichas.js";
import AtencionAnterior from "./AtencionAnterior.jsx";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import Insignia from "./ui/Insignia.jsx";
import PestanasNav from "./ui/PestanasNav.jsx";
import {
  IconoAlerta,
  IconoCheck,
  IconoTelefono,
  IconoXCircle,
} from "./ui/iconos.jsx";

// ok: true = correcto, false = con falla, null = sin revisar
const VALOR = { pendiente: null, ok: true, falla: false };
const CLAVE = (v) => (v === true ? "ok" : v === false ? "falla" : "pendiente");

const OPCIONES_CHECKLIST = [
  {
    clave: "ok",
    texto: "Correcto",
    Icono: IconoCheck,
    activo: "border-exito bg-exito-tenue text-exito-fuerte",
  },
  {
    clave: "falla",
    texto: "Con falla",
    Icono: IconoXCircle,
    activo: "border-error bg-error-tenue text-error",
  },
  {
    clave: "pendiente",
    texto: "Sin revisar",
    Icono: IconoAlerta,
    activo: "border-neutral-400 bg-neutral-100 text-neutral-700",
  },
];

export default function DetalleFicha({ ficha }) {
  const { datos, actualizar, usuario } = useApp();

  const equipo = datos.equipos.find((e) => e.id === ficha.equipoId);
  const propietario = propietarioDeFicha(datos, ficha);
  const editable = puedeEditarFicha(usuario, ficha);
  const anterior = fichasDeEquipo(datos, ficha.equipoId).find(
    (f) => f.id !== ficha.id && f.creada < ficha.creada,
  );
  const nombreUsuario = (id) =>
    datos.usuarios.find((u) => u.id === id)?.nombre ?? "Usuario no disponible";

  // Se calcula con lo ya guardado, no con lo que se está escribiendo
  const datosCompletos = Boolean(
    equipo?.marca &&
      equipo?.modelo &&
      equipo?.numeroSerie &&
      ficha.diagnostico &&
      ficha.trabajo,
  );
  // El técnico no avanza a checklist y observaciones hasta guardar los datos técnicos
  const bloqueado = editable && !datosCompletos;

  const [pestana, setPestana] = useState(
    datosCompletos ? "checklist" : "datos",
  );
  const [verAnterior, setVerAnterior] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState("");
  const [errorDatos, setErrorDatos] = useState("");
  const [confirmarReingreso, setConfirmarReingreso] = useState(false);
  const [datosForm, setDatosForm] = useState({
    marca: equipo?.marca ?? "",
    modelo: equipo?.modelo ?? "",
    numeroSerie: equipo?.numeroSerie ?? "",
    diagnostico: ficha.diagnostico ?? "",
    trabajo: ficha.trabajo ?? "",
  });

  const revisados = ficha.checklist.filter((i) => i.ok !== null).length;

  // Busca atenciones anteriores con el mismo número de serie en otros equipos
  const serieBuscada = normalizar(datosForm.numeroSerie.trim());
  const reingresos = serieBuscada
    ? datos.fichas
        .filter((f) => {
          if (f.id === ficha.id) return false;
          const eq = datos.equipos.find((e) => e.id === f.equipoId);
          return (
            eq &&
            eq.id !== equipo.id &&
            normalizar(eq.numeroSerie) === serieBuscada
          );
        })
        .sort((a, b) => b.creada.localeCompare(a.creada))
    : [];

  const irA = (id) => {
    setPestana(id);
    setAviso("");
  };

  // Aplica un cambio a esta ficha
  const modificar = (fn) =>
    actualizar((d) => ({
      ...d,
      fichas: d.fichas.map((f) => (f.id === ficha.id ? fn(f) : f)),
    }));

  const cambiarDato = (campo) => (e) => {
    setDatosForm({ ...datosForm, [campo]: e.target.value });
    if (campo === "numeroSerie") setConfirmarReingreso(false);
  };

  const guardarDatos = (e) => {
    e.preventDefault();
    const marca = datosForm.marca.trim();
    const modelo = datosForm.modelo.trim();
    const numeroSerie = datosForm.numeroSerie.trim();
    const diagnostico = datosForm.diagnostico.trim();
    const trabajo = datosForm.trabajo.trim();

    if (!marca || !modelo || !numeroSerie)
      return setErrorDatos("Completa marca, modelo y número de serie.");
    if (!diagnostico || !trabajo)
      return setErrorDatos("Completa el diagnóstico y el trabajo a realizar.");
    if (reingresos.length > 0 && !confirmarReingreso)
      return setErrorDatos(
        "Este número de serie tiene atenciones anteriores. Revisa el historial y marca la confirmación de reingreso.",
      );

    setErrorDatos("");
    // Un solo cambio actualiza el equipo y la ficha a la vez
    actualizar((d) => ({
      ...d,
      equipos: d.equipos.map((x) =>
        x.id === equipo.id ? { ...x, marca, modelo, numeroSerie } : x,
      ),
      fichas: d.fichas.map((f) =>
        f.id === ficha.id ? { ...f, diagnostico, trabajo } : f,
      ),
    }));
    setAviso("Datos técnicos guardados.");
    setConfirmarReingreso(false);
    setPestana("checklist");
  };

  const cambiarItem = (itemId, clave) =>
    modificar((f) => ({
      ...f,
      checklist: f.checklist.map((i) =>
        i.itemId === itemId ? { ...i, ok: VALOR[clave] } : i,
      ),
    }));

  const cambiarEstado = (estado) => modificar((f) => ({ ...f, estado }));

  const agregarObservacion = (e) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    modificar((f) => ({
      ...f,
      observaciones: [
        ...f.observaciones,
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          autorId: usuario.id,
          texto: limpio,
        },
      ],
    }));
    setTexto("");
  };

  const PESTANAS = [
    { id: "datos", etiqueta: "Datos técnicos" },
    {
      id: "checklist",
      etiqueta: `Checklist (${revisados}/${ficha.checklist.length})`,
      disabled: bloqueado,
    },
    {
      id: "observaciones",
      etiqueta: `Observaciones (${ficha.observaciones.length})`,
      disabled: bloqueado,
    },
  ];

  return (
    <div className="space-y-5 text-sm">
      {!editable && (
        <Alerta variante="info">
          Solo lectura:{" "}
          {ficha.tecnicosIds.includes(usuario.id)
            ? "la ficha ya está cerrada."
            : "no estás asignado a esta ficha."}
        </Alerta>
      )}

      {/* Resumen siempre visible */}
      <section className="space-y-3 rounded-control border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <dl className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Equipo
              </dt>
              <dd className="mt-0.5 font-medium text-neutral-800">
                {equipo?.numeroEquipo} · {equipo?.tipo}
                {equipo?.marca && ` · ${equipo.marca} ${equipo.modelo}`}
              </dd>
            </div>
            {equipo?.accesorios && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Accesorios
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {equipo.accesorios}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Técnicos
              </dt>
              <dd className="mt-0.5 text-neutral-800">
                {ficha.tecnicosIds.map(nombreUsuario).join(" y ")}
              </dd>
            </div>
          </dl>

          <div className="shrink-0">
            {editable ? (
              <Campo
                as="select"
                etiqueta="Estado"
                className="w-full sm:w-52"
                value={ficha.estado}
                disabled={!datosCompletos}
                onChange={(e) => cambiarEstado(e.target.value)}
              >
                {ESTADOS_TECNICO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Campo>
            ) : (
              <div className="space-y-1.5">
                <span className="block text-sm font-semibold text-tinta">
                  Estado
                </span>
                <Insignia estado={ficha.estado} />
              </div>
            )}
          </div>
        </div>

        {bloqueado && (
          <Alerta variante="aviso">
            Registra los datos técnicos para poder cambiar el estado.
          </Alerta>
        )}
      </section>

      {propietario && puedeVerContacto(usuario, ficha) && (
        <section className="space-y-2 rounded-control border border-neutral-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-tinta">
            <IconoTelefono className="h-4 w-4 text-neutral-500" />
            Contacto del propietario
          </h3>
          <p className="text-neutral-800">
            {nombreCompleto(propietario)} ·{" "}
            <a
              className="font-semibold text-inacap underline underline-offset-4 hover:text-inacap-oscuro"
              href={`tel:+56${propietario.telefono}`}
            >
              {mostrarTelefono(propietario.telefono)}
            </a>
          </p>
          {ficha.estado === "Listo" && (
            <Alerta variante="exito">
              El equipo está listo: avisa al propietario.
            </Alerta>
          )}
        </section>
      )}

      {anterior && (
        <div className="space-y-2">
          <Boton
            variante="enlace"
            onClick={() => setVerAnterior(!verAnterior)}
            aria-expanded={verAnterior}
          >
            {verAnterior
              ? "Ocultar atención anterior"
              : "Ver atención anterior de este equipo"}
          </Boton>
          {verAnterior && (
            <AtencionAnterior
              ficha={anterior}
              onCerrar={() => setVerAnterior(false)}
            />
          )}
        </div>
      )}

      {aviso && (
        <Alerta variante="exito" role="status">
          {aviso}
        </Alerta>
      )}

      {/* Pestañas */}
      <PestanasNav
        pestanas={PESTANAS}
        activa={pestana}
        onChange={irA}
        etiqueta="Detalle de la ficha"
      />

      {pestana === "datos" && (
        <section role="tabpanel" className="space-y-4">
          {editable ? (
            <form onSubmit={guardarDatos} className="space-y-4">
              {!datosCompletos && (
                <Alerta variante="aviso">
                  Completa estos datos para habilitar el checklist y las
                  observaciones.
                </Alerta>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Campo
                  etiqueta="Marca"
                  value={datosForm.marca}
                  onChange={cambiarDato("marca")}
                  maxLength={40}
                  autoComplete="off"
                />
                <Campo
                  etiqueta="Modelo"
                  value={datosForm.modelo}
                  onChange={cambiarDato("modelo")}
                  maxLength={60}
                  autoComplete="off"
                />
                <Campo
                  etiqueta="Número de serie"
                  value={datosForm.numeroSerie}
                  onChange={cambiarDato("numeroSerie")}
                  maxLength={40}
                  autoComplete="off"
                />
              </div>

              {reingresos.length > 0 && (
                <div className="space-y-3">
                  <Alerta
                    variante="aviso"
                    titulo="Posible reingreso: este número de serie ya fue atendido"
                  >
                    Se encontraron {reingresos.length} atención(es) anterior(es)
                    con la serie {datosForm.numeroSerie.trim()}. Revisa qué se
                    hizo antes y por qué podría haber vuelto.
                  </Alerta>

                  {reingresos.map((f) => (
                    <AtencionAnterior key={f.id} ficha={f} />
                  ))}

                  <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-amber-200 bg-aviso-tenue p-3.5 text-sm leading-relaxed text-amber-900">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0"
                      checked={confirmarReingreso}
                      onChange={(e) =>
                        setConfirmarReingreso(e.target.checked)
                      }
                    />
                    <span>
                      Confirmo que es el mismo equipo y que revisé el historial
                      anterior.
                    </span>
                  </label>
                </div>
              )}

              <Campo
                as="textarea"
                etiqueta="Diagnóstico"
                rows={3}
                value={datosForm.diagnostico}
                onChange={cambiarDato("diagnostico")}
                maxLength={500}
                autoComplete="off"
              />
              <Campo
                as="textarea"
                etiqueta="Trabajo a realizar"
                rows={3}
                value={datosForm.trabajo}
                onChange={cambiarDato("trabajo")}
                maxLength={500}
                autoComplete="off"
              />

              {errorDatos && (
                <Alerta variante="error" role="alert">
                  {errorDatos}
                </Alerta>
              )}

              <Boton type="submit" bloque className="sm:w-auto">
                Guardar datos técnicos
              </Boton>
            </form>
          ) : (
            <dl className="grid gap-3 rounded-control border border-neutral-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Marca y modelo
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {equipo?.marca
                    ? `${equipo.marca} ${equipo.modelo}`
                    : "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Número de serie
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {equipo?.numeroSerie || "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Diagnóstico
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {ficha.diagnostico || "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Trabajo a realizar
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {ficha.trabajo || "Pendiente"}
                </dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {pestana === "checklist" && (
        <section role="tabpanel" className="space-y-3">
          <ul className="space-y-3">
            {ficha.checklist.map((i) => {
              const valorActual = CLAVE(i.ok);
              return (
                <li
                  key={i.itemId}
                  className="rounded-control border border-neutral-200 bg-white p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-neutral-800">{i.texto}</p>
                    <div
                      role="group"
                      aria-label={`Resultado: ${i.texto}`}
                      className="grid grid-cols-3 gap-1.5 sm:w-auto"
                    >
                      {OPCIONES_CHECKLIST.map(({ clave, texto, Icono, activo }) => {
                        const seleccionado = valorActual === clave;
                        return (
                          <button
                            key={clave}
                            type="button"
                            aria-pressed={seleccionado}
                            aria-label={`${texto}: ${i.texto}`}
                            disabled={!editable}
                            onClick={() => cambiarItem(i.itemId, clave)}
                            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control border px-2 py-2 text-xs font-semibold leading-tight transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                              seleccionado
                                ? activo
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            {createElement(Icono, {
                              className: "h-4 w-4 shrink-0",
                            })}
                            <span className="text-center">{texto}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              );
            })}
            {ficha.checklist.length === 0 && (
              <li>
                <Alerta variante="info">
                  Esta ficha no tiene ítems de checklist.
                </Alerta>
              </li>
            )}
          </ul>
        </section>
      )}

      {pestana === "observaciones" && (
        <section role="tabpanel" className="space-y-4">
          <ul className="space-y-2">
            {ficha.observaciones.map((o) => (
              <li
                key={o.id}
                className="rounded-control border border-neutral-200 bg-white p-3"
              >
                <p className="text-neutral-800">{o.texto}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {nombreUsuario(o.autorId)} ·{" "}
                  {new Date(o.fecha).toLocaleString("es-CL")}
                </p>
              </li>
            ))}
            {ficha.observaciones.length === 0 && (
              <li className="text-neutral-600">Sin observaciones.</li>
            )}
          </ul>

          {editable && (
            <form onSubmit={agregarObservacion} className="space-y-3">
              <Campo
                as="textarea"
                etiqueta="Nueva observación"
                rows={3}
                maxLength={500}
                placeholder="Escribe una observación"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-label="Nueva observación"
                autoComplete="off"
              />
              <Boton type="submit" bloque className="sm:w-auto">
                Agregar
              </Boton>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
