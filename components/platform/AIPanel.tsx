"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePlatformStore } from "@/store/platform-store";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIPanel() {
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
    <div
      className="data-card flex-1 p-[0.6vw] flex flex-col fade-in-up"
      style={{ animationDelay: "0.25s" }}
    >
      <div className="flex items-center justify-between">
        <h3
          className="glow-text font-bold"
          style={{ fontSize: "clamp(10px, 0.75vw, 14px)" }}
        >
          AI 科研助手
        </h3>
        <div className="flex items-center gap-[0.3vw]">
          {selectedGene && (
            <span
              style={{
                fontSize: "clamp(6px, 0.35vw, 8px)",
                color: "var(--color-primary)",
                background: "rgba(29,185,84,0.1)",
                padding: "0 0.2vw",
                borderRadius: "2px",
                fontStyle: "italic",
              }}
            >
              {selectedGene.name}
            </span>
          )}
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: isLoading ? "var(--color-accent)" : "var(--color-primary)",
              animation: isLoading ? "pulse 1s infinite" : "none",
            }}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div
        className="flex gap-[0.15vw] mt-[0.2vh] flex-wrap"
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
              fontSize: "clamp(6px, 0.35vw, 8px)",
              padding: "0.1vh 0.3vw",
              border: "1px solid rgba(29,185,84,0.2)",
              borderRadius: "2px",
              background: "rgba(29,185,84,0.05)",
              color: "var(--color-primary)",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.5 : 0.8,
              transition: "all 0.2s",
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto mt-[0.3vh]"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "0.3vh",
              padding: "0.25vh 0.3vw",
              borderRadius: "3px",
              background:
                msg.role === "user"
                  ? "rgba(29,185,84,0.08)"
                  : "transparent",
              borderLeft:
                msg.role === "user"
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
            }}
          >
            <span
              style={{
                fontSize: "clamp(5px, 0.3vw, 7px)",
                color: msg.role === "user" ? "var(--color-primary)" : "var(--color-accent)",
                fontWeight: 600,
              }}
            >
              {msg.role === "user" ? "你" : "AI"}
            </span>
            <p
              style={{
                fontSize: "clamp(6px, 0.38vw, 9px)",
                color: "var(--text-primary)",
                lineHeight: 1.5,
                marginTop: "0.05vh",
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
        className="flex items-center gap-[0.2vw] mt-[0.2vh]"
        style={{ flexShrink: 0 }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "等待回复..." : "输入问题..."}
          disabled={isLoading}
          style={{
            flex: 1,
            fontSize: "clamp(7px, 0.4vw, 9px)",
            padding: "0.3vh 0.4vw",
            borderRadius: "3px",
            border: "1px solid rgba(29,185,84,0.2)",
            background: "rgba(13,33,55,0.6)",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            fontSize: "clamp(7px, 0.4vw, 9px)",
            padding: "0.3vh 0.4vw",
            borderRadius: "3px",
            border: "none",
            background:
              isLoading || !input.trim()
                ? "rgba(29,185,84,0.2)"
                : "var(--color-primary)",
            color: isLoading ? "var(--text-secondary)" : "#0A1628",
            cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: 600,
            transition: "all 0.2s",
          }}
        >
          发送
        </button>
      </form>

      <div className="corner-decoration top-left" />
      <div className="corner-decoration bottom-right" />
    </div>
  );
}
