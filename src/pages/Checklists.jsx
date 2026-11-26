import { useState } from "react";
import { useApp } from "../store.jsx";
import {
  MAX_ITEM,
  MAX_NOMBRE_PLANTILLA,
} from "../lib/importacionChecklists.js";
import { normalizar } from "../lib/texto.js";
import ImportarChecklists from "../components/ImportarChecklists.jsx";
import Alerta from "../components/ui/Alerta.jsx";
import Boton from "../components/ui/Boton.jsx";
import Campo from "../components/ui/Campo.jsx";
import Encabezado from "../components/ui/Encabezado.jsx";
import EstadoVacio from "../components/ui/EstadoVacio.jsx";
import Insignia from "../components/ui/Insignia.jsx";
import Tarjeta from "../components/ui/Tarjeta.jsx";
import Seccion from "../components/ui/Seccion.jsx";
import PanelCreacion, {
  PieAcciones,
} from "../components/ui/PanelCreacion.jsx";
import {
  IconoBasura,
  IconoChecklist,
  IconoDocumento,
  IconoMas,
} from "../components/ui/iconos.jsx";

// Fila editable de un ítem: número, texto y botón para quitarlo
function FilaItem({ id, indice, texto, onEditar, onQuitar }) {
  return (
    <li className="flex items-center gap-2 py-2">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold tabular-nums text-slate-500"
      >
        {indice + 1}
      </span>
      <label htmlFor={`item-${id}`} className="sr-only">
        Texto del ítem {indice + 1}
      </label>
      <input
        id={`item-${id}`}
        className="block min-h-11 w-full min-w-0 flex-1 rounded-control border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 transition-[border-color,box-shadow] duration-150 hover:border-slate-400 focus:border-inacap focus:outline-none focus:ring-4 focus:ring-inacap/15"
        value={texto}
        maxLength={MAX_ITEM}
        onChange={(e) => onEditar(e.target.value)}
      />
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar ítem ${indice + 1}`}
        title="Quitar ítem"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-slate-500 transition-colors duration-150 hover:bg-error-tenue hover:text-error"
      >
        <IconoBasura className="h-5 w-5" />
      </button>
    </li>
  );
}

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
    <Tarjeta as="article">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-inacap-tenue text-inacap-oscuro sm:flex"
          >
            <IconoChecklist className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold text-slate-900">
              {plantilla.nombre}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <Insignia tono="neutral" punto={false}>
                {plantilla.items.length} ítems
              </Insignia>
              {enUso && (
                <Insignia tono="aviso">En uso por una clínica</Insignia>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Boton variante="secundario" tamano="sm" onClick={onDuplicar}>
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

      <div className="p-4 sm:px-5">
        <p className="mb-3 text-sm text-slate-600">
          Ítems que verán los técnicos al revisar cada equipo.
        </p>

        <ol className="divide-y divide-slate-100">
          {plantilla.items.map((item, indice) => (
            <FilaItem
              key={item.id}
              id={item.id}
              indice={indice}
              texto={item.texto}
              onEditar={(texto) => editarItem(item.id, texto)}
              onQuitar={() => quitarItem(item.id)}
            />
          ))}
        </ol>
        {plantilla.items.length === 0 && (
          <Alerta variante="info">
            Esta plantilla no tiene ítems. Agrega el primero abajo.
          </Alerta>
        )}
      </div>

      <form
        onSubmit={agregarItem}
        className="flex flex-col gap-3 rounded-b-tarjeta border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-end sm:px-5"
      >
        <Campo
          etiqueta="Nuevo ítem"
          className="flex-1"
          placeholder="Por ejemplo: Ventilador sin ruido"
          value={nuevoItem}
          maxLength={MAX_ITEM}
          onChange={(e) => setNuevoItem(e.target.value)}
          aria-label="Nuevo ítem de la plantilla"
        />
        <Boton type="submit" variante="secundario" className="pl-4.5">
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
  const [borrador, setBorrador] = useState([]); // ítems de la plantilla nueva
  const [nuevoItem, setNuevoItem] = useState("");
  const [error, setError] = useState("");
  // Solo visual: panel desplegado ("crear", "importar" o ninguno)
  const [panel, setPanel] = useState(null);

  const limpiarFormulario = () => {
    setNombre("");
    setBorrador([]);
    setNuevoItem("");
    setError("");
  };

  const agregarAlBorrador = () => {
    const texto = nuevoItem.trim();
    if (!texto) return;
    setBorrador((b) => [...b, { id: crypto.randomUUID(), texto }]);
    setNuevoItem("");
  };

  const crear = (e) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return setError("Escribe un nombre para la plantilla.");
    if (
      datos.plantillas.some(
        (p) => normalizar(p.nombre).trim() === normalizar(limpio),
      )
    )
      return setError("Ya existe una plantilla con ese nombre.");
    // Lo que quedó escrito en "Nuevo ítem" también se incluye
    const pendiente = nuevoItem.trim()
      ? [{ id: crypto.randomUUID(), texto: nuevoItem.trim() }]
      : [];
    const items = [...borrador, ...pendiente]
      .map((i) => ({ ...i, texto: i.texto.trim() }))
      .filter((i) => i.texto);
    actualizar((d) => ({
      ...d,
      plantillas: [
        ...d.plantillas,
        { id: crypto.randomUUID(), nombre: limpio, items },
      ],
    }));
    limpiarFormulario();
    setPanel(null);
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

  const cerrarPanel = () => {
    setPanel(null);
    limpiarFormulario();
  };

  const botonNueva = (
    <Boton
      onClick={() => setPanel("crear")}
      aria-pressed={panel === "crear"}
      className="pl-4.5"
    >
      <IconoMas className="h-4 w-4" />
      Nueva plantilla
    </Boton>
  );

  return (
    <div className="space-y-8">
      <Encabezado
        titulo="Plantillas de checklist"
        descripcion="Cada clínica elige una plantilla. Los técnicos la completan al revisar cada equipo."
        acciones={
          <>
            <Boton
              variante="contorno"
              onClick={() => {
                setPanel("importar");
                limpiarFormulario();
              }}
              aria-pressed={panel === "importar"}
              className="pl-4.5"
            >
              <IconoDocumento className="h-4 w-4" />
              Importar desde Excel
            </Boton>
            {botonNueva}
          </>
        }
      />

      {panel === "crear" && (
        <PanelCreacion
          titulo="Nueva plantilla"
          descripcion="Ponle un nombre y agrega sus ítems. Podrás editarlos después."
          icono={<IconoChecklist className="h-5 w-5" />}
          onCerrar={cerrarPanel}
        >
          <form onSubmit={crear} className="space-y-5">
            <Campo
              etiqueta="Nombre de la plantilla"
              className="sm:max-w-md"
              placeholder="Ej. Revisión de notebooks"
              value={nombre}
              maxLength={MAX_NOMBRE_PLANTILLA}
              onChange={(e) => setNombre(e.target.value)}
            />

            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Ítems{" "}
                <span className="font-normal text-slate-500">
                  ({borrador.length})
                </span>
              </h4>
              {borrador.length > 0 ? (
                <ol className="mt-1 divide-y divide-slate-100">
                  {borrador.map((item, indice) => (
                    <FilaItem
                      key={item.id}
                      id={item.id}
                      indice={indice}
                      texto={item.texto}
                      onEditar={(texto) =>
                        setBorrador((b) =>
                          b.map((i) => (i.id === item.id ? { ...i, texto } : i)),
                        )
                      }
                      onQuitar={() =>
                        setBorrador((b) => b.filter((i) => i.id !== item.id))
                      }
                    />
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  Aún no agregas ítems. Puedes crearla vacía y agregarlos
                  después.
                </p>
              )}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <Campo
                  etiqueta="Nuevo ítem"
                  className="flex-1"
                  placeholder="Por ejemplo: Ventilador sin ruido"
                  value={nuevoItem}
                  maxLength={MAX_ITEM}
                  onChange={(e) => setNuevoItem(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter agrega el ítem en vez de crear la plantilla
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarAlBorrador();
                    }
                  }}
                />
                <Boton
                  type="button"
                  variante="secundario"
                  onClick={agregarAlBorrador}
                  className="pl-4.5"
                >
                  <IconoMas className="h-4 w-4" />
                  Agregar ítem
                </Boton>
              </div>
            </div>

            {error && (
              <Alerta variante="error" role="alert">
                {error}
              </Alerta>
            )}

            <PieAcciones>
              <Boton variante="secundario" onClick={cerrarPanel}>
                Cancelar
              </Boton>
              <Boton type="submit">Crear plantilla</Boton>
            </PieAcciones>
          </form>
        </PanelCreacion>
      )}

      {panel === "importar" && <ImportarChecklists onCerrar={cerrarPanel} />}

      <Seccion titulo="Plantillas" contador={datos.plantillas.length}>
        {datos.plantillas.length === 0 ? (
          <EstadoVacio
            icono={<IconoChecklist className="h-6 w-6" />}
            titulo="Aún no hay plantillas"
            descripcion="Crea la primera plantilla o impórtalas desde Excel para que las clínicas puedan revisar equipos."
            accion={!panel && botonNueva}
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
      </Seccion>
    </div>
  );
}
