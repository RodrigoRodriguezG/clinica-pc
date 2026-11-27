import { createElement, useState } from "react";
import { useApp } from "../store.jsx";
import {
  ESTADO_CIERRE_ANTICIPADO,
  ESTADO_ENTREGADO,
  ESTADO_LISTO,
  NO_APLICA,
} from "../constantes.js";
import { nombreCompleto, mostrarTelefono, normalizar } from "../lib/texto.js";
import {
  propietarioDeFicha,
  puedeEditarFicha,
  puedeVerContacto,
  puedeRechazarOCerrar,
  fichasDeEquipo,
  rechazarFicha,
  cerrarAnticipadamente,
  cerrarFicha,
  entregarFicha,
  puedeEntregarFicha,
  estadoTrasGuardarDatos,
} from "../lib/fichas.js";
import {
  aplicarPlantilla,
  checklistIniciado,
  esPlantillaDeServicio,
  plantillasOrdenadas,
} from "../lib/checklists.js";
import AtencionAnterior from "./AtencionAnterior.jsx";
import EncuestaFicha from "./EncuestaFicha.jsx";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import Insignia from "./ui/Insignia.jsx";
import PestanasNav from "./ui/PestanasNav.jsx";
import { IconoCheck, IconoTelefono, IconoXCircle } from "./ui/iconos.jsx";

// ok: true = correcto, false = con falla, 'na' = no aplica, null = pendiente
const VALOR = { ok: true, falla: false, na: NO_APLICA };
const CLAVE = (v) =>
  v === true ? "ok" : v === false ? "falla" : v === NO_APLICA ? "na" : null;

