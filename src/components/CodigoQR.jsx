import { cx } from "./ui/cx.js";

// Recuadro blanco con la imagen del QR (o un marcador mientras se genera)
export default function CodigoQR({ imagen, alt, className = "" }) {
  return (
    <div
      className={cx(
        "mx-auto w-full rounded-control border border-neutral-200 bg-white p-3 shadow-sm",
        className,
      )}
    >
      {imagen ? (
        <img src={imagen} alt={alt} className="aspect-square w-full" />
      ) : (
        <div className="aspect-square w-full animate-pulse rounded bg-neutral-100" />
      )}
    </div>
  );
}
