import { useApp } from "../store.jsx";
import { formatearFecha } from "../lib/fechas.js";
import Boton from "./ui/Boton.jsx";
import Insignia from "./ui/Insignia.jsx";
import Tarjeta from "./ui/Tarjeta.jsx";

export default function AtencionAnterior({ ficha, onCerrar }) {
  const { datos } = useApp();

  const clinica = datos.clinicas.find((c) => c.id === ficha.clinicaId);
  const nombreUsuario = (id) =>
    datos.usuarios.find((u) => u.id === id)?.nombre ?? "Usuario no disponible";
  const detalle = ficha.checklist.filter((i) => i.ok === false);

  return (
    <Tarjeta as="section" className="mt-4 bg-neutral-50 p-4 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-tinta">
              Atención anterior {ficha.numero}
            </h3>
            <Insignia estado={ficha.estado} />
          </div>
          <p className="text-sm text-neutral-600">
            {clinica?.nombre ?? "Clínica no disponible"} ·{" "}
            {formatearFecha(ficha.creada.slice(0, 10))}
          </p>
        </div>
        {onCerrar && (
          <Boton variante="secundario" onClick={onCerrar}>
            Cerrar
          </Boton>
        )}
      </header>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-neutral-500">Diagnóstico</dt>
          <dd className="mt-0.5 text-neutral-800">{ficha.diagnostico}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Trabajo realizado</dt>
          <dd className="mt-0.5 text-neutral-800">{ficha.trabajo}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500">Revisado por</dt>
          <dd className="mt-0.5 text-neutral-800">
            {ficha.tecnicosIds.map(nombreUsuario).join(" y ")}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-1 text-sm">
        <p className="font-semibold text-neutral-700">Detalles</p>
        {detalle.length === 0 ? (
          <p className="text-neutral-600">Ninguna.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-neutral-700">
            {detalle.map((i) => (
              <li key={i.itemId}>{i.texto}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 space-y-1 text-sm">
        <p className="font-semibold text-neutral-700">Observaciones</p>
        {ficha.observaciones.length === 0 ? (
          <p className="text-neutral-600">Sin observaciones.</p>
        ) : (
          <ul className="space-y-2">
            {ficha.observaciones.map((o) => (
              <li
                key={o.id}
                className="rounded-control border border-neutral-200 bg-white p-3"
              >
                {o.texto}{" "}
                <span className="text-neutral-600">
                  ({nombreUsuario(o.autorId)},{" "}
                  {new Date(o.fecha).toLocaleString("es-CL")})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Tarjeta>
  );
}
