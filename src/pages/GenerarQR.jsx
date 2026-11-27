import { useEffect, useState } from "react";
import { useApp } from "../store.jsx";
import { SEDES, SIGLA_SEDE } from "../constantes.js";
import { useCodigoQR } from "../lib/useCodigoQR.js";
import Campo from "../components/ui/Campo.jsx";
import CodigoQR from "../components/CodigoQR.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoCheck,
  IconoCopiar,
  IconoDescargar,
  IconoInscripcion,
} from "../components/ui/iconos.jsx";

// Enlace público al formulario de inscripción de una sede (la app usa
// HashRouter). La sigla de la sede asocia cada inscripción a su sede
const enlaceInscripcion = (sigla) =>
  `${window.location.origin}${window.location.pathname}#/inscripcion?sede=${sigla}`;

const esLocal = () =>
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export default function GenerarQR() {
  const { usuario } = useApp();
  // Quien tiene sede genera el QR de su sede; sin sede, la elige
  const [sedeElegida, setSedeElegida] = useState(SEDES[0]);
  const sede = usuario.sede || sedeElegida;
  const sigla = SIGLA_SEDE[sede];
  const enlace = enlaceInscripcion(sigla);
  const { imagen, error: errorQR } = useCodigoQR(enlace);
  const [errorCopia, setErrorCopia] = useState("");
  const error = errorQR || errorCopia;
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return undefined;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
    } catch {
      setErrorCopia("No se pudo copiar el enlace. Cópialo manualmente.");
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado
        eyebrow={sede}
        titulo="QR de inscripción"
        descripcion="Comparte este código con los propietarios: al escanearlo llegan al formulario de inscripción de esta sede sin iniciar sesión."
      />

      {!usuario.sede && (
        <Campo
          as="select"
          etiqueta="Sede del QR"
          className="sm:max-w-sm"
          value={sedeElegida}
          onChange={(e) => setSedeElegida(e.target.value)}
          ayuda="Tu cuenta no tiene sede: elige para qué sede es el código."
        >
          {SEDES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Campo>
      )}

      {esLocal() && (
        <Alerta variante="aviso" titulo="Estás en un entorno local">
          El enlace apunta a <strong>{window.location.host}</strong>, que no es
          accesible desde otros dispositivos. Genera el QR desde la versión
          publicada para compartirlo.
        </Alerta>
      )}

      {error && (
        <Alerta variante="error" role="alert">
          {error}
        </Alerta>
      )}

      <Tarjeta className="grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_1fr] md:items-center">
        <CodigoQR
          imagen={imagen}
          alt="Código QR del formulario de inscripción a la Clínica del PC"
          className="max-w-72"
        />

        <div className="min-w-0 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-tinta">
              Enlace del formulario
            </h2>
            <p className="break-all rounded-control bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-700">
              {enlace}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Boton
              as="a"
              href={imagen || undefined}
              download={`qr-inscripcion-${sigla}.png`}
              disabled={!imagen}
            >
              <IconoDescargar className="h-4 w-4" />
              Descargar PNG
            </Boton>
            <Boton variante="contorno" onClick={copiar}>
              {copiado ? (
                <IconoCheck className="h-4 w-4" />
              ) : (
                <IconoCopiar className="h-4 w-4" />
              )}
              {copiado ? "Enlace copiado" : "Copiar enlace"}
            </Boton>
            <Boton
              as="a"
              href={enlace}
              target="_blank"
              rel="noreferrer"
              variante="secundario"
            >
              <IconoInscripcion className="h-4 w-4" />
              Abrir formulario
            </Boton>
          </div>

          <p className="text-sm leading-relaxed text-neutral-600">
            Puedes imprimir el PNG o enviarlo por correo o redes sociales. Las
            inscripciones hechas desde el QR quedan con origen{" "}
            <strong>QR</strong>.
          </p>
        </div>
      </Tarjeta>
    </div>
  );
}
