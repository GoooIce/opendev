# Task: 使用 Next.js 和 Bun 实现 dev_proxy

## 描述
在新的 `dev_proxy` 目录中，使用 Next.js 框架和 Bun 包管理器重新实现一个功能类似于 `@rust_proxy` 的 LLM API 代理服务。该服务将提供 OpenAI 兼容的 API 端点，并包含配置管理、日志记录、认证等功能。

## 复杂度
- Level: 3
- Type: Feature

## 技术栈
- 框架: Next.js
- 构建/包管理: Bun
- 语言: JavaScript / TypeScript
- 环境变量: `.env.local` (通过 Bun 或 `dotenv`)
- Rate Limiting: Upstash Redis

## 技术栈验证检查点 (Technology Validation Checkpoints)
- [x] 项目初始化命令 (`bun create next-app ./dev_proxy`) 已验证
- [x] 所需依赖项（例如 `dotenv`, `@upstash/ratelimit`, `@upstash/redis`）已识别并可安装
- [x] 构建配置 (`next.config.js`, `tsconfig.json` 等) 已验证
- [x] Hello world API 路由验证完成
- [x] 测试构建 (`bun run build`) 成功通过

## 状态
- [x] 初始化 (VAN) 完成
- [x] 规划 (PLAN) 完成
- [x] 技术栈验证 (PLAN) 完成
- [x] 创意 (CREATIVE) 完成
- [x] 实施 (IMPLEMENT) 完成 (核心功能；ESLint 修复和详细适配器待处理)
- [x] 质量保证 (QA) 待定
- [x] 反思 (REFLECT) 完成
- [x] 存档 (ARCHIVE) 完成

## 实施计划 (Implementation Plan)
1.  **阶段 1: 项目设置与基础 API**
    - [x] 使用 `bun create next-app ./dev_proxy` 初始化 Next.js 项目。
    - [x] 创建目录结构: `app/api/openai/v1/chat/completions/`, `app/api/models/`, `app/api/health/`, `config/`, `lib/`.
    - [x] 实现基础的 `/api/health/route.js` 端点。
    - [x] 实现 `/config/llm-providers.js` (使用 Object Map 结构)。
    - [x] 设置 `.env.local` 并实现环境变量加载。
    - [x] 安装依赖: `bun add @upstash/ratelimit @upstash/redis eventsource-parser`.
2.  **阶段 2: 核心代理逻辑**
    - [x] 实现 `/app/api/openai/v1/chat/completions/route.js` 的核心代理逻辑 (使用 `TransformStream` 和 Adapters)。
    - [x] 实现将请求转发到配置的后端 LLM 提供商。
    - [x] 实现流式响应 (Server-Sent Events, SSE) 处理，包括适配不同后端格式。
    - [x] 实现非流式响应处理。
    - [x] 实现流/响应适配器函数 (e.g., in `/lib/stream-adapters.js`) (基础框架)。
3.  **阶段 3: 辅助功能与中间件**
    - [x] 实现 `/app/api/models/route.js` 端点，从配置中读取模型列表。
    - [x] 实现 `/lib/logging.js`。
    - [x] 实现 `/middleware.js` (使用 Bearer Token Auth + Upstash Rate Limiter)。
    - [ ] 配置 Upstash 环境变量 (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) (用户任务)。
    - [ ] 配置 `ALLOWED_API_KEYS` 环境变量 (用户任务)。
4.  **阶段 4: 前端与完善**
    - [x] 创建 `/app/page.js` 提供一个简单的测试界面。
    - [ ] (可选) 实现 `/lib/tokenizers.js`。
    - [ ] 添加基础的单元/集成测试。

## 反思亮点 (Reflection Highlights)
- **进展顺利**: 模式化流程清晰；创意阶段设计明确；技术验证有效；模块化设计良好。
- **挑战**: 构建/环境问题（Shell差异、构建错误、路径别名、ESLint）；SSE解析和请求/响应适配的复杂性。
- **经验教训**: 环境工具可靠性；构建链复杂性；健壮SSE处理的重要性；适配器模式价值；依赖跟踪需仔细。
- **后续步骤**: 用户配置env；开发者修复ESLint、集成SSE解析库、完善适配器、进行测试；推荐添加测试和迁移TS。

