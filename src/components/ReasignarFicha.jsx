import { useState } from "react";
import { useApp } from "../store.jsx";
import { reasignarFicha } from "../lib/fichas.js";
import Alerta from "./ui/Alerta.jsx";
import Boton from "./ui/Boton.jsx";
import Insignia from "./ui/Insignia.jsx";
import Tarjeta from "./ui/Tarjeta.jsx";
import SelectorTecnicos from "./SelectorTecnicos.jsx";

export default function ReasignarFicha({ ficha, clinica }) {
  const { datos, actualizar, usuario } = useApp();
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState([]);
  const [error, setError] = useState("");

  const equipo = datos.equipos.find((e) => e.id === ficha.equipoId);
  const motivo = [...ficha.observaciones]
    .reverse()
    .find((o) => o.texto.startsWith("Rechazó la ficha"))?.texto;

  const alternar = (id) =>
    setSeleccion((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const confirmar = () => {
    if (seleccion.length < 1 || seleccion.length > 2)
      return setError("Asigna uno o dos técnicos.");
    actualizar((d) => ({
      ...d,
      fichas: d.fichas.map((f) =>
        f.id === ficha.id ? reasignarFicha(f, seleccion, usuario.id) : f,
      ),
    }));
  };

  return (
    <Tarjeta as="li" className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">
              {ficha.numero} · {equipo?.numeroEquipo} · {equipo?.tipo}
            </p>
            <Insignia estado={ficha.estado} />
          </div>
          {motivo && <p className="text-sm text-slate-600">{motivo}</p>}
        </div>
        <Boton
          variante={abierto ? "secundario" : "primario"}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? "Cancelar" : "Reasignar"}
        </Boton>
      </div>

      {abierto && (
        <div className="space-y-3 rounded-control border border-slate-200 bg-slate-50 p-4">
          <SelectorTecnicos
            clinica={clinica}
            seleccion={seleccion}
            onAlternar={alternar}
            excluir={ficha.rechazadaPor ?? []}
          />
          {error && (
            <Alerta variante="error" role="alert">
              {error}
            </Alerta>
          )}
          <Boton onClick={confirmar}>Reasignar ficha</Boton>
        </div>
      )}
    </Tarjeta>
  );
}
