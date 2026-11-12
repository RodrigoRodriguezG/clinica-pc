import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store.jsx";
import { validarRut, formatearRut } from "../lib/rut.js";
import { normalizar, normalizarTelefono } from "../lib/texto.js";

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

const EQUIPO_VACIO = { tipo: "" };

const ESTILO_INPUT =
  "border rounded-lg px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#EE0000]/30 focus:border-[#EE0000]";

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
    <label className="flex flex-col gap-1 text-sm">
      <span>Comuna</span>
      <div ref={contenedor} className="relative" onBlur={alSalir}>
        <input
          className={`${ESTILO_INPUT} ${error ? "border-red-600" : ""}`}
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
          autoComplete="off"
          required
        />

        {abierto && (
          <ul
            id="lista-comunas"
            role="listbox"
            className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto border rounded-lg bg-white shadow-lg"
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
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 ${
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
    </label>
  );
}

export default function FormInscripcion() {
  const { datos, actualizar, usuario } = useApp();
  const navegar = useNavigate();

  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [equipo, setEquipo] = useState(EQUIPO_VACIO);
  const [equipos, setEquipos] = useState([]);
  const [error, setError] = useState("");
  const [errorEquipo, setErrorEquipo] = useState("");
  const [inscrito, setInscrito] = useState(null);

  // Si hay sesión, es un registro presencial; si no, vino por el QR
  const origen = usuario ? "presencial" : "QR";

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

    setErrorEquipo("");
    setEquipos((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: equipo.tipo,
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
    if (!form.aceptaTerminos)
      return setError("Debes aceptar los términos y condiciones.");
    if ((datos.propietarios ?? []).some((p) => p.rut === rut))
      return setError("Ese RUT ya está inscrito.");

    setError("");
    const ahora = new Date().toISOString();

    const propietario = {
      id: crypto.randomUUID(),
      rut,
      nombre,
      apellidoPaterno,
      apellidoMaterno,
      correo,
      telefono,
      comuna: form.comuna,
      aceptaTerminos: true,
      fechaAceptacion: ahora,
      origen,
      creadoEn: ahora,
    };

    // Los datos técnicos (marca, modelo, serie, accesorios y servicio)
    // se completan después en recepción
    const nuevosEquipos = equipos.map((e) => ({
      id: e.id,
      propietarioId: propietario.id,
      tipo: e.tipo,
      marca: "",
      modelo: "",
      numeroSerie: "",
      numeroEquipo: e.numeroEquipo,
      accesorios: "",
      servicio: "",
      creadoEn: ahora,
    }));

    actualizar((d) => ({
      ...d,
      propietarios: [...(d.propietarios ?? []), propietario],
      equipos: [...(d.equipos ?? []), ...nuevosEquipos],
    }));

    const registrado = { propietario, equipos: nuevosEquipos };
    setForm(FORMULARIO_VACIO);
    setEquipo(EQUIPO_VACIO);
    setEquipos([]);
    setInscrito(registrado);
  };

  if (inscrito) {
    return (
      <div className="mx-auto w-full max-w-xl py-6">
        <div className="border border-neutral-200 rounded-xl bg-white shadow-sm p-6 space-y-5">
          <header className="text-center space-y-1">
            <h1 className="text-2xl font-semibold">Inscripción registrada</h1>
            <p className="text-sm text-neutral-600">
              Gracias, {inscrito.propietario.nombre}{" "}
              {inscrito.propietario.apellidoPaterno}.
            </p>
          </header>

          <div className="text-sm bg-neutral-50 border rounded-lg p-4 space-y-1">
            <p>
              <span className="text-neutral-600">RUT:</span>{" "}
              {inscrito.propietario.rut}
            </p>
            <p>
              <span className="text-neutral-600">Comuna:</span>{" "}
              {inscrito.propietario.comuna}
            </p>
            <p>
              <span className="text-neutral-600">Origen:</span>{" "}
              {inscrito.propietario.origen}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">Equipos registrados</h2>
            <ul className="space-y-2">
              {inscrito.equipos.map((e) => (
                <li key={e.id} className="border rounded-lg p-3 text-sm">
                  <p className="font-semibold">
                    {e.numeroEquipo} · {e.tipo}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-neutral-600">
            Guarda este comprobante. Cuando llegues con tu equipo, servicio al
            cliente usará tu RUT para continuar.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInscrito(null)}
              className="bg-[#EE0000] text-white rounded-lg py-2 px-4 hover:bg-[#c90000]"
            >
              Inscribir a otra persona
            </button>
            {usuario && (
              <button
                type="button"
                onClick={() => navegar("/")}
                className="border rounded-lg py-2 px-4 hover:bg-neutral-50"
              >
                Volver al panel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl py-6">
      <div className="border border-neutral-200 rounded-xl bg-white shadow-sm p-6 sm:p-8 space-y-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">
            Inscripción a la Clínica del PC
          </h1>
          <p className="text-sm text-neutral-600">
            Completa tus datos y registra los PC que traerás.
            {usuario
              ? " Registro presencial."
              : " Luego servicio al cliente continuará con la recepción."}
          </p>
        </header>

        <form onSubmit={inscribir} className="space-y-6">
          {/* Datos del propietario */}
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>RUT</span>
              <input
                className={ESTILO_INPUT}
                placeholder="12.345.678-9"
                value={form.rut}
                onChange={cambiar("rut")}
                onBlur={() =>
                  setForm((prev) => ({ ...prev, rut: formatearRut(prev.rut) }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Nombre</span>
              <input
                className={ESTILO_INPUT}
                placeholder="Nombre"
                value={form.nombre}
                onChange={cambiar("nombre")}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Apellido paterno</span>
              <input
                className={ESTILO_INPUT}
                placeholder="Apellido paterno"
                value={form.apellidoPaterno}
                onChange={cambiar("apellidoPaterno")}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Apellido materno</span>
              <input
                className={ESTILO_INPUT}
                placeholder="Apellido materno"
                value={form.apellidoMaterno}
                onChange={cambiar("apellidoMaterno")}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Correo</span>
              <input
                type="email"
                className={ESTILO_INPUT}
                placeholder="correo@ejemplo.cl"
                value={form.correo}
                onChange={cambiar("correo")}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span>Teléfono</span>
              <input
                type="tel"
                className={ESTILO_INPUT}
                placeholder="+56 9 1234 5678"
                value={form.telefono}
                onChange={cambiar("telefono")}
                required
              />
            </label>

            <div className="sm:col-span-2">
              <SelectorComuna
                valor={form.comuna}
                onChange={(comuna) => setForm((prev) => ({ ...prev, comuna }))}
                error={Boolean(error) && !COMUNAS_BIOBIO.includes(form.comuna)}
              />
            </div>
          </div>

          {/* Equipos */}
          <section className="space-y-3 border-t pt-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Equipos</h2>
                <p className="text-xs text-neutral-600">
                  Solo se reciben computadores: notebook, AIO o escritorio.
                </p>
              </div>
              <span className="text-sm text-neutral-600">
                {equipos.length === 0
                  ? "Sin PC agregados"
                  : `${equipos.length} PC agregado(s)`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
              <label className="flex flex-col gap-1 text-sm flex-1">
                <span>Tipo de PC</span>
                <select
                  className={ESTILO_INPUT}
                  value={equipo.tipo}
                  onChange={(e) => setEquipo({ tipo: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  {TIPOS_EQUIPO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={agregarEquipo}
                className="border rounded-lg py-2 px-4 hover:bg-neutral-50"
              >
                Agregar equipo
              </button>
            </div>

            {errorEquipo && (
              <p role="alert" className="text-sm text-red-700">
                {errorEquipo}
              </p>
            )}

            {equipos.length > 0 && (
              <ul className="space-y-2">
                {equipos.map((e) => (
                  <li
                    key={e.id}
                    className="border rounded-lg p-3 flex justify-between items-center gap-3 bg-neutral-50"
                  >
                    <p className="text-sm">
                      <span className="font-semibold">{e.numeroEquipo}</span> ·{" "}
                      {e.tipo}
                    </p>
                    <button
                      type="button"
                      onClick={() => quitarEquipo(e.id)}
                      className="text-sm underline"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Términos y condiciones */}
          <label className="flex items-start gap-2 text-sm border-t pt-5">
            <input
              type="checkbox"
              className="mt-1"
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

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="bg-[#EE0000] text-white rounded-lg py-2 px-5 hover:bg-[#c90000]">
              Inscribirme
            </button>
            {usuario && (
              <button
                type="button"
                onClick={() => navegar("/")}
                className="border rounded-lg py-2 px-5 hover:bg-neutral-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
