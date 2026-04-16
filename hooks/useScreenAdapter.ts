"use client";

import { useState, useEffect, useCallback } from "react";

interface ScreenInfo {
  width: number;
  height: number;
  ratio: number;
  aspectRatio: "ultra-wide" | "standard" | "wide" | "traditional";
  scale: number;
  isUltraWide: boolean;
  isTraditional: boolean;
}

function getAspectRatio(w: number, h: number): ScreenInfo["aspectRatio"] {
  const ratio = w / h;
  if (ratio >= 19 / 6) return "ultra-wide";
  if (ratio >= 21 / 9) return "wide";
  if (ratio >= 16 / 9) return "standard";
  return "traditional";
}

export function useScreenAdapter(designWidth = 1920, designHeight = 1080): ScreenInfo {
  const getInfo = useCallback((): ScreenInfo => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scaleX = width / designWidth;
    const scaleY = height / designHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      width,
      height,
      ratio: width / height,
      aspectRatio: getAspectRatio(width, height),
      scale,
      isUltraWide: width / height >= 19 / 6,
      isTraditional: width / height <= 4 / 3,
    };
  }, [designWidth, designHeight]);

  const [screen, setScreen] = useState<ScreenInfo>({
    width: 1920,
    height: 1080,
    ratio: 16 / 9,
    aspectRatio: "standard",
    scale: 1,
    isUltraWide: false,
    isTraditional: false,
  });

  useEffect(() => {
    setScreen(getInfo());

    const handleResize = () => setScreen(getInfo());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getInfo]);

  return screen;
}
