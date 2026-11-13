import { useState } from "react";
import { useApp } from "../store.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import {
  IconoBasura,
  IconoChecklist,
  IconoMas,
} from "../components/ui/iconos.jsx";

function Plantilla({ plantilla, enUso, onCambiar, onDuplicar, onEliminar }) {
  const [nuevoItem, setNuevoItem] = useState("");

  const agregarItem = (e) => {
    e.preventDefault();
    const texto = nuevoItem.trim();
    if (!texto) return;
    onCambiar((p) => ({
      ...p,
      items: [...p.items, { id: crypto.randomUUID(), texto }],
    }));
    setNuevoItem("");
  };

  const editarItem = (itemId, texto) =>
    onCambiar((p) => ({
      ...p,
      items: p.items.map((i) => (i.id === itemId ? { ...i, texto } : i)),
    }));

  const quitarItem = (itemId) =>
    onCambiar((p) => ({ ...p, items: p.items.filter((i) => i.id !== itemId) }));

  return (
    <Tarjeta as="article" className="p-4 sm:p-5">
      <header className="flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-tinta">
              {plantilla.nombre}
            </h2>
            <Insignia tono="neutral">{plantilla.items.length} ítems</Insignia>
            {enUso && (
              <Insignia tono="aviso">En uso por una clínica</Insignia>
            )}
          </div>
          <p className="text-sm text-neutral-600">
            Edita los ítems que verán los técnicos al revisar cada equipo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Boton variante="enlace" onClick={onDuplicar}>
            Duplicar
          </Boton>
          <Boton
            variante="peligro-enlace"
            onClick={onEliminar}
            disabled={enUso}
            title={enUso ? "No se puede eliminar: una clínica la usa" : ""}
          >
            Eliminar
          </Boton>
        </div>
      </header>

      <ul className="mt-4 space-y-2">
        {plantilla.items.map((item, indice) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 rounded-control border border-neutral-200 bg-neutral-50 p-2.5 sm:flex-row sm:items-center"
          >
            <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-500 ring-1 ring-neutral-200 sm:flex">
              {indice + 1}
            </span>
            <Campo
              etiqueta={`Ítem ${indice + 1}`}
              className="flex-1"
              classNameControl="min-h-11 bg-white"
              value={item.texto}
              maxLength={80}
              onChange={(e) => editarItem(item.id, e.target.value)}
              aria-label={`Texto del ítem ${indice + 1}`}
            />
            <Boton
              variante="peligro-enlace"
              onClick={() => quitarItem(item.id)}
              className="self-end sm:self-auto"
            >
              <IconoBasura className="h-4 w-4" />
              Quitar
            </Boton>
          </li>
        ))}
        {plantilla.items.length === 0 && (
          <li>
            <Alerta variante="info">
              Esta plantilla no tiene ítems. Agrega el primero abajo.
            </Alerta>
          </li>
        )}
      </ul>

      <form
        onSubmit={agregarItem}
        className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 sm:flex-row sm:items-end"
      >
        <Campo
          etiqueta="Nuevo ítem"
          className="flex-1"
          placeholder="Nuevo ítem, por ejemplo: Ventilador sin ruido"
          value={nuevoItem}
          maxLength={80}
          onChange={(e) => setNuevoItem(e.target.value)}
          aria-label="Nuevo ítem de la plantilla"
        />
        <Boton type="submit" variante="secundario">
          <IconoMas className="h-4 w-4" />
          Agregar ítem
        </Boton>
      </form>
    </Tarjeta>
  );
}

export default function Checklists() {
  const { datos, actualizar } = useApp();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  const crear = (e) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return setError("Escribe un nombre para la plantilla.");
    if (
      datos.plantillas.some(
        (p) => p.nombre.toLowerCase() === limpio.toLowerCase(),
      )
    )
      return setError("Ya existe una plantilla con ese nombre.");
    setError("");
    actualizar((d) => ({
      ...d,
      plantillas: [
        ...d.plantillas,
        { id: crypto.randomUUID(), nombre: limpio, items: [] },
      ],
    }));
    setNombre("");
  };

  // Aplica una función de cambio a una sola plantilla
  const cambiar = (id, fn) =>
    actualizar((d) => ({
      ...d,
      plantillas: d.plantillas.map((p) => (p.id === id ? fn(p) : p)),
    }));

  const duplicar = (p) =>
    actualizar((d) => ({
      ...d,
      plantillas: [
        ...d.plantillas,
        {
          id: crypto.randomUUID(),
          nombre: `${p.nombre} (copia)`,
          // ids nuevos para que los ítems de la copia sean independientes
          items: p.items.map((i) => ({ ...i, id: crypto.randomUUID() })),
        },
      ],
    }));

  const eliminar = (id) =>
    actualizar((d) => ({
      ...d,
      plantillas: d.plantillas.filter((p) => p.id !== id),
    }));

  const usaClinica = (id) => datos.clinicas.some((c) => c.plantillaId === id);

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Plantillas de checklist"
        descripcion="Cada clínica elige una plantilla. Los técnicos la completan al revisar cada equipo."
      />

      <Tarjeta className="p-4 sm:p-5">
        <form onSubmit={crear} className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-control bg-inacap-tenue text-inacap-oscuro"
            >
              <IconoChecklist className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-tinta">
              Nueva plantilla
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Campo
              etiqueta="Nombre de la plantilla"
              className="flex-1"
              placeholder="Nombre de la nueva plantilla"
              value={nombre}
              maxLength={60}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Boton type="submit">Crear plantilla</Boton>
          </div>

          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
        </form>
      </Tarjeta>

      {datos.plantillas.length === 0 ? (
        <EstadoVacio
          icono={<IconoChecklist className="h-6 w-6" />}
          titulo="Aún no hay plantillas"
          descripcion="Crea la primera plantilla para que las clínicas puedan revisar equipos."
        />
      ) : (
        <div className="space-y-4">
          {datos.plantillas.map((p) => (
            <Plantilla
              key={p.id}
              plantilla={p}
              enUso={usaClinica(p.id)}
              onCambiar={(fn) => cambiar(p.id, fn)}
              onDuplicar={() => duplicar(p)}
              onEliminar={() => eliminar(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
