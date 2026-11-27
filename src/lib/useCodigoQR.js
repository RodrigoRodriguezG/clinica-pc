import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Genera la imagen PNG (data URL) de un código QR para el texto dado
export function useCodigoQR(texto) {
  const [qr, setQr] = useState({ texto: "", imagen: "", error: "" });

  useEffect(() => {
    let vigente = true;
    QRCode.toDataURL(texto, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#1a1a1a", light: "#ffffff" },
    })
      .then((imagen) => vigente && setQr({ texto, imagen, error: "" }))
      .catch(
        () =>
          vigente &&
          setQr({ texto, imagen: "", error: "No se pudo generar el código QR." }),
      );
    return () => {
      vigente = false;
    };
  }, [texto]);

  // Mientras se genera el QR de un texto nuevo no se muestra el anterior
  return qr.texto === texto
    ? { imagen: qr.imagen, error: qr.error }
    : { imagen: "", error: "" };
}
