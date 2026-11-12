import { useState } from "react";
import { useApp } from "../storage.jsx";

export default function Login() {
  const { ingresar, datos } = useApp();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  const enviar = (e) => {
    e.preventDefault();
    setError(ingresar(correo, clave));
  };

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      <section className="bg-[#EE0000] text-white p-10 flex flex-col justify-end">
        <h1 className="text-5xl font-bold leading-tight">Clínica del PC</h1>
        <p className="mt-3 text-lg max-w-sm">
          Recibe, revisa y entrega equipos con registro de cada paso.
        </p>
      </section>

      <section className="p-10 flex items-center justify-center bg-neutral-50">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-800">Ingresar</h2>

          <label className="block text-sm">
            Correo
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoComplete="username"
            />
          </label>

          <label className="block text-sm">
            Contraseña
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button className="w-full bg-[#EE0000] text-white rounded py-2 font-medium hover:bg-red-700">
            Entrar
          </button>

          <details className="text-xs text-neutral-600">
            <summary className="cursor-pointer">
              Cuentas de demostración (clave: Demo1234)
            </summary>
            <ul className="mt-2 space-y-1">
              {datos.usuarios.map((u) => (
                <li key={u.id}>{u.correo}</li>
              ))}
            </ul>
          </details>
        </form>
      </section>
    </main>
  );
}
