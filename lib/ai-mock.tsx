"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const mockResponses: Record<string, string> = {
  "粮食": `根据2024年最新数据，全国粮食总产量达到 **14,130亿斤**，同比增长1.6%，首次突破1.4万亿斤新台阶。\n\n主要特点：\n- 连续11年稳定在1.3万亿斤以上\n- 稻谷产量20,754万吨，小麦14,010万吨\n- 玉米产量29,492万吨，为第一大粮食品种\n- 粮食单产达395公斤/亩，持续提升`,
  "高标准": `截至2024年底，全国高标准农田累计建成 **超10亿亩**。\n\n建设进度：\n- 2020年：约8亿亩\n- 2023年：突破10亿亩\n- 2030年目标：13.5亿亩\n- 2035年目标：15.46亿亩（永久基本农田全覆盖）\n\n高标准农田亩均增产约100公斤，节水20%-30%。`,
  "智慧": `智慧农业发展势头强劲：\n\n- 农业无人机保有量：**30万架**，年作业面积4.6亿亩\n- 北斗农机：超过6万台\n- 农业生产信息化率：约27%，2026年目标30%\n- 农业科技进步贡献率：超64%\n- 综合机械化率：75.64%\n\n"人工智能+农业"加快布局，智慧农业大模型不断迭代。`,
  "电商": `2024年农产品网络零售额达 **6,798亿元**，同比增长15.8%。\n\n趋势：\n- 2020年：4,159亿元\n- 2022年：5,314亿元\n- 2024年：6,798亿元\n\n农产品物流总额连续多年超5万亿元，物流费率从18%降至14.1%。`,
  "灌溉": `灌溉效率持续提升：\n\n- 节水灌溉面积：**6.38亿亩**\n- 农田灌溉水有效利用系数：**0.580**\n- 较"十四五"初期提升显著\n- 农业用水总量基本稳定，效率持续提高`,
};

function getMockResponse(question: string): string {
  for (const [key, response] of Object.entries(mockResponses)) {
    if (question.includes(key)) return response;
  }
  return `感谢您的提问。根据当前数据：\n\n2024年全国粮食总产量14,130亿斤，播种面积17.90亿亩，耕地面积19.4亿亩，综合机械化率75.64%。农业及相关产业增加值达20.6万亿元，占GDP的15.29%。\n\n如需了解更多细分数据，请具体提问。`;
}

const quickQuestions = [
  "今年粮食产量如何？",
  "高标准农田建设进度",
  "智慧农业发展现状",
  "电商交易趋势",
  "灌溉效率数据",
];

export default function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "您好！我是 AI 农业分析助手。您可以向我提问关于农业数据的问题，例如：\n- 粮食产量趋势\n- 高标准农田建设进度\n- 智慧农业发展现状",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || typing) return;

      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);

      // Simulate streaming
      const response = getMockResponse(text);
      let i = 0;
      const id = setInterval(() => {
        i += 2;
        if (i >= response.length) {
          clearInterval(id);
          setMessages((prev) => [...prev, { role: "assistant", content: response }]);
          setTyping(false);
        } else {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role === "assistant" && typing) {
              next[next.length - 1] = { ...last, content: response.slice(0, i) };
            } else {
              next.push({ role: "assistant", content: response.slice(0, i) });
            }
            return next;
          });
        }
      }, 20);
    },
    [typing]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          bottom: "2vh",
          right: "2vw",
          width: "clamp(44px, 3vw, 56px)",
          height: "clamp(44px, 3vw, 56px)",
          background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
          display: open ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "clamp(20px, 1.5vw, 28px)",
          border: "none",
          cursor: "pointer",
        }}
      >
        🤖
      </button>

      {/* Chat panel */}
      <div
        className="fixed z-50 rounded-lg shadow-2xl flex flex-col transition-all duration-300"
        style={{
          bottom: "2vh",
          right: "2vw",
          width: "clamp(300px, 22vw, 380px)",
          height: "clamp(400px, 50vh, 520px)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-glow)",
          transform: open ? "scale(1)" : "scale(0)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transformOrigin: "bottom right",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <span style={{ fontSize: "clamp(12px, 0.8vw, 16px)", color: "var(--color-primary)", fontWeight: 600 }}>
            AI 农业分析助手
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ color: "var(--text-secondary)", fontSize: 16, cursor: "pointer", background: "none", border: "none" }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="rounded-lg px-3 py-2 max-w-[85%]"
                style={{
                  background: msg.role === "user" ? "rgba(29,185,84,0.2)" : "rgba(13,33,55,0.9)",
                  border: `1px solid ${msg.role === "user" ? "var(--border-glow)" : "var(--border-color)"}`,
                  fontSize: "clamp(10px, 0.6vw, 13px)",
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex gap-1 px-3 py-2" style={{ background: "rgba(13,33,55,0.9)", borderRadius: 8 }}>
                <span className="animate-bounce" style={{ fontSize: 8, color: "var(--color-primary)" }}>●</span>
                <span className="animate-bounce" style={{ fontSize: 8, color: "var(--color-primary)", animationDelay: "0.1s" }}>●</span>
                <span className="animate-bounce" style={{ fontSize: 8, color: "var(--color-primary)", animationDelay: "0.2s" }}>●</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick questions */}
        <div className="flex gap-1 px-3 py-1 overflow-x-auto" style={{ borderTop: "1px solid var(--border-color)" }}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="whitespace-nowrap px-2 py-1 rounded shrink-0"
              style={{
                fontSize: "clamp(8px, 0.45vw, 10px)",
                color: "var(--color-primary)",
                background: "rgba(29,185,84,0.08)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 p-2" style={{ borderTop: "1px solid var(--border-color)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="输入您的问题..."
            className="flex-1 px-2 py-1 rounded outline-none"
            style={{
              fontSize: "clamp(10px, 0.6vw, 13px)",
              background: "rgba(13,33,55,0.8)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            className="px-3 py-1 rounded"
            style={{
              fontSize: "clamp(10px, 0.6vw, 13px)",
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            发送
          </button>
        </div>
      </div>
    </>
  );
}
