import { NextResponse } from 'next/server'; 

export async function GET() { return NextResponse.json({ message: 'Hello World!' }); }

export async function POST() {
  // 设置事件流响应头
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  // 创建响应流编码器
  const encoder = new TextEncoder();
  
  // 创建响应流
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 模拟发送200个数据
        for (let i = 0; i < 200; i++) {
          // 创建带时间戳的ID
          const timestamp = Date.now();
          const id = `chatcmpl-chatcmpl-da3e566ef19a6320af96cad3eb0ee34e-${timestamp}`;
          
          // 构建消息数据
          const message = {
            id,
            object: "chat.completion.chunk",
            created: Math.floor(timestamp / 1000),
            model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0-thinking",
            choices: [
              {
                index: 0,
                delta: {
                  content: "抱歉，我暂时无法回答您的问题。后端服务返回了空响应，可能正在维护或遇到了技术问题。请稍后再试。"
                },
                finish_reason: null
              }
            ]
          };
          
          // 按SSE格式发送数据
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
          
          // 添加延迟以模拟实时发送
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // 发送完成后关闭流
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  // 返回流式响应
  return new Response(stream, { headers });
}