function IconoNoAplica({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

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
    clave: "na",
    texto: "No aplica",
    Icono: IconoNoAplica,
    activo: "border-slate-400 bg-slate-100 text-slate-700",
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
    ficha.trabajo &&
    ficha.plantillaId,
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
  const [accion, setAccion] = useState(null); // 'rechazar' | 'cerrar' | null
  const [confirmarCierre, setConfirmarCierre] = useState(false);
  const [confirmarEntrega, setConfirmarEntrega] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [datosForm, setDatosForm] = useState({
    marca: equipo?.marca ?? "",
    modelo: equipo?.modelo ?? "",
    numeroSerie: equipo?.numeroSerie ?? "",
    accesorios: equipo?.accesorios ?? "",
    trabajo: ficha.trabajo ?? "",
    plantillaId: ficha.plantillaId ?? "",
  });

  // Checklists que puede elegir el técnico. Con ítems ya revisados no se cambia
  const plantillas = plantillasOrdenadas(datos);
  const checklistFijo = checklistIniciado(ficha);

  const revisados = ficha.checklist.filter((i) => i.ok !== null).length;
  const checklistCompleto = revisados === ficha.checklist.length;

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

  const textoSoloLectura =
    ficha.estado === ESTADO_CIERRE_ANTICIPADO
      ? "la ficha tiene cierre anticipado."
      : ficha.estado === ESTADO_LISTO
        ? "la ficha está cerrada y el equipo está listo para la entrega."
        : ficha.tecnicosIds.includes(usuario.id)
          ? "la ficha ya está cerrada."
          : "no estás asignado a esta ficha.";

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
    const accesorios = datosForm.accesorios.trim();
    const trabajo = datosForm.trabajo.trim();

    if (!marca || !modelo || !numeroSerie)
      return setErrorDatos("Completa marca, modelo y número de serie.");
    if (!trabajo) return setErrorDatos("Completa el trabajo a realizar.");
    const plantilla = datos.plantillas.find(
      (p) => p.id === datosForm.plantillaId,
    );
    const cambiaChecklist =
      !checklistFijo && datosForm.plantillaId !== ficha.plantillaId;
    if (cambiaChecklist && !plantilla)
      return setErrorDatos("Elige el servicio (checklist) para este equipo.");
    if (reingresos.length > 0 && !confirmarReingreso)
      return setErrorDatos(
        "Este número de serie tiene atenciones anteriores. Revisa el historial y marca la confirmación de reingreso.",
      );

    setErrorDatos("");
    // Un solo cambio actualiza el equipo y la ficha a la vez
    actualizar((d) => ({
      ...d,
      equipos: d.equipos.map((x) =>
        x.id === equipo.id
          ? { ...x, marca, modelo, numeroSerie, accesorios }
          : x,
      ),
      // Guardar los datos técnicos pasa la ficha a "En reparación"
      // Elegir el checklist define el servicio de la ficha (su nombre)
      fichas: d.fichas.map((f) => {
        if (f.id !== ficha.id) return f;
        const actualizada = {
          ...f,
          trabajo,
          estado: estadoTrasGuardarDatos(f),
        };
        return cambiaChecklist
          ? aplicarPlantilla(actualizada, plantilla)
          : actualizada;
      }),
    }));
    setAviso(
      ficha.estado === "Recibido"
        ? "Datos técnicos guardados. La ficha pasó a En reparación."
        : "Datos técnicos guardados.",
    );
    setConfirmarReingreso(false);
    setPestana("checklist");
  };

  // Pulsar la opción ya marcada la desmarca: el ítem vuelve a pendiente
  const cambiarItem = (itemId, clave) =>
    modificar((f) => ({
      ...f,
      checklist: f.checklist.map((i) =>
        i.itemId !== itemId
          ? i
          : { ...i, ok: CLAVE(i.ok) === clave ? null : VALOR[clave] },
      ),
    }));

  // Cerrar la ficha la deja "Listo". El correo al propietario aún no se
  // envía de verdad (prototipo solo front end): por ahora solo se informa
  const pedirCierre = () => {
    setAccion(null);
    setConfirmarCierre(true);
  };

  const confirmarCerrarFicha = () => {
    modificar((f) => cerrarFicha(f, usuario.id));
    setConfirmarCierre(false);
    setAviso("Ficha cerrada, correo enviado al cliente.");
  };

  const confirmarEntregarFicha = () => {
    modificar((f) => entregarFicha(f, usuario.id));
    setConfirmarEntrega(false);
    setAviso(
      "Equipo entregado. Muestra al propietario el QR de la encuesta para que confirme la recepción.",
    );
  };

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

  const abrirAccion = (tipo) => {
    setAccion(tipo);
    setConfirmarCierre(false);
    setMotivo("");
    setErrorAccion("");
  };

  const confirmarAccion = (e) => {
    e.preventDefault();
    const limpio = motivo.trim();
    if (limpio.length < 10)
      return setErrorAccion("Explica el motivo en al menos 10 caracteres.");
    modificar((f) =>
      accion === "rechazar"
        ? rechazarFicha(f, usuario.id, limpio)
        : cerrarAnticipadamente(f, usuario.id, limpio),
    );
    setAccion(null);
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
        <Alerta variante="info">Solo lectura: {textoSoloLectura}</Alerta>
      )}

      {/* Resumen siempre visible */}
      <section className="space-y-3 rounded-control border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <dl className="grid flex-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Equipo
              </dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {equipo?.numeroEquipo} · {equipo?.tipo}
                {equipo?.marca && ` · ${equipo.marca} ${equipo.modelo}`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Problema (según el propietario)
              </dt>
              <dd className="mt-0.5 text-slate-800">
                {ficha.diagnostico || "No indicado"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Servicio
              </dt>
              <dd className="mt-0.5 text-slate-800">
                {ficha.servicio || "Por definir"}
              </dd>
            </div>
            {equipo?.accesorios && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Accesorios
                </dt>
                <dd className="mt-0.5 text-slate-800">{equipo.accesorios}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Técnicos
              </dt>
              <dd className="mt-0.5 text-slate-800">
                {ficha.tecnicosIds.length > 0
                  ? ficha.tecnicosIds.map(nombreUsuario).join(" y ")
                  : "Sin asignar"}
              </dd>
            </div>
          </dl>

          <div className="shrink-0 space-y-1.5">
            <span className="block text-sm font-semibold text-slate-900">
              Estado
            </span>
            <Insignia estado={ficha.estado} />
          </div>
        </div>

        {bloqueado && (
          <Alerta variante="aviso">
            Guarda los datos técnicos para pasar la ficha a En reparación.
          </Alerta>
        )}
      </section>

      {propietario && puedeVerContacto(usuario, ficha) && (
        <section className="space-y-2 rounded-control border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 font-semibold text-slate-900">
            <IconoTelefono className="h-4 w-4 text-slate-500" />
            Contacto del propietario
          </h3>
          <p className="text-slate-800">
            {nombreCompleto(propietario)} ·{" "}
            <a
              className="font-semibold text-inacap underline underline-offset-4 hover:text-inacap-oscuro"
              href={`tel:+56${propietario.telefono}`}
            >
              {mostrarTelefono(propietario.telefono)}
            </a>
          </p>
          {ficha.estado === ESTADO_LISTO && (
            <Alerta variante="exito">
              Ficha cerrada: se envió un correo al propietario para que retire
              su equipo.
            </Alerta>
          )}
          {ficha.estado === ESTADO_CIERRE_ANTICIPADO && (
            <Alerta variante="aviso">
              Esta ficha se cerró anticipadamente. Avisa al propietario para que
              retire su equipo.
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

              <Campo
                etiqueta="Accesorios que deja el propietario"
                value={datosForm.accesorios}
                onChange={cambiarDato("accesorios")}
                maxLength={120}
                placeholder="Ej. cargador, mouse"
                ayuda="Opcional. Registra cargador, mouse, maletín u otros accesorios."
                autoComplete="off"
              />

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
                      onChange={(e) => setConfirmarReingreso(e.target.checked)}
                    />
                    <span>
                      Confirmo que es el mismo equipo y que revisé el historial
                      anterior.
                    </span>
                  </label>
                </div>
              )}

              <Campo
                as="select"
                etiqueta="Servicio (checklist)"
                value={datosForm.plantillaId}
                onChange={cambiarDato("plantillaId")}
                disabled={checklistFijo}
                ayuda={
                  checklistFijo
                    ? "El checklist ya tiene ítems revisados, por eso no se puede cambiar."
                    : ficha.plantillaId
                      ? "Puedes cambiarlo mientras no revises ningún ítem del checklist."
                      : "El propietario no eligió servicio. Elige el checklist que corresponde a este equipo."
                }
              >
                <option value="">Selecciona...</option>
                {ficha.plantillaId &&
                  !plantillas.some((p) => p.id === ficha.plantillaId) && (
                    <option value={ficha.plantillaId}>{ficha.servicio}</option>
                  )}
                {plantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {!esPlantillaDeServicio(p.id) && " (checklist adicional)"}
                  </option>
                ))}
              </Campo>

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

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Boton type="submit" bloque className="sm:w-auto">
                  Guardar datos técnicos
                </Boton>
              </div>
            </form>
          ) : (
            <dl className="grid gap-3 rounded-control border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Marca y modelo
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {equipo?.marca
                    ? `${equipo.marca} ${equipo.modelo}`
                    : "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Número de serie
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {equipo?.numeroSerie || "Pendiente"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Servicio
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {ficha.servicio || "Por definir"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Accesorios
                </dt>
                <dd className="mt-0.5 text-slate-800">
                  {equipo?.accesorios || "Ninguno registrado"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trabajo a realizar
                </dt>
                <dd className="mt-0.5 text-slate-800">
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
                  className="rounded-control border border-slate-200 bg-white p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-slate-800">
                      {i.texto}
                      {valorActual === null && (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          Pendiente
                        </span>
                      )}
                    </p>
                    <div
                      role="group"
                      aria-label={`Resultado: ${i.texto}`}
                      className="grid grid-cols-3 gap-1.5 sm:w-auto"
                    >
                      {OPCIONES_CHECKLIST.map(
                        ({ clave, texto, Icono, activo }) => {
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
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {createElement(Icono, {
                                className: "h-4 w-4 shrink-0",
                              })}
                              <span className="text-center">{texto}</span>
                            </button>
                          );
                        },
                      )}
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
                className="rounded-control border border-slate-200 bg-white p-3"
              >
                <p className="text-slate-800">{o.texto}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {nombreUsuario(o.autorId)} ·{" "}
                  {new Date(o.fecha).toLocaleString("es-CL")}
                </p>
              </li>
            ))}
            {ficha.observaciones.length === 0 && (
              <li className="text-slate-600">Sin observaciones.</li>
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
              <div className="flex justify-end">
                <Boton type="submit" bloque className="sm:w-auto">
                  Agregar observación
                </Boton>
              </div>
            </form>
          )}
        </section>
      )}

      {/* Cerrar la ficha: el trabajo terminó y el equipo queda Listo.
          Solo aparece con los datos técnicos guardados y el checklist completo */}
      {puedeRechazarOCerrar(usuario, ficha) &&
        datosCompletos &&
        checklistCompleto && (
        <section className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="font-semibold text-slate-900">
            ¿Terminaste el trabajo?
          </h3>
          {!confirmarCierre ? (
            <Boton onClick={pedirCierre} bloque className="sm:w-auto">
              Cerrar ficha
            </Boton>
          ) : (
            <Alerta
              variante="aviso"
              role="alert"
              titulo="Cerrar ficha"
              acciones={
                <>
                  <Boton tamano="sm" onClick={confirmarCerrarFicha}>
                    Sí, cerrar ficha
                  </Boton>
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setConfirmarCierre(false)}
                  >
                    Cancelar
                  </Boton>
                </>
              }
            >
              La ficha quedará en estado Listo y en solo lectura, y se enviará
              un correo al propietario para que retire su equipo.
            </Alerta>
          )}
        </section>
      )}

      {/* Entregar: el propietario retiró el equipo */}
      {puedeEntregarFicha(usuario, ficha) && (
        <section className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="font-semibold text-slate-900">
            ¿El propietario retiró su equipo?
          </h3>
          {!confirmarEntrega ? (
            <Boton
              onClick={() => setConfirmarEntrega(true)}
              bloque
              className="sm:w-auto"
            >
              Marcar como entregado
            </Boton>
          ) : (
            <Alerta
              variante="aviso"
              role="alert"
              titulo="Marcar como entregado"
              acciones={
                <>
                  <Boton tamano="sm" onClick={confirmarEntregarFicha}>
                    Sí, marcar como entregado
                  </Boton>
                  <Boton
                    variante="secundario"
                    tamano="sm"
                    onClick={() => setConfirmarEntrega(false)}
                  >
                    Cancelar
                  </Boton>
                </>
              }
            >
              La ficha quedará en estado Entregado y la atención terminará. Ya
              no podrás ver el contacto del propietario.
            </Alerta>
          )}
        </section>
      )}

      {/* Encuesta de satisfacción: constancia de recepción del propietario */}
      {ficha.estado === ESTADO_ENTREGADO && ficha.tokenEncuesta && (
        <EncuestaFicha ficha={ficha} />
      )}

      {/* Rechazar o cerrar anticipadamente */}
      {puedeRechazarOCerrar(usuario, ficha) && (
        <section className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="font-semibold text-slate-900">
            ¿No puedes continuar con este equipo?
          </h3>

          {!accion ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Boton
                variante="secundario"
                onClick={() => abrirAccion("rechazar")}
              >
                Rechazar ficha
              </Boton>
              <Boton
                variante="secundario"
                onClick={() => abrirAccion("cerrar")}
              >
                Cerrar anticipadamente
              </Boton>
            </div>
          ) : (
            <form
              onSubmit={confirmarAccion}
              className="space-y-3 rounded-control border border-amber-300 bg-amber-50 p-4"
            >
              <p className="text-amber-900">
                {accion === "rechazar"
                  ? "Rechazar devuelve la ficha: sales de la pareja y Servicio al cliente la reasigna a otros técnicos."
                  : "El cierre anticipado deja de trabajar en el equipo. La ficha queda en solo lectura hasta que se avise al propietario y se entregue."}
              </p>
              <Campo
                as="textarea"
                etiqueta="Motivo (obligatorio)"
                rows={3}
                maxLength={300}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder={
                  accion === "rechazar"
                    ? "Ej. No tengo experiencia con esta falla de placa madre."
                    : "Ej. El equipo no tiene reparación; la placa está dañada."
                }
                autoComplete="off"
              />
              {errorAccion && (
                <Alerta variante="error" role="alert">
                  {errorAccion}
                </Alerta>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Boton type="submit" variante="peligro">
                  {accion === "rechazar"
                    ? "Confirmar rechazo"
                    : "Confirmar cierre anticipado"}
                </Boton>
                <Boton variante="secundario" onClick={() => setAccion(null)}>
                  Cancelar
                </Boton>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
