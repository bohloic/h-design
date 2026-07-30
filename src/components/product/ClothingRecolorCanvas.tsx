import React, { useRef, useEffect, useState, useCallback } from "react";

const hexToRgb = (hex: string): { r: number; g: number; b: number } => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number =>
  Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

const luminance = (r: number, g: number, b: number): number =>
  (r * 0.299 + g * 0.587 + b * 0.114) / 255;

interface Props {
  src: string;
  targetHex: string;
  enabled: boolean;
  onReady?: (success: boolean) => void;
  className?: string;
  alt?: string;
}

const ClothingRecolorCanvas: React.FC<Props> = ({ src, targetHex, enabled, onReady, className = "", alt = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  const recolor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src || !enabled) { setVisible(false); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const W = img.naturalWidth || 800;
      const H = img.naturalHeight || 800;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(img, 0, 0, W, H);

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, W, H);
      } catch {
        setVisible(false);
        onReady?.(false);
        return;
      }

      const data = imageData.data;
      const samplePx = Math.max(5, Math.min(30, Math.floor(Math.min(W, H) * 0.08)));
      let sr = 0, sg = 0, sb = 0, count = 0;

      for (let sy = 0; sy < samplePx; sy++) {
        for (let sx = 0; sx < samplePx; sx++) {
          const corners: [number, number][] = [
            [sx, sy], [W - 1 - sx, sy], [sx, H - 1 - sy], [W - 1 - sx, H - 1 - sy]
          ];
          for (const [cx, cy] of corners) {
            const idx = (cy * W + cx) * 4;
            if (data[idx + 3] < 10) continue;
            sr += data[idx]; sg += data[idx + 1]; sb += data[idx + 2]; count++;
          }
        }
      }

      const bgR = count > 0 ? Math.round(sr / count) : 240;
      const bgG = count > 0 ? Math.round(sg / count) : 240;
      const bgB = count > 0 ? Math.round(sb / count) : 240;
      const bgLum = luminance(bgR, bgG, bgB);
      const TOLERANCE = bgLum > 0.7 ? 50 : 65;

      const target = hexToRgb(targetHex);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 10) continue;
        const dist = colorDist(r, g, b, bgR, bgG, bgB);
        if (dist <= TOLERANCE) continue;
        const lum = luminance(r, g, b);
        const boost = 1.65;
        data[i]     = Math.min(255, Math.round(target.r * lum * boost));
        data[i + 1] = Math.min(255, Math.round(target.g * lum * boost));
        data[i + 2] = Math.min(255, Math.round(target.b * lum * boost));
      }

      ctx.putImageData(imageData, 0, 0);
      setVisible(true);
      onReady?.(true);
    };

    img.onerror = () => { setVisible(false); onReady?.(false); };

    const corsUrl = src.includes("res.cloudinary.com") && !src.includes("fl_immutable_cache")
      ? src.replace("/upload/", "/upload/fl_immutable_cache/")
      : src;
    img.src = corsUrl;
  }, [src, targetHex, enabled, onReady]);

  useEffect(() => {
    if (!enabled) { setVisible(false); return; }
    const timer = setTimeout(recolor, 80);
    return () => clearTimeout(timer);
  }, [recolor, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: visible ? "block" : "none", width: "100%", height: "100%", objectFit: "contain" }}
      aria-label={alt}
    />
  );
};

export default ClothingRecolorCanvas;
