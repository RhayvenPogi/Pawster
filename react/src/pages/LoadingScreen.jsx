import { useEffect, useState, useRef } from "react";
import lottie from "lottie-web";
import dogAnim from "../animations/dog-running.json";

export default function LoadingScreen({ destination = "/home" }) {
  const [fading, setFading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: dogAnim,
    });
    return () => anim.destroy();
  }, []);

useEffect(() => {
  if (!destination) return;
  let mounted = true;                          // ← add this
  const t1 = setTimeout(() => {
    window.location.replace(destination);
  }, 1800);
  const t2 = setTimeout(() => {
    if (mounted) setFading(true);              // ← guard it
  }, 1400);                                    // ← also move before t1 fires
  return () => { mounted = false; clearTimeout(t1); clearTimeout(t2); };
}, [destination]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#EDDABB",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: "opacity 0.5s ease",
      opacity: fading ? 0 : 1,
      pointerEvents: "all",
    }}>
      <div ref={containerRef} style={{ width: 300, height: 300 }} />
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 900,
        color: "#1c4f09",
        fontSize: "1.1rem",
        marginTop: 0,
        letterSpacing: "0.04em",
      }}>
        Fetching your furry friends…
      </p>
    </div>
  );
}