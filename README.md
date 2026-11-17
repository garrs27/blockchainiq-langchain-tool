# blockchainiq-langchain-tool

LangChain tools for the [Blockchain IQ](https://www.blockchainiq.co/agents) x402
pay-per-call crypto data API. No account, no API key: each tool call pays its
own price in USDC on Base through the open
[x402](https://www.x402.org) standard (HTTP 402 → pay → retry), gasless for
the payer.

Built for the
[Blockchain IQ x402 Build Bounties](https://blockchainiq.co/blog/x402-build-bounties)
(LangChain slot).

## Tools

| Tool | LangChain class | Endpoint | Price |
| --- | --- | --- | --- |
| `blockchainiq_market_brief` | `BlockchainIQBriefTool` (`Tool`) | `GET /api/x402/v1/brief` | $0.01 |
| `blockchainiq_event_risk` | `BlockchainIQEventRiskTool` (`StructuredTool`) | `GET /api/x402/v1/event-risk` | $0.05 |

Both tools return the API's JSON **plus the x402 settlement proof** decoded
from the `PAYMENT-RESPONSE` header (transaction hash, network, payer), so an
agent can audit exactly what it paid for each call.

## Install

```bash
npm install blockchainiq-langchain-tool
# or, from this repository:
npm install
```

## Setup

One environment variable — a **dedicated** wallet holding a little USDC on
Base (settlement is gasless for the payer; never use a main wallet):

```bash
export AGENT_PRIVATE_KEY=0x…   # see .env.example
```

A built-in spend control refuses any single call above $0.10 by default
(configurable in `createBiqPayFetch` / `biqGet`).

## Usage with a LangChain agent

```ts
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  BlockchainIQBriefTool,
  BlockchainIQEventRiskTool,
} from "blockchainiq-langchain-tool";

const tools = [new BlockchainIQBriefTool(), new BlockchainIQEventRiskTool()];

const agent = createToolCallingAgent({
  llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
  tools,
  prompt: ChatPromptTemplate.fromMessages([
    ["system", "You are a trading-desk assistant. Check the market brief and event risk before answering."],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]),
});
const executor = new AgentExecutor({ agent, tools });
console.log(await executor.invoke({ input: "What is the market backdrop today?" }));
```

## Run the examples (real paid calls)

```bash
AGENT_PRIVATE_KEY=0x… npm run example:brief       # $0.01 paid call to /brief
AGENT_PRIVATE_KEY=0x… npm run example:event-risk  # $0.05 paid call to /event-risk
```

Example output (brief, abridged):

```json
{
  "brief": { "…": "BTC, ETH, SOL, XRP prices, 48h events, risk flags" },
  "settlement": {
    "success": true,
    "transaction": "0x…",
    "network": "eip155:8453",
    "payer": "0x…"
  }
}
```

## Verified paid call

See [PROOF.md](./PROOF.md) for a real settlement transaction produced by
`examples/run-brief.ts` from this repository.

## How it works

`src/client.ts` wraps `fetch` with `@x402/fetch`'s `wrapFetchWithPayment`
and an `ExactEvmScheme` signer (`@x402/evm`). The first request receives
HTTP 402 with a `PAYMENT-REQUIRED` header; the wrapper signs a USDC payment
for exactly that amount and retries. A 404 or error response is never
charged by the API.

## License

MIT