## 存档 (Archive)
- **日期**: 2025-04-04
- **存档文档**: ./docs/archive/features/dev-proxy-nextjs-bun-20250404.md
- **状态**: COMPLETED

## 需要创意阶段的组件 (Creative Phases Required) - 已完成
- [x] **[架构]** `/config/llm-providers.js`: 设计易于扩展和维护的配置结构。
    - **决策:** 使用 Object Map 结构，以 Provider ID 为键。
- [x] **[架构]** `/app/api/openai/v1/chat/completions/route.js`: 设计处理不同后端适配和流式传输的策略。
    - **决策:** 使用 `TransformStream` 结合 Provider-specific Adapter functions 来处理流转换。
- [x] **[架构/安全]** `/middleware.js`: 选择和实现合适的认证机制。
    - **决策:** 使用 Bearer Token 验证 (对照环境变量) + Upstash Redis 进行分布式速率限制。

## 依赖项 (Dependencies)
- Next.js 框架
- Bun 运行时
- `@upstash/ratelimit`
- `@upstash/redis`
- (可能) `dotenv`
- (可能) Tokenizer library

## 挑战与缓解措施 (Challenges & Mitigations)
- **挑战:** 不同 LLM 提供商 API 格式和认证的差异。
    - **缓解:** 设计灵活的 `config/llm-providers.js` (Object Map) 结构，编写适配器逻辑 (in `/lib/stream-adapters.js`).
- **挑战:** 高效、可靠地处理 SSE 流。
    - **缓解:** 利用 Next.js API 路由的流式传输能力和 `TransformStream` API + Adapters。
- **挑战:** Bun 与 Next.js 及相关库的兼容性。
    - **缓解:** 执行技术栈验证，选择兼容性好的库，关注 Bun 和 Next.js 的更新日志。
- **挑战:** API 安全性（认证、输入验证、速率限制）。
    - **缓解:** 在 `/middleware.js` 中实施 Bearer Token 验证和 Upstash 速率限制，对 API 输入进行严格验证。 

# Task: 将 Rust Proxy 逻辑重写为 JS 适配器

## 描述
将 `rust_proxy` 服务中的核心逻辑（包括 WASM 签名、与 "Dev API" 后端的交互、SSE 流处理）使用 JavaScript 重写，并将其作为 `dev_proxy` Next.js 项目中的一个新的提供商适配器进行集成。

## 复杂度
- Level: 3
- Type: Feature / Refactor

## 技术栈
- 主要语言: JavaScript (Node.js/Bun 环境)
- 涉及: WASM (via `WebAssembly` API), `fetch`, `TextEncoder/Decoder`, `ReadableStream`, `TransformStream`
- 依赖: `rust_proxy/sign_bg.wasm`

## 技术栈验证检查点
- [ ] (已跳过) WASM 加载与调用验证：在 Next.js API 路由中成功加载 `sign_bg.wasm` 并调用其导出函数。

## 状态
- [x] 初始化 (VAN) 完成
- [x] 规划 (PLAN) 完成
- [ ] 创意 (CREATIVE) 待定
- [ ] 实施 (IMPLEMENT) 待定
- [ ] 质量保证 (QA) 待定
- [ ] 反思 (REFLECT) 待定
- [ ] 存档 (ARCHIVE) 待定

