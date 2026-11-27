import { useEffect, useState } from "react";
import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { enlaceEncuesta, respuestaDeFicha } from "../lib/encuestas.js";
import { useCodigoQR } from "../lib/useCodigoQR.js";
import CodigoQR from "./CodigoQR.jsx";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import { IconoCheck, IconoCopiar } from "./ui/iconos.jsx";

const fechaHora = (iso) =>
  new Date(iso).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });

// QR de la encuesta de satisfacción de una ficha entregada (RF-10). Sigue
// disponible después de la entrega para el propietario que responde tarde.
export default function EncuestaFicha({ ficha }) {
  const { datos, usuario } = useApp();
  const respuesta = respuestaDeFicha(datos, ficha.id);
  const verDetalle = puede(usuario, PERMISOS.VER_RETROALIMENTACION);

  return (
    <section className="space-y-3 border-t border-slate-200 pt-4">
      <h3 className="font-semibold text-slate-900">Encuesta de satisfacción</h3>
      {respuesta ? (
        <Alerta
          variante="exito"
          titulo={`Recepción confirmada el ${fechaHora(respuesta.fecha)}`}
        >
          {verDetalle ? (
            <>
              Nota {respuesta.nota}/5 ·{" "}
              {respuesta.conforme ? "Conforme" : "Con reparos"}
              {respuesta.comentario && (
                <span className="mt-1 block italic">
                  “{respuesta.comentario}”
                </span>
              )}
            </>
          ) : (
            "El propietario respondió la encuesta."
          )}
        </Alerta>
      ) : (
        <QREncuesta token={ficha.tokenEncuesta} numero={ficha.numero} />
      )}
    </section>
  );
}

function QREncuesta({ token, numero }) {
  const enlace = enlaceEncuesta(token);
  const { imagen, error } = useCodigoQR(enlace);
  const [copiado, setCopiado] = useState(false);
  const [errorCopia, setErrorCopia] = useState("");

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
      setErrorCopia("No se pudo copiar el enlace.");
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-center">
      <CodigoQR
        imagen={imagen}
        alt={`Código QR de la encuesta de satisfacción de la ficha ${numero}`}
        className="max-w-40"
      />
      <div className="space-y-3">
        <p className="text-slate-600">
          Pide al propietario que escanee el código y responda. Su respuesta
          queda como constancia de que recibió el equipo. Si no puede ahora,
          envíale el enlace.
        </p>
        {(error || errorCopia) && (
          <Alerta variante="error" role="alert">
            {error || errorCopia}
          </Alerta>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Boton variante="contorno" tamano="sm" onClick={copiar}>
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
            tamano="sm"
          >
            Abrir encuesta
          </Boton>
        </div>
      </div>
    </div>
  );
}
