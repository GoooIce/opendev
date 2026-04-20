"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePlatformStore } from "@/store/platform-store";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "您好！我是玉米氮高效基因挖掘平台的AI科研助手。可以协助基因功能解读、GWAS分析、实验设计等。请提问或选中一个基因后向我咨询。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { selectedGene, nitrogenLevel } = usePlatformStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "",
      };

      setMessages([...updatedMessages, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            context: { nitrogenLevel },
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new Error("Chat request failed");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: accumulated }
                : m
            )
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "请求失败，请稍后重试。" }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, isLoading, nitrogenLevel]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt: string) => {
    let fullPrompt = prompt;
    if (selectedGene) {
      fullPrompt += `（当前选中基因: ${selectedGene.name}）`;
    }
    sendMessage(fullPrompt);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="AI 科研助手"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10000,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "#1DB954",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(29,185,84,0.3)",
          transition: "transform 0.2s",
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>
          {isOpen ? "✕" : "🤖"}
        </span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 84,
            right: 24,
            zIndex: 9999,
            width: 380,
            height: 520,
            border: "1px solid rgba(29,185,84,0.2)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(29,185,84,0.1)",
            animation: "chatPanelIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            background: "#0A1628",
          }}
        >
          {/* Background image */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/ai.png)",
            backgroundSize: "180px",
            backgroundPosition: "center 70%",
            backgroundRepeat: "no-repeat",
            opacity: 0.06,
            pointerEvents: "none",
          }} />
          {/* Header */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(29,185,84,0.15)",
              background: "rgba(13,33,55,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#E8ECF1",
                  textShadow: "0 0 10px rgba(29,185,84,0.3)",
                  margin: 0,
                }}
              >
                AI 科研助手
              </h3>
              {selectedGene && (
                <span
                  style={{
                    fontSize: 10,
                    color: "#1DB954",
                    background: "rgba(29,185,84,0.1)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    fontStyle: "italic",
                  }}
                >
                  {selectedGene.name}
                </span>
              )}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: isLoading ? "#F0A500" : "#1DB954",
                }}
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#8B9BB4",
                cursor: "pointer",
                fontSize: 16,
                padding: "2px 6px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick actions */}
          <div
            style={{
              position: "relative",
              display: "flex",
              gap: 6,
              padding: "8px 16px",
              flexWrap: "wrap",
              borderBottom: "1px solid rgba(29,185,84,0.08)",
            }}
          >
            {[
              { label: "基因解读", prompt: "请解读当前基因的功能和证据" },
              { label: "GWAS分析", prompt: "请分析GWAS曼哈顿图中的显著信号" },
              { label: "实验设计", prompt: "请为当前基因设计功能验证实验" },
              { label: "通路分析", prompt: "请分析氮代谢通路中的基因调控关系" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  border: "1px solid rgba(29,185,84,0.2)",
                  borderRadius: 4,
                  background: "rgba(29,185,84,0.05)",
                  color: "#1DB954",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              position: "relative",
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              scrollbarWidth: "thin",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: 8,
                  padding: "6px 8px",
                  borderRadius: 6,
                  background:
                    msg.role === "user"
                      ? "rgba(29,185,84,0.08)"
                      : "rgba(13,33,55,0.4)",
                  borderLeft:
                    msg.role === "user"
                      ? "2px solid #1DB954"
                      : "2px solid #F0A500",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: msg.role === "user" ? "#1DB954" : "#F0A500",
                    fontWeight: 600,
                  }}
                >
                  {msg.role === "user" ? "你" : "AI"}
                </span>
                <p
                  style={{
                    fontSize: 12,
                    color: "#E8ECF1",
                    lineHeight: 1.6,
                    marginTop: 2,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content || (isLoading && msg.role === "assistant" ? "思考中..." : "")}
                </p>
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              position: "relative",
              display: "flex",
              gap: 8,
              padding: "12px 16px",
              borderTop: "1px solid rgba(29,185,84,0.15)",
              background: "rgba(13,33,55,0.5)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "等待回复..." : "输入问题..."}
              disabled={isLoading}
              style={{
                flex: 1,
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid rgba(29,185,84,0.2)",
                background: "rgba(13,33,55,0.6)",
                color: "#E8ECF1",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                fontSize: 13,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background:
                  isLoading || !input.trim()
                    ? "rgba(29,185,84,0.2)"
                    : "#1DB954",
                color: isLoading ? "#8B9BB4" : "#0A1628",
                cursor:
                  isLoading || !input.trim() ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              发送
            </button>
          </form>
        </div>
      )}
    </>
  );
}
