'use client';

import { useEffect, useState } from "react";

type GarmentMediaProps = {
  src: string;
  alt: string;
  className: string;
  eager?: boolean;
};

type RenderState = "loading" | "ready" | "fallback";

function isLightStudioPixel(data: Uint8ClampedArray, index: number) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const brightness = (red + green + blue) / 3;
  const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
  return brightness > 142 && saturation < 78;
}

export default function GarmentMedia({ src, alt, className, eager = false }: GarmentMediaProps) {
  const [renderedPng, setRenderedPng] = useState<string | null>(null);
  const [state, setState] = useState<RenderState>("loading");

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.loading = eager ? "eager" : "lazy";

    const renderTransparentPng = () => {
      if (cancelled) return;
      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;
      if (!sourceWidth || !sourceHeight) {
        setState("fallback");
        return;
      }

      const maxWidth = 1600;
      const scale = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setState("fallback");
        return;
      }

      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      let pixels: ImageData;
      try {
        pixels = context.getImageData(0, 0, width, height);
      } catch {
        // A remote source without CORS access must remain intact rather than becoming a broken image.
        setState("fallback");
        return;
      }

      const total = width * height;
      const background = new Uint8Array(total);
      const queue = new Int32Array(total);
      let queueStart = 0;
      let queueEnd = 0;

      const addIfBackground = (pixel: number) => {
        if (!background[pixel] && isLightStudioPixel(pixels.data, pixel * 4)) {
          background[pixel] = 1;
          queue[queueEnd] = pixel;
          queueEnd += 1;
        }
      };

      for (let x = 0; x < width; x += 1) {
        addIfBackground(x);
        addIfBackground((height - 1) * width + x);
      }
      for (let y = 1; y < height - 1; y += 1) {
        addIfBackground(y * width);
        addIfBackground(y * width + width - 1);
      }

      while (queueStart < queueEnd) {
        const pixel = queue[queueStart];
        queueStart += 1;
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        if (x > 0) addIfBackground(pixel - 1);
        if (x + 1 < width) addIfBackground(pixel + 1);
        if (y > 0) addIfBackground(pixel - width);
        if (y + 1 < height) addIfBackground(pixel + width);
      }

      for (let pixel = 0; pixel < total; pixel += 1) {
        const alphaIndex = pixel * 4 + 3;
        if (background[pixel]) {
          pixels.data[alphaIndex] = 0;
          continue;
        }

        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const touchesBackground =
          (x > 0 && background[pixel - 1]) ||
          (x + 1 < width && background[pixel + 1]) ||
          (y > 0 && background[pixel - width]) ||
          (y + 1 < height && background[pixel + width]);
        if (touchesBackground && isLightStudioPixel(pixels.data, pixel * 4)) {
          pixels.data[alphaIndex] = Math.min(pixels.data[alphaIndex], 110);
        }
      }

      context.putImageData(pixels, 0, 0);
      try {
        const pngDataUrl = canvas.toDataURL("image/png");
        if (cancelled) return;
        setRenderedPng(pngDataUrl);
        setState("ready");
      } catch {
        setState("fallback");
      }
    };

    image.onload = renderTransparentPng;
    image.onerror = () => {
      if (!cancelled) setState("fallback");
    };
    image.src = src;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [eager, src]);

  if (state === "fallback") {
    return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} />;
  }

  if (!renderedPng) {
    return <span className={`${className} block animate-pulse bg-white/[0.02]`} role="img" aria-label={alt} aria-busy="true" />;
  }

  return <img src={renderedPng} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} data-garment-png="runtime-generated" />;
}
