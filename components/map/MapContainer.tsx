"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { provinceData, type ProvinceData } from "@/data/province-data";

export default function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [popup, setPopup] = useState<ProvinceData | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [104.5, 35.5],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 8,
      attributionControl: false,
      scrollZoom: true,
      dragRotate: false,
      pitch: 0,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      const style = map.getStyle();
      for (const layer of style.layers) {
        if (layer.type === "symbol") {
          try {
            map.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name:zh"],
              ["get", "name_zh"],
              ["get", "name:zh-Hans"],
              ["get", "name"],
            ]);
          } catch {
            // skip layers that don't support text-field
          }
        }
      }

      const maxYield = Math.max(...provinceData.map((p) => p.grainYield));

      map.addSource("provinces", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: provinceData.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: { ...p, normalizedYield: p.grainYield / maxYield },
          })),
        },
      });

      map.addLayer({
        id: "province-glow",
        type: "circle",
        source: "provinces",
        paint: {
          "circle-radius": ["/", ["get", "grainYield"], 200],
          "circle-color": "rgba(29, 185, 84, 0.15)",
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "province-circles",
        type: "circle",
        source: "provinces",
        paint: {
          "circle-radius": ["/", ["get", "grainYield"], 400],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "normalizedYield"],
            0, "rgba(29, 185, 84, 0.3)",
            0.5, "rgba(29, 185, 84, 0.6)",
            1, "rgba(240, 165, 0, 0.7)",
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(29, 185, 84, 0.5)",
        },
      });

      map.on("click", "province-circles", (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties as unknown as ProvinceData;
          setPopup(props);
          setPopupPos({ x: e.point.x, y: e.point.y });
        }
      });

      map.on("mousemove", "province-circles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "province-circles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const closePopup = useCallback(() => setPopup(null), []);

  return (
    <div className="data-card w-full h-full relative overflow-hidden">
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {popup && (
        <div
          className="absolute z-10 p-[0.6vw] rounded"
          style={{
            left: Math.min(popupPos.x, (mapRef.current?.offsetWidth ?? 300) - 180),
            top: Math.max(popupPos.y - 160, 10),
            background: "rgba(13, 33, 55, 0.95)",
            border: "1px solid var(--border-glow)",
            minWidth: "160px",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={closePopup}
            className="absolute top-1 right-2"
            style={{ color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}
          >
            ×
          </button>
          <h4 style={{ fontSize: "clamp(12px, 0.8vw, 16px)", color: "var(--color-accent)", fontWeight: 600 }}>
            {popup.name}
          </h4>
          <div className="mt-[0.3vw] space-y-[0.15vw]" style={{ fontSize: "clamp(9px, 0.5vw, 11px)" }}>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>粮食产量</span>
              <span style={{ color: "var(--text-primary)" }}>{popup.grainYield.toLocaleString()} 万吨</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>播种面积</span>
              <span style={{ color: "var(--text-primary)" }}>{popup.sowArea.toLocaleString()} 千公顷</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>高标准农田</span>
              <span style={{ color: "var(--text-primary)" }}>{popup.highStandardFarmland} 万亩</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-secondary)" }}>机械化率</span>
              <span style={{ color: "var(--color-primary)" }}>{popup.mechanizationRate}%</span>
            </div>
          </div>
        </div>
      )}
      <div className="corner-decoration top-left" />
      <div className="corner-decoration top-right" />
      <div className="corner-decoration bottom-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
