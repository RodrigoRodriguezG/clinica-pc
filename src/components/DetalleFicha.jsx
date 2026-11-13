import { useState } from "react";
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

// ok: true = correcto, false = con falla, null = sin revisar
const VALOR = { pendiente: null, ok: true, falla: false };
const CLAVE = (v) => (v === true ? "ok" : v === false ? "falla" : "pendiente");
const ESTILO_INPUT = "border rounded px-3 py-2 w-full bg-white";

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
  const [datosForm, setDatosForm] = useState({
    marca: equipo?.marca ?? "",
    modelo: equipo?.modelo ?? "",
    numeroSerie: equipo?.numeroSerie ?? "",
    diagnostico: ficha.diagnostico ?? "",
    trabajo: ficha.trabajo ?? "",
  });

  const revisados = ficha.checklist.filter((i) => i.ok !== null).length;

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

  const cambiarDato = (campo) => (e) =>
    setDatosForm({ ...datosForm, [campo]: e.target.value });

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
    if (
      datos.equipos.some(
        (x) =>
          x.id !== equipo.id &&
          normalizar(x.numeroSerie) === normalizar(numeroSerie),
      )
    )
      return setErrorDatos(
        "Ese número de serie ya está registrado en otro equipo.",
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
    ["datos", "Datos técnicos"],
    ["checklist", `Checklist (${revisados}/${ficha.checklist.length})`],
    ["observaciones", `Observaciones (${ficha.observaciones.length})`],
  ];

  return (
    <div className="mt-3 border-t pt-4 space-y-4 text-sm">
      {!editable && (
        <p className="bg-neutral-100 rounded p-2">
          Solo lectura:{" "}
          {ficha.tecnicosIds.includes(usuario.id)
            ? "la ficha ya está cerrada."
            : "no estás asignado a esta ficha."}
        </p>
      )}

      {/* Resumen siempre visible */}
      <section className="space-y-1">
        <p>
          <span className="text-neutral-600">Equipo:</span>{" "}
          {equipo?.numeroEquipo} · {equipo?.tipo}
          {equipo?.marca && ` · ${equipo.marca} ${equipo.modelo}`}
        </p>
        {equipo?.accesorios && (
          <p>
            <span className="text-neutral-600">Accesorios:</span>{" "}
            {equipo.accesorios}
          </p>
        )}
        <p>
          <span className="text-neutral-600">Técnicos:</span>{" "}
          {ficha.tecnicosIds.map(nombreUsuario).join(" y ")}
        </p>
        <label className="block">
          <span className="text-neutral-600">Estado: </span>
          {editable ? (
            <select
              className="border rounded px-2 py-1 disabled:opacity-50"
              value={ficha.estado}
              disabled={!datosCompletos}
              onChange={(e) => cambiarEstado(e.target.value)}
            >
              {ESTADOS_TECNICO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span>{ficha.estado}</span>
          )}
        </label>
        {bloqueado && (
          <p className="text-neutral-600">
            Registra los datos técnicos para poder cambiar el estado.
          </p>
        )}
      </section>

      {propietario && puedeVerContacto(usuario, ficha) && (
        <section className="border rounded-lg p-3 bg-neutral-50">
          <h3 className="font-semibold">Contacto del propietario</h3>
          <p>
            {nombreCompleto(propietario)} ·{" "}
            <a className="underline" href={`tel:+56${propietario.telefono}`}>
              {mostrarTelefono(propietario.telefono)}
            </a>
          </p>
          {ficha.estado === "Listo" && (
            <p className="mt-1 text-neutral-600">
              El equipo está listo: avisa al propietario.
            </p>
          )}
        </section>
      )}

      {anterior && (
        <div>
          <button
            onClick={() => setVerAnterior(!verAnterior)}
            className="underline"
          >
            {verAnterior
              ? "Ocultar atención anterior"
              : "Ver atención anterior de este equipo"}
          </button>
          {verAnterior && (
            <AtencionAnterior
              ficha={anterior}
              onCerrar={() => setVerAnterior(false)}
            />
          )}
        </div>
      )}

      {aviso && (
        <p role="status" className="text-green-800">
          {aviso}
        </p>
      )}

      {/* Pestañas */}
      <div role="tablist" className="flex gap-1 border-b">
        {PESTANAS.map(([id, etiqueta]) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            disabled={bloqueado && id !== "datos"}
            onClick={() => irA(id)}
            className={`px-3 py-2 -mb-px border-b-2 disabled:opacity-40 ${
              pestana === id
                ? "border-[#EE0000] font-semibold"
                : "border-transparent"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {pestana === "datos" && (
        <section role="tabpanel" className="space-y-3">
          {editable ? (
            <form onSubmit={guardarDatos} className="space-y-3">
              {!datosCompletos && (
                <p className="bg-amber-50 border border-amber-300 rounded p-2">
                  Completa estos datos para habilitar el checklist y las
                  observaciones.
                </p>
              )}
              <div className="grid sm:grid-cols-3 gap-3">
                <label>
                  Marca
                  <input
                    className={ESTILO_INPUT}
                    value={datosForm.marca}
                    onChange={cambiarDato("marca")}
                    maxLength={40}
                  />
                </label>
                <label>
                  Modelo
                  <input
                    className={ESTILO_INPUT}
                    value={datosForm.modelo}
                    onChange={cambiarDato("modelo")}
                    maxLength={60}
                  />
                </label>
                <label>
                  Número de serie
                  <input
                    className={ESTILO_INPUT}
                    value={datosForm.numeroSerie}
                    onChange={cambiarDato("numeroSerie")}
                    maxLength={40}
                  />
                </label>
              </div>
              <label className="block">
                Diagnóstico
                <textarea
                  className={ESTILO_INPUT}
                  rows={2}
                  value={datosForm.diagnostico}
                  onChange={cambiarDato("diagnostico")}
                  maxLength={500}
                />
              </label>
              <label className="block">
                Trabajo a realizar
                <textarea
                  className={ESTILO_INPUT}
                  rows={2}
                  value={datosForm.trabajo}
                  onChange={cambiarDato("trabajo")}
                  maxLength={500}
                />
              </label>
              {errorDatos && (
                <p role="alert" className="text-red-700">
                  {errorDatos}
                </p>
              )}
              <button className="bg-[#EE0000] text-white rounded px-3 py-2">
                Guardar datos técnicos
              </button>
            </form>
          ) : (
            <div className="space-y-1">
              <p>
                <span className="text-neutral-600">Marca y modelo:</span>{" "}
                {equipo?.marca
                  ? `${equipo.marca} ${equipo.modelo}`
                  : "Pendiente"}
              </p>
              <p>
                <span className="text-neutral-600">Número de serie:</span>{" "}
                {equipo?.numeroSerie || "Pendiente"}
              </p>
              <p>
                <span className="text-neutral-600">Diagnóstico:</span>{" "}
                {ficha.diagnostico || "Pendiente"}
              </p>
              <p>
                <span className="text-neutral-600">Trabajo a realizar:</span>{" "}
                {ficha.trabajo || "Pendiente"}
              </p>
            </div>
          )}
        </section>
      )}

      {pestana === "checklist" && (
        <section role="tabpanel" className="space-y-2">
          <ul className="space-y-1">
            {ficha.checklist.map((i) => (
              <li
                key={i.itemId}
                className="flex flex-wrap justify-between gap-2"
              >
                <span>{i.texto}</span>
                <select
                  className="border rounded px-2 py-1"
                  value={CLAVE(i.ok)}
                  disabled={!editable}
                  onChange={(e) => cambiarItem(i.itemId, e.target.value)}
                  aria-label={`Resultado: ${i.texto}`}
                >
                  <option value="pendiente">Sin revisar</option>
                  <option value="ok">Correcto</option>
                  <option value="falla">Con falla</option>
                </select>
              </li>
            ))}
            {ficha.checklist.length === 0 && (
              <li className="text-neutral-600">
                Esta ficha no tiene ítems de checklist.
              </li>
            )}
          </ul>
        </section>
      )}

      {pestana === "observaciones" && (
        <section role="tabpanel" className="space-y-2">
          <ul className="space-y-1">
            {ficha.observaciones.map((o) => (
              <li key={o.id}>
                {o.texto}{" "}
                <span className="text-neutral-600">
                  ({nombreUsuario(o.autorId)},{" "}
                  {new Date(o.fecha).toLocaleString("es-CL")})
                </span>
              </li>
            ))}
            {ficha.observaciones.length === 0 && (
              <li className="text-neutral-600">Sin observaciones.</li>
            )}
          </ul>
          {editable && (
            <form onSubmit={agregarObservacion} className="flex gap-2">
              <textarea
                className="flex-1 border rounded px-3 py-2"
                rows={2}
                maxLength={500}
                placeholder="Escribe una observación"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-label="Nueva observación"
              />
              <button className="bg-[#EE0000] text-white rounded px-3 self-start py-2">
                Agregar
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
