/**
 * src/utils/logoBase64.js
 * Converts the Pawster logo PNG to a base64 data URL at runtime
 * so jsPDF can embed it. Vite bundles the image as a URL.
 */
import logoUrl from "../images/logo.png";

let _cached = null;

export async function getLogoBase64() {
  if (_cached) return _cached;
  try {
    const res  = await fetch(logoUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _cached = reader.result; // "data:image/png;base64,..."
        resolve(_cached);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}