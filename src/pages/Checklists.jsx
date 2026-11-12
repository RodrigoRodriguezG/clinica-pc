import { useState } from "react";
import { useApp } from "../store.jsx";

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
    <article className="border rounded p-4 space-y-3">
      <header className="flex justify-between items-center">
        <h2 className="font-semibold">
          {plantilla.nombre}
          <span className="ml-2 text-sm font-normal text-neutral-600">
            {plantilla.items.length} ítems{enUso && " · en uso por una clínica"}
          </span>
        </h2>
        <div className="flex gap-4 text-sm">
          <button onClick={onDuplicar} className="underline">
            Duplicar
          </button>
          <button
            onClick={onEliminar}
            disabled={enUso}
            title={enUso ? "No se puede eliminar: una clínica la usa" : ""}
            className="underline text-red-700 disabled:opacity-40 disabled:no-underline"
          >
            Eliminar
          </button>
        </div>
      </header>

      <ul className="space-y-2">
        {plantilla.items.map((item) => (
          <li key={item.id} className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-1"
              value={item.texto}
              maxLength={80}
              onChange={(e) => editarItem(item.id, e.target.value)}
              aria-label="Texto del ítem"
            />
            <button
              onClick={() => quitarItem(item.id)}
              className="text-sm underline"
            >
              Quitar
            </button>
          </li>
        ))}
        {plantilla.items.length === 0 && (
          <li className="text-sm text-neutral-600">
            Esta plantilla no tiene ítems. Agrega el primero abajo.
          </li>
        )}
      </ul>

      <form onSubmit={agregarItem} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-1"
          placeholder="Nuevo ítem, por ejemplo: Ventilador sin ruido"
          value={nuevoItem}
          maxLength={80}
          onChange={(e) => setNuevoItem(e.target.value)}
        />
        <button className="bg-[#EE0000] text-white rounded px-3">
          Agregar ítem
        </button>
      </form>
    </article>
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
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-semibold">Plantillas de checklist</h1>
      <p className="text-neutral-600">
        Cada clínica elige una plantilla. Los técnicos la completan al revisar
        cada equipo.
      </p>

      <form onSubmit={crear} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Nombre de la nueva plantilla"
          value={nombre}
          maxLength={60}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button className="bg-[#E30613] text-white rounded px-4">
          Crear plantilla
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

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
    </div>
  );
}
