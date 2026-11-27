import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../store.jsx";
import { SERVICIOS } from "../constantes.js";
import { validarRut, formatearRut, mismoRut } from "../lib/rut.js";
import { normalizar, normalizarTelefono } from "../lib/texto.js";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import MarcoPublico from "../components/MarcoPublico.jsx";
import { siglaASede } from "../lib/sedes.js";
import {
  IconoCheckCircle,
  IconoDocumento,
  IconoMas,
  IconoMonitor,
  IconoUsuarios,
} from "../components/ui/iconos.jsx";

// Comunas de la Región del Biobío (33)
const COMUNAS_BIOBIO = [
  "Alto Biobío",
  "Antuco",
  "Arauco",
  "Cabrero",
  "Cañete",
  "Chiguayante",
  "Concepción",
  "Contulmo",
  "Coronel",
  "Curanilahue",
  "Florida",
  "Hualpén",
  "Hualqui",
  "Laja",
  "Lebu",
  "Los Álamos",
  "Los Ángeles",
  "Lota",
  "Mulchén",
  "Nacimiento",
  "Negrete",
  "Penco",
  "Quilaco",
  "Quilleco",
  "San Pedro de la Paz",
  "San Rosendo",
  "Santa Bárbara",
  "Santa Juana",
  "Talcahuano",
  "Tirúa",
  "Tomé",
  "Tucapel",
  "Yumbel",
];

// Solo se reciben computadores en la Clínica
const TIPOS_EQUIPO = ["Notebook", "All-in-One (AIO)", "PC de escritorio"];

const FORMULARIO_VACIO = {
  rut: "",
  nombre: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  correo: "",
  telefono: "",
  comuna: "",
  aceptaTerminos: false,
};

// Datos personales que se autocompletan si el RUT ya estaba inscrito
const DATOS_PERSONALES = [
  "nombre",
  "apellidoPaterno",
  "apellidoMaterno",
  "correo",
  "telefono",
  "comuna",
];

// servicio "" = Otro: el técnico elige el checklist al revisar el equipo
const EQUIPO_VACIO = { tipo: "", servicio: "", problema: "" };

const ESTILO_INPUT =
  "block w-full min-h-11 rounded-control border border-neutral-300 bg-white px-3 py-2.5 text-base text-tinta placeholder:text-neutral-400 transition-[border-color,box-shadow,background-color] duration-150 hover:border-neutral-400 focus:border-inacap focus:outline-none focus:ring-4 focus:ring-inacap/15";

