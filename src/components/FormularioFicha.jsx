import { useState } from "react";
import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { siguienteCodigo } from "../lib/codigos.js";

const ESTILO_INPUT = "border rounded-lg px-3 py-2 w-full bg-white";

export default function FormularioFicha({
  equipo,
  clinica,
  onCancelar,
  onCreada,
}) {
  const { datos, actualizar, usuario } = useApp();

  const [accesorios, setAccesorios] = useState(equipo.accesorios ?? "");
  const [tecnicosIds, setTecnicosIds] = useState([]);
  const [error, setError] = useState("");

  // Solo técnicos activos asignados a esta clínica
  const tecnicos = datos.usuarios.filter(
    (u) =>
      puede(u, PERMISOS.REVISAR_EQUIPOS) &&
      (clinica.personalIds ?? []).includes(u.id),
  );

  // Una pareja como máximo: 1 o 2 técnicos
  const alternarTecnico = (id) =>
    setTecnicosIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const crear = (e) => {
    e.preventDefault();
    if (tecnicosIds.length < 1 || tecnicosIds.length > 2)
      return setError("Asigna uno o dos técnicos al equipo.");
    setError("");

    // El checklist se copia de la plantilla de la clínica, con el texto de cada ítem
    const plantilla = datos.plantillas.find(
      (p) => p.id === clinica.plantillaId,
    );
    const ficha = {
      id: crypto.randomUUID(),
      numero: siguienteCodigo("FT", datos.fichas, "numero"),
      clinicaId: clinica.id,
      equipoId: equipo.id,
      recepcionistaId: usuario.id,
      tecnicosIds,
      diagnostico: "", // lo registra el técnico
      trabajo: "", // lo registra el técnico
      estado: "Recibido",
      checklist: (plantilla?.items ?? []).map((i) => ({
        itemId: i.id,
        texto: i.texto,
        ok: null,
      })),
      observaciones: [],
      creada: new Date().toISOString(),
      cerrada: null,
    };

    actualizar((d) => ({
      ...d,
      equipos: d.equipos.map((x) =>
        x.id === equipo.id ? { ...x, accesorios: accesorios.trim() } : x,
      ),
      fichas: [...d.fichas, ficha],
    }));
    onCreada(ficha);
  };

  return (
    <form onSubmit={crear} className="border rounded-lg p-4 space-y-4 mt-3">
      <h3 className="font-semibold">
        Recepción de {equipo.numeroEquipo} · {equipo.tipo}
      </h3>
      <p className="text-sm text-neutral-600">Clínica: {clinica.nombre}</p>

      <label className="block text-sm">
        Accesorios que deja el propietario
        <input
          className={ESTILO_INPUT}
          value={accesorios}
          onChange={(e) => setAccesorios(e.target.value)}
          maxLength={120}
          placeholder="Ej. cargador, mouse"
        />
      </label>

      <fieldset className="text-sm">
        <legend>Técnicos que revisarán el equipo (1 o 2)</legend>
        <div className="mt-1 grid sm:grid-cols-2 gap-1">
          {tecnicos.map((t) => {
            const marcado = tecnicosIds.includes(t.id);
            return (
              <label key={t.id} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternarTecnico(t.id)}
                  disabled={!marcado && tecnicosIds.length >= 2}
                />
                {t.nombre}
              </label>
            );
          })}
          {tecnicos.length === 0 && (
            <p className="text-neutral-600">
              Esta clínica no tiene técnicos asignados. Pídele al encargado que
              los asigne.
            </p>
          )}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button className="bg-[#EE0000] text-white rounded-lg py-2 px-4">
          Crear ficha
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="border rounded-lg py-2 px-4"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
