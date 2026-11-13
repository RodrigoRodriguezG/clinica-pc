function Icono({ children, className = "h-5 w-5", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoMenu(props) {
  return (
    <Icono {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icono>
  );
}

export function IconoCerrar(props) {
  return (
    <Icono {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icono>
  );
}

export function IconoUsuarios(props) {
  return (
    <Icono {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icono>
  );
}

export function IconoClinicas(props) {
  return (
    <Icono {...props}>
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <path d="M2 21h20" />
      <path d="M8 8h3M8 12h3M8 16h3" />
    </Icono>
  );
}

export function IconoRecepcion(props) {
  return (
    <Icono {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5" />
      <path d="M12 12v9" />
    </Icono>
  );
}

export function IconoFichas(props) {
  return (
    <Icono {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </Icono>
  );
}

export function IconoChecklist(props) {
  return (
    <Icono {...props}>
      <path d="M4 6h2M4 12h2M4 18h2" />
      <path d="m9 6 1.5 1.5L13 5" />
      <path d="m9 12 1.5 1.5L13 11" />
      <path d="m9 18 1.5 1.5L13 17" />
      <path d="M16 6h4M16 12h4M16 18h4" />
    </Icono>
  );
}

export function IconoInscripcion(props) {
  return (
    <Icono {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </Icono>
  );
}

export function IconoSalir(props) {
  return (
    <Icono {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Icono>
  );
}

export function IconoRestablecer(props) {
  return (
    <Icono {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </Icono>
  );
}

export function IconoBuscar(props) {
  return (
    <Icono {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icono>
  );
}

export function IconoChevronDerecha(props) {
  return (
    <Icono {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icono>
  );
}

export function IconoChevronAbajo(props) {
  return (
    <Icono {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icono>
  );
}

export function IconoAlerta(props) {
  return (
    <Icono {...props}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Icono>
  );
}

export function IconoCheckCircle(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icono>
  );
}

export function IconoInfo(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icono>
  );
}

export function IconoXCircle(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </Icono>
  );
}

export function IconoTelefono(props) {
  return (
    <Icono {...props}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </Icono>
  );
}

export function IconoEscudo(props) {
  return (
    <Icono {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </Icono>
  );
}

export function IconoMonitor(props) {
  return (
    <Icono {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icono>
  );
}

export function IconoCalendario(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </Icono>
  );
}

export function IconoHerramienta(props) {
  return (
    <Icono {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2.5-2.5 2.3-3.3Z" />
    </Icono>
  );
}

export function IconoFlechaIzquierda(props) {
  return (
    <Icono {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Icono>
  );
}

export function IconoMas(props) {
  return (
    <Icono {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icono>
  );
}

export function IconoBasura(props) {
  return (
    <Icono {...props}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Icono>
  );
}

export function IconoFiltro(props) {
  return (
    <Icono {...props}>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
    </Icono>
  );
}

export function IconoBloqueado(props) {
  return (
    <Icono {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Icono>
  );
}

export function IconoDocumento(props) {
  return (
    <Icono {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </Icono>
  );
}

export function IconoCheck(props) {
  return (
    <Icono {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icono>
  );
}
