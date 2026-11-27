import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  LARGO_COMENTARIO,
  fichaPorToken,
  motivoEncuestaNoDisponible,
  nuevaRespuesta,
  validarRespuesta,
} from "../lib/encuestas.js";
import MarcoPublico from "../components/MarcoPublico.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import { cx } from "../components/ui/cx.js";
import { IconoCheckCircle } from "../components/ui/iconos.jsx";

const NOTAS = [
  { valor: 1, texto: "Muy mala" },
  { valor: 2, texto: "Mala" },
  { valor: 3, texto: "Regular" },
  { valor: 4, texto: "Buena" },
  { valor: 5, texto: "Muy buena" },
];

const CONFORMIDAD = [
  { valor: true, texto: "Sí, conforme" },
  { valor: false, texto: "No, tengo un reparo" },
];

const MENSAJES = {
  invalida: {
    titulo: "Encuesta no encontrada",
    texto:
      "El enlace no es válido. Pide al técnico que te muestre de nuevo el código QR de tu atención.",
  },
  "no-entregada": {
    titulo: "Tu equipo aún no se entrega",
    texto:
      "La encuesta se habilita cuando retiras tu equipo. Vuelve a escanear el código al momento de la entrega.",
  },
  respondida: {
    titulo: "Ya respondiste esta encuesta",
    texto:
      "Tu respuesta quedó registrada como constancia de recepción. ¡Gracias por participar!",
  },
};

// Opción tipo píldora sobre un radio nativo (accesible con teclado)
function Opcion({ nombre, marcada, onChange, children }) {
  return (
    <label
      className={cx(
        "flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-3 py-2 text-center text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-inacap/30",
        marcada
          ? "border-inacap bg-inacap-tenue text-inacap-oscuro"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
      )}
    >
      <input
        type="radio"
        name={nombre}
        checked={marcada}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

export default function Encuesta({ token }) {
  const { datos, actualizar } = useApp();
  const ficha = fichaPorToken(datos, token);
  const motivo = motivoEncuestaNoDisponible(datos, ficha);

  const [form, setForm] = useState({
    nota: null,
    conforme: null,
    comentario: "",
    recibido: false,
  });
  const [error, setError] = useState("");
  const [enviada, setEnviada] = useState(false);

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError("");
  };

  const enviar = (e) => {
    e.preventDefault();
    const mensaje = validarRespuesta(form);
    if (mensaje) return setError(mensaje);
    setError("");
    actualizar((d) => ({
      ...d,
      retros: [...(d.retros ?? []), nuevaRespuesta(ficha.id, form)],
    }));
    setEnviada(true);
  };

  if (enviada)
    return (
      <MarcoPublico subtitulo="Encuesta de satisfacción">
        <Tarjeta acento className="mx-auto max-w-xl p-6 text-center sm:p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-exito-tenue text-exito">
            <IconoCheckCircle className="h-8 w-8" />
          </span>
          <h1 className="text-xl font-bold text-tinta">¡Gracias por responder!</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Tu respuesta quedó registrada y sirve como constancia de que
            recibiste tu equipo.
          </p>
        </Tarjeta>
      </MarcoPublico>
    );

  if (motivo)
    return (
      <MarcoPublico subtitulo="Encuesta de satisfacción">
        <div className="mx-auto max-w-xl">
          <Alerta
            variante={motivo === "respondida" ? "exito" : "aviso"}
            titulo={MENSAJES[motivo].titulo}
          >
            {MENSAJES[motivo].texto}
          </Alerta>
        </div>
      </MarcoPublico>
    );

  const equipo = datos.equipos.find((e) => e.id === ficha.equipoId);
  const clinica = datos.clinicas.find((c) => c.id === ficha.clinicaId);

  return (
    <MarcoPublico subtitulo="Encuesta de satisfacción">
      <Tarjeta acento className="mx-auto max-w-xl overflow-hidden">
        <div className="space-y-1 border-b border-slate-200 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-inacap">
            Encuesta de satisfacción
          </p>
          <h1 className="text-xl font-bold leading-tight text-tinta">
            ¿Cómo fue tu atención?
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            {equipo?.numeroEquipo} · {equipo?.tipo}
            {clinica && ` · ${clinica.nombre}, ${clinica.sede}`}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-6 p-5 sm:p-7" noValidate>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              Nota de la atención
              <span aria-hidden="true" className="ml-0.5 text-inacap">
                *
              </span>
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {NOTAS.map((n) => (
                <Opcion
                  key={n.valor}
                  nombre="nota"
                  marcada={form.nota === n.valor}
                  onChange={() => cambiar("nota", n.valor)}
                >
                  <span className="flex flex-col leading-tight">
                    <span className="text-base">{n.valor}</span>
                    <span className="text-[0.65rem] font-medium">
                      {n.texto}
                    </span>
                  </span>
                </Opcion>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              ¿Recibiste tu equipo conforme?
              <span aria-hidden="true" className="ml-0.5 text-inacap">
                *
              </span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONFORMIDAD.map((c) => (
                <Opcion
                  key={String(c.valor)}
                  nombre="conforme"
                  marcada={form.conforme === c.valor}
                  onChange={() => cambiar("conforme", c.valor)}
                >
                  {c.texto}
                </Opcion>
              ))}
            </div>
          </fieldset>

          <Campo
            as="textarea"
            etiqueta="Comentario (opcional)"
            rows={3}
            maxLength={LARGO_COMENTARIO}
            value={form.comentario}
            onChange={(e) => cambiar("comentario", e.target.value)}
            placeholder="Cuéntanos qué te pareció la atención"
            ayuda="No escribas datos personales como tu RUT o tu teléfono."
          />

          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.recibido}
              onChange={(e) => cambiar("recibido", e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              Confirmo que recibí mi equipo
              {equipo?.accesorios && ` junto con: ${equipo.accesorios}`}.
            </span>
          </label>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}

          <Boton type="submit" bloque>
            Enviar respuesta
          </Boton>
        </form>
      </Tarjeta>
    </MarcoPublico>
  );
}