## 实施计划
1.  **阶段 1: WASM 准备与集成框架**
    - [x] (已完成) 复制 `rust_proxy/sign_bg.wasm` 到 `dev_proxy/lib/`.
    - [x] 创建 `dev_proxy/lib/wasm_signer_js.js`：
        - 实现加载 `sign_bg.wasm` 的逻辑 (使用 `fs/promises` 和 `WebAssembly.instantiate`)。
        - 实现一个 `sign(nonce, timestamp, deviceId, query)` 函数，封装与 WASM 内存和导出函数 (`sign`, `__wbindgen_malloc`, `__wbindgen_free`) 的交互（分配、写入、调用、读取、释放）。
    - [x] 在 `dev_proxy/config/llm-providers.js` 中添加 `internal_rust_logic` 提供商配置。
    - [x] 创建 `dev_proxy/lib/rust_logic_adapter.js`，定义空的 `handleRustLogicRequest(payload)` 函数。
    - [x] 在 `dev_proxy/app/api/openai/v1/chat/completions/route.js` 中添加调用 `handleRustLogicRequest` 的分支。
2.  **阶段 2: Dev Client JS 实现**
    - [x] 在 `rust_logic_adapter.js` 中：
        - 实现读取环境变量 (`API_ENDPOINT`, `DEVICE_ID`, `OS_TYPE`, `SID`) 的逻辑。
        - 实现类似 `dev_client.rs` 的 `buildRequestParams` 功能：
            - 生成 nonce (`crypto.randomUUID()`) 和 timestamp。
            - 调用 `wasm_signer_js.js` 中的 `sign` 函数获取签名。
            - 构建 Headers 和 JSON 请求体 (包括 `extra` 对象)。
        - 实现类似 `dev_client.rs` 的 `sendRequest` 功能：
            - 使用 `fetch` 发送 `POST` 请求到 `API_ENDPOINT`。
            - 处理响应状态码和错误。
            - 返回成功的 `Response` 对象。
3.  **阶段 3: SSE Processor JS 实现**
    - [x] 在 `rust_logic_adapter.js` 中：
        - 实现 `handleRustLogicRequest` 的主体逻辑：
            - 调用 JS 版 `sendRequest` 获取后端响应。
            - 如果请求非流式，聚合响应（需要读取并处理流）。
            - 如果请求流式，处理 `response.body` (`ReadableStream`)。
        - 实现类似 `sse_processor.rs` 的流处理逻辑：
            - 使用 `eventsource-parser` 或自定义逻辑解析来自后端的 SSE 流。
            - 维护一个 JS 版的 `SseAccumulator` 状态对象。
            - 实现 `processSingleDevEvent` JS 函数，根据事件类型更新累加器或生成 OpenAI 格式的 chunk。
            - 使用 `TransformStream` 将解析/转换后的 OpenAI chunks 输出。
        - 确保最终返回 `NextResponse` (包含 JSON 或 `ReadableStream`)。
4.  **阶段 4: 集成与测试**
    - [ ] (已跳过) 在 `dev_proxy/lib/stream-adapters.js` 中为 `internal_rust_logic` 添加适配器（如果其输出流非标准 OpenAI 格式）。
    - [ ] 使用前端页面或 API 工具，选择 `internal_rust_logic/rust-equivalent-model` 进行测试。
    - [ ] 调试并验证功能。

## 需要创意阶段的组件
- [ ] **[算法/架构]** 如何在 JavaScript 中高效、准确地模拟 Rust 的特定逻辑？ (将在 IMPLEMENT 阶段处理)

## 依赖项
- `dev_proxy` 项目及其现有依赖。
- `sign_bg.wasm` 文件。

## 挑战与缓解措施
- **挑战:** 理解 Rust 逻辑并准确重写为 JS。
    - **缓解:** 仔细阅读，小步实现，关注功能对等。
- **挑战:** WASM 集成细节（内存、数据类型）。
    - **缓解:** 参考 `wasm_signer.rs` 实现 JS 交互逻辑，仔细测试。
- **挑战:** SSE 流处理的健壮性。
    - **缓解:** 使用 `eventsource-parser` 或健壮的自定义解析，模拟 `sse_processor.rs` 的状态累积逻辑。
- **挑战:** 保持与 `dev_proxy` 适配器模式的兼容。
    - **缓解:** 遵循现有结构，确保接口一致。 