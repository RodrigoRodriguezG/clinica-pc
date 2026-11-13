import { useApp } from "../store.jsx";
import { formatearFecha } from "../lib/fechas.js";

export default function AtencionAnterior({ ficha, onCerrar }) {
  const { datos } = useApp();

  const clinica = datos.clinicas.find((c) => c.id === ficha.clinicaId);
  const nombreUsuario = (id) =>
    datos.usuarios.find((u) => u.id === id)?.nombre ?? "Usuario no disponible";
  const fallas = ficha.checklist.filter((i) => i.ok === false);

  return (
    <section className="mt-3 border rounded-lg p-4 bg-neutral-50 space-y-3 text-sm">
      <header className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">
            Atención anterior {ficha.numero} · {ficha.estado}
          </h3>
          <p className="text-neutral-600">
            {clinica?.nombre ?? "Clínica no disponible"} ·{" "}
            {formatearFecha(ficha.creada.slice(0, 10))}
          </p>
        </div>
        <button onClick={onCerrar} className="underline">
          Cerrar
        </button>
      </header>

      <p>
        <span className="text-neutral-600">Diagnóstico:</span>{" "}
        {ficha.diagnostico}
      </p>
      <p>
        <span className="text-neutral-600">Trabajo realizado:</span>{" "}
        {ficha.trabajo}
      </p>
      <p>
        <span className="text-neutral-600">Revisado por:</span>{" "}
        {ficha.tecnicosIds.map(nombreUsuario).join(" y ")}
      </p>

      <div>
        <p className="text-neutral-600">Fallas detectadas en el checklist:</p>
        {fallas.length === 0 ? (
          <p>Ninguna.</p>
        ) : (
          <ul className="list-disc pl-5">
            {fallas.map((i) => (
              <li key={i.itemId}>{i.texto}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-neutral-600">Observaciones:</p>
        {ficha.observaciones.length === 0 ? (
          <p>Sin observaciones.</p>
        ) : (
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
          </ul>
        )}
      </div>
    </section>
  );
}
