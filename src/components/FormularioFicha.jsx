import { useState } from "react";
import { useApp } from "../store.jsx";
import { LIMITE_FICHAS_TECNICO } from "../constantes.js";
import { siguienteCodigo } from "../lib/codigos.js";
import { fichasEnCursoDe } from "../lib/fichas.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Campo from "./ui/Campo.jsx";
import SelectorTecnicos from "./SelectorTecnicos.jsx";
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

  const alternarTecnico = (id) =>
    setTecnicosIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const crear = (e) => {
    e.preventDefault();
    if (tecnicosIds.length < 1 || tecnicosIds.length > 2)
      return setError("Asigna uno o dos técnicos al equipo.");
    // Se vuelve a comprobar aquí: lo que bloquea la pantalla no es la única barrera
    if (
      tecnicosIds.some(
        (id) => fichasEnCursoDe(datos, id).length >= LIMITE_FICHAS_TECNICO,
      )
    )
      return setError(
        `Uno de los técnicos ya tiene ${LIMITE_FICHAS_TECNICO} fichas en trabajo.`,
      );
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

      <SelectorTecnicos
        clinica={clinica}
        seleccion={tecnicosIds}
        onAlternar={alternarTecnico}
      />

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
