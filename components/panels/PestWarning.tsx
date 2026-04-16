"use client";

import { useEffect, useRef, useState } from "react";

export default function PestWarning({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(29, 185, 84, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let x = 0; x < w; x += 2) {
        const progress = x / w;
        const attenuation = Math.pow(Math.sin(progress * Math.PI), 0.5);
        const y = h / 2 + Math.sin((x / w) * Math.PI * 8 + offset) * (h / 3) * attenuation;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(29, 185, 84, 0.2)";
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const progress = x / w;
        const attenuation = Math.pow(Math.sin(progress * Math.PI), 0.5);
        const y = h / 2 + Math.sin((x / w) * Math.PI * 12 + offset * 1.3) * (h / 4) * attenuation;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += 0.08;
      requestAnimationFrame(draw);
    };
    const raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`data-card p-[0.6vw] flex flex-col h-full ${className || ""}`} style={style}>
      <h3 style={{ fontSize: "clamp(11px, 0.8vw, 16px)", color: "var(--color-primary)" }}>
        AI 病虫害预警
      </h3>

      {/* Image comparison */}
      <div className="flex gap-[0.4vw] mt-[0.3vw]">
        <div className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded"
            style={{
              height: "6vh",
              background: "linear-gradient(135deg, rgba(29,185,84,0.15), rgba(29,185,84,0.05))",
              border: "1px dashed var(--border-color)",
            }}
          />
          <span style={{ fontSize: "clamp(8px, 0.5vw, 11px)", color: "var(--text-secondary)", marginTop: 2 }}>
            样本图片
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded"
            style={{
              height: "6vh",
              background: "linear-gradient(135deg, rgba(240,165,0,0.15), rgba(240,165,0,0.05))",
              border: "1px dashed var(--border-color)",
            }}
          />
          <span style={{ fontSize: "clamp(8px, 0.5vw, 11px)", color: "var(--text-secondary)", marginTop: 2 }}>
            病虫害数据库
          </span>
        </div>
      </div>

      {/* Result bar */}
      <div
        className="mt-[0.3vw] p-[0.3vw] rounded flex items-center justify-between"
        style={{ background: "rgba(29,185,84,0.08)" }}
      >
        <span style={{ fontSize: "clamp(10px, 0.65vw, 14px)", color: "var(--color-accent)", fontWeight: 600 }}>
          稻瘟病
        </span>
        <div className="flex items-center gap-[0.3vw]">
          <div
            className="h-[4px] rounded-full"
            style={{ width: "5vw", background: "rgba(29,185,84,0.15)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "85%",
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
              }}
            />
          </div>
          <span style={{ fontSize: "clamp(9px, 0.5vw, 11px)", color: "var(--color-primary)" }}>
            85%
          </span>
        </div>
      </div>

      {/* Symptom & Prevention */}
      <div className="flex gap-[0.3vw] mt-[0.3vw] flex-1 min-h-0">
        <div className="flex-1 p-[0.3vw] rounded" style={{ background: "rgba(29,185,84,0.05)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "clamp(9px, 0.55vw, 12px)", color: "var(--color-primary)", fontWeight: 600 }}>
            症状描述
          </div>
          <p style={{ fontSize: "clamp(8px, 0.45vw, 10px)", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
            叶片出现菱形或纺锤形病斑，中央灰白色，边缘褐色，严重时叶片枯死
          </p>
        </div>
        <div className="flex-1 p-[0.3vw] rounded" style={{ background: "rgba(29,185,84,0.05)", border: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "clamp(9px, 0.55vw, 12px)", color: "var(--color-primary)", fontWeight: 600 }}>
            防治建议
          </div>
          <p style={{ fontSize: "clamp(8px, 0.45vw, 10px)", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
            选用抗病品种，合理施肥，发病初期喷施三环唑或稻瘟灵
          </p>
        </div>
      </div>

      {/* Wave animation */}
      <canvas ref={canvasRef} className="w-full mt-[0.2vw]" style={{ height: "3vh" }} />
    </div>
  );
}
