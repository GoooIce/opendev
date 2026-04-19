import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildSystemPrompt } from "@/lib/ai/chat-prompt";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, context } = body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    context?: { nitrogenLevel?: string };
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return mockStreamResponse(messages);
  }

  const systemPrompt = buildSystemPrompt({
    nitrogenLevel: context?.nitrogenLevel,
  });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

function mockStreamResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  const userMsg = messages.filter((m) => m.role === "user").pop()?.content ?? "";

  let response: string;

  if (userMsg.includes("基因") || userMsg.includes("gene")) {
    response =
      "根据平台数据分析，当前候选基因库中有50个氮相关基因。其中排名最高的是 *ZmNRT2.1*（硝酸盐转运蛋白），综合得分95分，具有GWAS显著信号（p=1.2e-9）和低氮条件下强差异表达（FC=4.2）的双重证据支持。\n\n建议重点关注以下高置信度基因：\n1. *ZmNRT2.1* — 氮吸收核心转运蛋白\n2. *ZmNLP5* — NIN-like转录调控因子\n3. *ZmAMT1.3* — 铵转运蛋白\n\n这些基因构成氮高效的核心调控网络。";
  } else if (userMsg.includes("GWAS") || userMsg.includes("曼哈顿")) {
    response =
      "GWAS分析共检测到约10,000个SNP位点，其中156个达到基因组显著性阈值（p<5e-8）。\n\n主要发现：\n- **Chr5** 上的主效位点群靠近 *ZmNRT2.1*，解释约12%的表型变异\n- **Chr8** 上的信号与 *ZmAMT1.3* 连锁，在多环境下稳定\n- **Chr2** 上发现一个新的氮利用效率QTL区域\n\n建议对这些热点区域进行精细定位和候选基因验证。";
  } else if (userMsg.includes("实验") || userMsg.includes("设计") || userMsg.includes("验证")) {
    response =
      "针对当前高分候选基因，建议以下验证策略：\n\n1. **CRISPR敲除实验**\n   - 目标: *ZmNRT2.1*, *ZmNLP5*\n   - 预期: 敲除后低氮条件下根系发育和氮吸收显著下降\n\n2. **过表达验证**\n   - 在B73和郑单958背景中过表达 *ZmNRT2.1*\n   - 评估低氮耐受性和产量表现\n\n3. **表达模式分析**\n   - RT-qPCR验证组织特异性和氮响应时序\n   - GUS报告基因定位表达部位\n\n平台CRISPR模块已记录12个编辑事件，可参考已有数据。";
  } else if (userMsg.includes("通路") || userMsg.includes("代谢")) {
    response =
      "氮代谢通路涉及以下关键环节：\n\n1. **氮吸收** — *ZmNRT2*家族（硝酸盐）和 *ZmAMT*家族（铵）\n2. **氮还原** — 硝酸盐还原酶（NR）和亚硝酸盐还原酶（NiR）\n3. **氮同化** — GS/GOGAT循环（*ZmGS1.4*为关键节点）\n4. **氮转运** — 氨基酸转运蛋白家族\n5. **氮信号** — NLP转录因子（*ZmNLP5*）调控级联\n\n共表达网络显示turquoise模块富集了上述1-3步的基因，形成紧密的协同表达网络。";
  } else {
    response =
      "您好！我是玉米氮高效基因挖掘平台的AI科研助手。我可以帮助您：\n\n- **基因功能解读** — 分析候选基因的多重组学证据\n- **GWAS结果解读** — 解释曼哈顿图中的显著信号\n- **实验设计建议** — 为功能验证提供实验方案\n- **通路分析** — 氮代谢通路的基因调控关系\n\n请问您想了解什么？您可以选中一个基因后向我提问，我会结合该基因的具体数据进行分析。";
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = response.split(/(?<=。|\n)/);
      for (const chunk of chunks) {
        if (!chunk) continue;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 40));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
