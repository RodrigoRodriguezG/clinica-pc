import { useEffect, useState } from "react";
import QRCode from "qrcode";
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

// Enlace público al formulario de inscripción (la app usa HashRouter)
const enlaceInscripcion = () =>
  `${window.location.origin}${window.location.pathname}#/inscripcion`;

const esLocal = () =>
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export default function GenerarQR() {
  const enlace = enlaceInscripcion();
  const [imagen, setImagen] = useState("");
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vigente = true;
    QRCode.toDataURL(enlace, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((url) => vigente && setImagen(url))
      .catch(() => vigente && setError("No se pudo generar el código QR."));
    return () => {
      vigente = false;
    };
  }, [enlace]);

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
      setError("No se pudo copiar el enlace. Cópialo manualmente.");
    }
  };

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="QR de inscripción"
        descripcion="Comparte este código con los propietarios: al escanearlo llegan al formulario de inscripción sin iniciar sesión."
      />

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
        <div className="mx-auto w-full max-w-72 rounded-control border border-neutral-200 bg-white p-3 shadow-sm">
          {imagen ? (
            <img
              src={imagen}
              alt="Código QR del formulario de inscripción a la Clínica del PC"
              className="aspect-square w-full"
            />
          ) : (
            <div className="aspect-square w-full animate-pulse rounded bg-neutral-100" />
          )}
        </div>

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
              download="qr-inscripcion-clinica-pc.png"
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
