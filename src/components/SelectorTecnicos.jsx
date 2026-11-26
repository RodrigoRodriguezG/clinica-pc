import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { fichasEnCursoDe } from "../lib/fichas.js";

export default function SelectorTecnicos({
  clinica,
  seleccion,
  onAlternar,
  excluir = [],
}) {
  const { datos } = useApp();

  // Solo técnicos activos asignados a esta clínica
  const tecnicos = datos.usuarios.filter(
    (u) =>
      puede(u, PERMISOS.REVISAR_EQUIPOS) &&
      (clinica.personalIds ?? []).includes(u.id),
  );
  // Se muestra cuántas fichas tiene cada uno para repartir la carga
  const enTrabajo = (id) => fichasEnCursoDe(datos, id).length;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-900">
        Técnicos que revisarán el equipo (1 o 2)
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {tecnicos.map((t) => {
          const marcado = seleccion.includes(t.id);
          const excluido = excluir.includes(t.id);
          const n = enTrabajo(t.id);
          // Quien ya está marcado siempre puede desmarcarse
          const bloqueado = !marcado && (excluido || seleccion.length >= 2);
          return (
            <label
              key={t.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0"
                checked={marcado}
                onChange={() => onAlternar(t.id)}
                disabled={bloqueado}
              />
              <span>
                {t.nombre}{" "}
                <span className="font-normal text-slate-500">
                  {excluido
                    ? "(rechazó esta ficha)"
                    : `(${n} ${n === 1 ? "ficha" : "fichas"} en trabajo)`}
                </span>
              </span>
            </label>
          );
        })}
        {tecnicos.length === 0 && (
          <p className="text-sm text-slate-600">
            Esta clínica no tiene técnicos asignados. Pídele al encargado que
            los asigne.
          </p>
        )}
      </div>
    </fieldset>
  );
}