// Selector con escritura para filtrar la lista de comunas
function SelectorComuna({ valor, onChange, error }) {
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(-1);
  const contenedor = useRef(null);

  const filtradas = useMemo(() => {
    const busqueda = normalizar(valor.trim());
    if (!busqueda) return COMUNAS_BIOBIO;
    return COMUNAS_BIOBIO.filter((c) => normalizar(c).includes(busqueda));
  }, [valor]);

  const seleccionar = (comuna) => {
    onChange(comuna);
    setAbierto(false);
    setIndice(-1);
  };

  const alTeclear = (e) => {
    onChange(e.target.value);
    setAbierto(true);
    setIndice(-1);
  };

  const alPresionarTecla = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setIndice((i) => Math.min(i + 1, filtradas.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (abierto && filtradas.length > 0) {
        e.preventDefault();
        seleccionar(filtradas[indice >= 0 ? indice : 0]);
      }
    } else if (e.key === "Escape") {
      setAbierto(false);
      setIndice(-1);
    }
  };

  // Cierra la lista al salir del componente (y no al hacer clic en una opción)
  const alSalir = (e) => {
    if (!contenedor.current?.contains(e.relatedTarget)) {
      setAbierto(false);
      setIndice(-1);
    }
  };

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-tinta">
        Comuna
        <span aria-hidden="true" className="ml-0.5 text-inacap">
          *
        </span>
        <span className="sr-only"> (obligatorio)</span>
      </span>
      <div ref={contenedor} className="relative" onBlur={alSalir}>
        <input
          className={`${ESTILO_INPUT} ${
            error
              ? "border-error hover:border-error focus:border-error focus:ring-error/15"
              : ""
          }`}
          placeholder="Escribe para filtrar (ej. Concepción)"
          value={valor}
          onChange={alTeclear}
          onFocus={() => setAbierto(true)}
          onKeyDown={alPresionarTecla}
          role="combobox"
          aria-expanded={abierto}
          aria-controls="lista-comunas"
          aria-autocomplete="list"
          aria-label="Comuna"
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          required
        />

        {abierto && (
          <ul
            id="lista-comunas"
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-control border border-neutral-200 bg-white py-1 shadow-elevada"
          >
            {filtradas.length === 0 && (
              <li className="px-3 py-2 text-sm text-neutral-600">
                No hay comunas que coincidan.
              </li>
            )}
            {filtradas.map((comuna, i) => (
              <li key={comuna} role="option" aria-selected={valor === comuna}>
                <button
                  type="button"
                  onClick={() => seleccionar(comuna)}
                  className={`block min-h-11 w-full px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-neutral-100 ${
                    i === indice ? "bg-neutral-100" : ""
                  }`}
                >
                  {comuna}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <span className="text-sm font-medium text-error">
          Selecciona una comuna de la lista.
        </span>
      )}
    </label>
  );
}

// Dentro del panel el formulario va junto a la barra lateral, como cualquier
// sección; desde el QR (sin sesión) se muestra en su propia página con la marca
function MarcoInscripcion({ enPanel, children }) {
  if (enPanel)
    return <div className="mx-auto w-full max-w-3xl">{children}</div>;

  return <MarcoPublico subtitulo="Inscripción en línea">{children}</MarcoPublico>;
}

export default function FormInscripcion({ enPanel = false }) {
  const { datos, actualizar, usuario } = useApp();
  const navegar = useNavigate();
  const { search } = useLocation();
  // Toda inscripción pertenece a una sede: en el panel es la de quien
  // inscribe; desde el QR viene en el enlace (#/inscripcion?sede=LA)
  const sede = enPanel
    ? usuario?.sede || null
    : siglaASede(new URLSearchParams(search).get("sede"));

  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [equipo, setEquipo] = useState(EQUIPO_VACIO);
  const [equipos, setEquipos] = useState([]);
  const [error, setError] = useState("");
  const [errorEquipo, setErrorEquipo] = useState("");
  const [inscrito, setInscrito] = useState(null);
  // Propietario ya inscrito cuyos datos se autocompletaron
  const [existenteId, setExistenteId] = useState(null);

  const buscarPropietario = (rut) =>
    validarRut(rut)
      ? ((datos.propietarios ?? []).find((p) => mismoRut(p.rut, rut)) ?? null)
      : null;

  // Al escribir el RUT: si ya está inscrito se rellenan sus datos (editables).
  // Si el RUT cambia a otro, se quitan los datos rellenados de la persona anterior
  const cambiarRut = (e) => {
    const rut = e.target.value;
    const encontrado = buscarPropietario(rut);
    if (encontrado) {
      if (encontrado.id === existenteId) {
        setForm((prev) => ({ ...prev, rut }));
        return;
      }
      setExistenteId(encontrado.id);
      setForm((prev) => ({
        ...prev,
        rut,
        ...Object.fromEntries(
          DATOS_PERSONALES.map((c) => [c, encontrado[c] ?? ""]),
        ),
      }));
    } else if (existenteId) {
      setExistenteId(null);
      setForm((prev) => ({
        ...prev,
        rut,
        ...Object.fromEntries(DATOS_PERSONALES.map((c) => [c, ""])),
      }));
    } else {
      setForm((prev) => ({ ...prev, rut }));
    }
  };

  // Si hay sesión, es un registro presencial; si no, vino por el QR
  const origen = usuario ? "presencial" : "QR";
  // En el registro presencial el propietario acepta los términos por correo
  const esPresencial = Boolean(usuario);

  const cambiar = (campo) => (e) => {
    const valor =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Genera el siguiente número de equipo considerando los guardados y los de esta inscripción
  const siguienteNumeroEquipo = () => {
    const ocupados = [...(datos.equipos ?? []), ...equipos]
      .map((e) => Number(String(e.numeroEquipo ?? "").replace(/\D/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    const siguiente = (ocupados.length ? Math.max(...ocupados) : 0) + 1;
    return `EQ-${String(siguiente).padStart(3, "0")}`;
  };

  const agregarEquipo = () => {
    if (!equipo.tipo)
      return setErrorEquipo("Selecciona el tipo de PC antes de agregarlo.");
    const problema = equipo.problema.trim();
    if (!problema)
      return setErrorEquipo("Cuéntanos qué problema tiene el PC.");

    setErrorEquipo("");
    setEquipos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: equipo.tipo,
        servicio: equipo.servicio,
        problema,
        numeroEquipo: siguienteNumeroEquipo(),
      },
    ]);
    setEquipo(EQUIPO_VACIO);
  };

  const quitarEquipo = (id) =>
    setEquipos((prev) => prev.filter((e) => e.id !== id));

  const inscribir = (e) => {
    e.preventDefault();
    const rut = formatearRut(form.rut);
    const correo = form.correo.trim().toLowerCase();
    const telefono = normalizarTelefono(form.telefono);
    const nombre = form.nombre.trim();
    const apellidoPaterno = form.apellidoPaterno.trim();
    const apellidoMaterno = form.apellidoMaterno.trim();

    if (!nombre || !apellidoPaterno || !apellidoMaterno)
      return setError("Completa nombre y apellidos.");
    if (!validarRut(form.rut))
      return setError("Ingresa un RUT válido (ej. 12.345.678-9).");
    if (!COMUNAS_BIOBIO.includes(form.comuna))
      return setError("Selecciona una comuna de la lista.");
    if (!/^\d{8,9}$/.test(telefono))
      return setError("El teléfono debe tener 8 o 9 dígitos.");
    if (equipos.length === 0)
      return setError("Agrega al menos un PC antes de inscribir.");
    if (!esPresencial && !form.aceptaTerminos)
      return setError("Debes aceptar los términos y condiciones.");
    setError("");
    const ahora = new Date().toISOString();
    const personales = {
      rut,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      telefono,
      comuna: form.comuna,
    };

    // Si el RUT ya estaba inscrito se actualizan sus datos y se le suman los PC
    const existente = buscarPropietario(form.rut);
    // Presencial sin términos aceptados: se envía el correo para aceptarlos (simulado)
    const enviaCorreo = esPresencial && !existente?.aceptaTerminos;

    const propietario = existente
      ? {
          ...existente,
          ...personales,
          ...(!esPresencial && { aceptaTerminos: true, fechaAceptacion: ahora }),
          ...(enviaCorreo && { correoTerminosEnviadoEn: ahora }),
        }
      : {
          id: crypto.randomUUID(),
          ...personales,
          // Presencial: queda pendiente hasta que acepte desde el correo (simulado)
          aceptaTerminos: !esPresencial,
          fechaAceptacion: esPresencial ? null : ahora,
          ...(enviaCorreo && { correoTerminosEnviadoEn: ahora }),
          origen,
          creadoEn: ahora,
        };

    // El propietario indica el problema y, si lo sabe, el servicio; los datos
    // técnicos (marca, modelo, serie y accesorios) los completa el técnico
    const nuevosEquipos = equipos.map((e) => ({
      id: e.id,
      propietarioId: propietario.id,
      tipo: e.tipo,
      problema: e.problema,
      marca: "",
      modelo: "",
      numeroSerie: "",
      numeroEquipo: e.numeroEquipo,
      accesorios: "",
      servicio: e.servicio,
      // La atención queda en la sede donde se inscribió (el propietario no
      // tiene sede: puede tener equipos inscritos en ambas)
      sede,
      creadoEn: ahora,
    }));

    actualizar((d) => ({
      ...d,
      propietarios: existente
        ? (d.propietarios ?? []).map((p) =>
            p.id === propietario.id ? propietario : p,
          )
        : [...(d.propietarios ?? []), propietario],
      equipos: [...(d.equipos ?? []), ...nuevosEquipos],
    }));

    const registrado = {
      propietario,
      equipos: nuevosEquipos,
      actualizado: Boolean(existente),
      enviaCorreo,
    };
    setForm(FORMULARIO_VACIO);
    setExistenteId(null);
    setEquipo(EQUIPO_VACIO);
    setEquipos([]);
    setInscrito(registrado);
  };

  if (!sede)
    return (
      <MarcoInscripcion enPanel={enPanel}>
        <div className="mx-auto max-w-xl">
          <Alerta
            variante="aviso"
            titulo={
              enPanel
                ? "Tu cuenta no tiene una sede asignada"
                : "Enlace de inscripción no válido"
            }
          >
            {enPanel
              ? "Cada inscripción pertenece a una sede. Pídele al administrador que te asigne una antes de inscribir propietarios."
              : "Este enlace no indica la sede de la Clínica del PC. Escanea el código QR de tu sede para inscribirte."}
          </Alerta>
        </div>
      </MarcoInscripcion>
    );

  if (inscrito) {
    return (
      <MarcoInscripcion enPanel={enPanel}>
        <div className="mx-auto w-full max-w-2xl">
          <Tarjeta className="overflow-hidden">
            <div className="border-b border-green-200 bg-exito-tenue px-5 py-7 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-exito shadow-sm ring-1 ring-green-200">
                <IconoCheckCircle className="h-8 w-8" />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-tinta">
                {inscrito.actualizado
                  ? "Inscripción actualizada"
                  : "Inscripción registrada"}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Gracias, {inscrito.propietario.nombre}{" "}
                {inscrito.propietario.apellidoPaterno}.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              {inscrito.enviaCorreo && (
                <Alerta variante="info" titulo="Correo enviado" role="status">
                  Se envió un correo a{" "}
                  <strong>{inscrito.propietario.correo}</strong> para que el
                  propietario acepte los términos y condiciones.
                </Alerta>
              )}

              <Alerta variante="exito" titulo="Comprobante de inscripción">
                Tu registro quedó guardado. Guarda este comprobante para
                presentarlo cuando llegues con tu equipo.
              </Alerta>

              <dl className="grid gap-4 rounded-control bg-neutral-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">RUT</dt>
                  <dd className="mt-0.5 font-semibold text-tinta">
                    {inscrito.propietario.rut}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Comuna</dt>
                  <dd className="mt-0.5 font-semibold text-tinta">
                    {inscrito.propietario.comuna}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Origen</dt>
                  <dd className="mt-1">
                    <Insignia tono="neutral">
                      {inscrito.propietario.origen}
                    </Insignia>
                  </dd>
                </div>
              </dl>

              <section className="space-y-2">
                <h2 className="text-lg font-semibold text-tinta">
                  Equipos registrados
                </h2>
                <ul className="space-y-2">
                  {inscrito.equipos.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-control border border-neutral-200 bg-white p-3 text-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-neutral-100 text-neutral-600"
                      >
                        <IconoMonitor className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-tinta">
                          {e.numeroEquipo} · {e.tipo}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Datos técnicos por registrar por el técnico
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <p className="text-sm leading-relaxed text-neutral-600">
                Guarda este comprobante. Cuando llegues con tu equipo, servicio
                al cliente usará tu RUT para continuar.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Boton
                  onClick={() => setInscrito(null)}
                  bloque
                  className="sm:w-auto"
                >
                  Inscribir a otra persona
                </Boton>
                {enPanel && (
                  <Boton
                    variante="secundario"
                    onClick={() => navegar("/recepcion")}
                  >
                    Ir a recepción
                  </Boton>
                )}
              </div>
            </div>
          </Tarjeta>
        </div>
      </MarcoInscripcion>
    );
  }

  return (
    <MarcoInscripcion enPanel={enPanel}>
      <Tarjeta className="overflow-hidden">
        <div className="border-b border-neutral-200 bg-white p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              <IconoUsuarios className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-inacap">
                {sede}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-tinta">
                Inscripción a la Clínica del PC
              </h1>
              <p className="text-sm leading-relaxed text-neutral-600">
                Completa tus datos y registra los PC que traerás.
                {usuario
                  ? " Registro presencial."
                  : " Luego servicio al cliente continuará con la recepción."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={inscribir} className="space-y-6 p-5 sm:p-7">
          {/* Datos del propietario */}
          <section className="space-y-4" aria-labelledby="datos-propietario">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tinta text-xs font-bold text-white">
                1
              </span>
              <h2
                id="datos-propietario"
                className="text-lg font-semibold text-tinta"
              >
                Tus datos
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                etiqueta="RUT"
                placeholder="12.345.678-9"
                value={form.rut}
                onChange={cambiarRut}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, rut: formatearRut(prev.rut) }))
                }
                required
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
              />

              <Campo
                etiqueta="Nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={cambiar("nombre")}
                required
                autoComplete="given-name"
              />

              <Campo
                etiqueta="Apellido paterno"
                placeholder="Apellido paterno"
                value={form.apellidoPaterno}
                onChange={cambiar("apellidoPaterno")}
                required
                autoComplete="family-name"
              />

              <Campo
                etiqueta="Apellido materno"
                placeholder="Apellido materno"
                value={form.apellidoMaterno}
                onChange={cambiar("apellidoMaterno")}
                required
                autoComplete="family-name"
              />

              <Campo
                etiqueta="Correo"
                type="email"
                placeholder="correo@ejemplo.cl"
                value={form.correo}
                onChange={cambiar("correo")}
                required
                inputMode="email"
                autoComplete="email"
              />

              <Campo
                etiqueta="Teléfono"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={form.telefono}
                onChange={cambiar("telefono")}
                required
                inputMode="tel"
                autoComplete="tel"
                ayuda="Celular chileno de 8 o 9 dígitos."
              />

              <div className="sm:col-span-2">
                <SelectorComuna
                  valor={form.comuna}
                  onChange={(comuna) =>
                    setForm((prev) => ({ ...prev, comuna }))
                  }
                  error={Boolean(error) && !COMUNAS_BIOBIO.includes(form.comuna)}
                />
              </div>
            </div>

            {existenteId && (
              <Alerta variante="info" role="status">
                Este RUT ya tiene una inscripción previa. Completamos sus datos;
                revísalos y corrígelos si cambiaron.
              </Alerta>
            )}
          </section>

          {/* Equipos */}
          <section
            className="space-y-3 border-t border-neutral-200 pt-6"
            aria-labelledby="datos-equipos"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-tinta text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h2
                    id="datos-equipos"
                    className="text-lg font-semibold text-tinta"
                  >
                    Tus equipos
                  </h2>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Solo se reciben computadores: notebook, AIO o escritorio.
                  </p>
                </div>
              </div>
              <Insignia tono={equipos.length ? "inacap" : "neutral"}>
                {equipos.length === 0
                  ? "Sin PC agregados"
                  : `${equipos.length} PC agregado(s)`}
              </Insignia>
            </div>

            <div className="rounded-control border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Campo
                  as="select"
                  etiqueta="Tipo de PC"
                  className="flex-1"
                  value={equipo.tipo}
                  onChange={(e) =>
                    setEquipo({ ...equipo, tipo: e.target.value })
                  }
                >
                  <option value="">Selecciona...</option>
                  {TIPOS_EQUIPO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </Campo>
                <Campo
                  as="select"
                  etiqueta="Servicio"
                  className="flex-1"
                  value={equipo.servicio}
                  onChange={(e) =>
                    setEquipo({ ...equipo, servicio: e.target.value })
                  }
                >
                  {SERVICIOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="">Otro</option>
                </Campo>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 sm:text-right">
                Opcional. Si no estás seguro, elige Otro y el técnico decidirá.
              </p>
              <Campo
                as="textarea"
                etiqueta="¿Qué problema tiene?"
                className="mt-3"
                rows={2}
                maxLength={500}
                placeholder="Ej. Está muy lento y se apaga solo."
                value={equipo.problema}
                onChange={(e) =>
                  setEquipo({ ...equipo, problema: e.target.value })
                }
                autoComplete="off"
              />
              <div className="mt-3 flex justify-end">
                <Boton
                  type="button"
                  variante="secundario"
                  onClick={agregarEquipo}
                >
                  <IconoMas className="h-4 w-4" />
                  Agregar equipo
                </Boton>
              </div>

              {errorEquipo && (
                <Alerta variante="error" role="alert" className="mt-3">
                  {errorEquipo}
                </Alerta>
              )}

              {equipos.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {equipos.map((e) => (
                    <li
                      key={e.id}
                      className="flex flex-col gap-2 rounded-control border border-neutral-200 bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-neutral-100 text-neutral-600"
                        >
                          <IconoMonitor className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p>
                            <span className="font-semibold text-tinta">
                              {e.numeroEquipo}
                            </span>{" "}
                            · {e.tipo} · {e.servicio || "Otro"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {e.problema}
                          </p>
                        </div>
                      </div>
                      <Boton
                        type="button"
                        variante="peligro-enlace"
                        onClick={() => quitarEquipo(e.id)}
                      >
                        Quitar
                      </Boton>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Términos y condiciones: solo en la inscripción por QR */}
          {!esPresencial && (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-neutral-200 bg-neutral-50 p-3.5 text-sm leading-relaxed text-neutral-700 transition-colors duration-150 hover:border-neutral-300">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0"
                checked={form.aceptaTerminos}
                onChange={cambiar("aceptaTerminos")}
                required
              />
              <span>
                Acepto los términos y condiciones. Autorizo el uso de mis datos
                personales únicamente para la gestión de la Clínica del PC,
                conforme a la Ley 19.628 sobre protección de la vida privada.
              </span>
            </label>
          )}

          {error && (
            <Alerta variante="error" role="alert" titulo="Revisa el formulario">
              {error}
            </Alerta>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Boton type="submit" tamano="lg" bloque className="sm:w-auto">
              <IconoDocumento className="h-5 w-5" />
              Inscribirme
            </Boton>
            {enPanel && (
              <Boton
                variante="secundario"
                onClick={() => navegar("/recepcion")}
              >
                Cancelar
              </Boton>
            )}
          </div>
        </form>
      </Tarjeta>
    </MarcoInscripcion>
  );
}
