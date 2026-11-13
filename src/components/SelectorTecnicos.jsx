import { useApp } from "../store.jsx";
import { LIMITE_FICHAS_TECNICO, PERMISOS } from "../constantes.js";
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
  const cupo = (id) => fichasEnCursoDe(datos, id).length;
  const hayDisponibles = tecnicos.some(
    (t) => cupo(t.id) < LIMITE_FICHAS_TECNICO && !excluir.includes(t.id),
  );

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-tinta">
        Técnicos que revisarán el equipo (1 o 2)
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {tecnicos.map((t) => {
          const marcado = seleccion.includes(t.id);
          const lleno = cupo(t.id) >= LIMITE_FICHAS_TECNICO;
          const excluido = excluir.includes(t.id);
          // Quien ya está marcado siempre puede desmarcarse
          const bloqueado =
            !marcado && (lleno || excluido || seleccion.length >= 2);
          return (
            <label
              key={t.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
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
                <span className="font-normal text-neutral-500">
                  {excluido
                    ? "(rechazó esta ficha)"
                    : `(${cupo(t.id)} de ${LIMITE_FICHAS_TECNICO} fichas)`}
                </span>
              </span>
            </label>
          );
        })}
        {tecnicos.length === 0 && (
          <p className="text-sm text-neutral-600">
            Esta clínica no tiene técnicos asignados. Pídele al encargado que
            los asigne.
          </p>
        )}
      </div>
      {tecnicos.length > 0 && !hayDisponibles && (
        <p className="text-sm text-amber-800">
          Todos los técnicos tienen su cupo lleno. Espera a que alguno deje un
          equipo en estado Listo.
        </p>
      )}
    </fieldset>
  );
}
