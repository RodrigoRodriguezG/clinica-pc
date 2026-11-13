import { useState } from "react";
import { useApp } from "../store.jsx";
import { PERMISOS } from "../constantes.js";
import { puede } from "../lib/permisos.js";
import { siguienteCodigo } from "../lib/codigos.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import { IconoMonitor } from "./ui/iconos.jsx";

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
    <form
      onSubmit={crear}
      className="mt-4 space-y-4 rounded-control border border-neutral-200 bg-neutral-50 p-4 sm:p-5"
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-white text-inacap shadow-sm ring-1 ring-neutral-200"
        >
          <IconoMonitor className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-tinta">
            Recepción de {equipo.numeroEquipo} · {equipo.tipo}
          </h3>
          <p className="text-sm text-neutral-600">Clínica: {clinica.nombre}</p>
        </div>
      </header>

      <Campo
        etiqueta="Accesorios que deja el propietario"
        value={accesorios}
        onChange={(e) => setAccesorios(e.target.value)}
        maxLength={120}
        placeholder="Ej. cargador, mouse"
        ayuda="Opcional. Registra cargador, mouse, maletín u otros accesorios."
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-tinta">
          Técnicos que revisarán el equipo (1 o 2)
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {tecnicos.map((t) => {
            const marcado = tecnicosIds.includes(t.id);
            return (
              <label
                key={t.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0"
                  checked={marcado}
                  onChange={() => alternarTecnico(t.id)}
                  disabled={!marcado && tecnicosIds.length >= 2}
                />
                {t.nombre}
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
      </fieldset>

      {error && (
        <Alerta variante="error" role="alert">
          {error}
        </Alerta>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Boton type="submit" bloque className="sm:w-auto">
          Crear ficha
        </Boton>
        <Boton variante="secundario" onClick={onCancelar}>
          Cancelar
        </Boton>
      </div>
    </form>
  );
}
