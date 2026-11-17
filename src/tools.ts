import { Tool, StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { biqGet } from "./client.js";

/**
 * LangChain tool: Blockchain IQ "Crypto Market Brief for Agents".
 *
 * One paid x402 call ($0.01 USDC on Base) to GET /api/x402/v1/brief —
 * BTC, ETH, SOL and XRP prices with 24h/7d/30d moves, scheduled macro and
 * crypto events in the next 48 hours, and short risk flags.
 *
 * The tool returns the brief JSON plus the x402 settlement proof
 * (transaction hash, network, payer) so agents can audit what they paid.
 */
export class BlockchainIQBriefTool extends Tool {
  name = "blockchainiq_market_brief";
  description =
    "Get the Blockchain IQ crypto market brief: BTC, ETH, SOL and XRP prices with 24h/7d/30d moves, macro and crypto events in the next 48 hours, and risk flags. Costs $0.01 USDC on Base per call, paid automatically via x402. Input is ignored; call with an empty string.";

  async _call(): Promise<string> {
    const { data, settlement } = await biqGet("/brief");
    return JSON.stringify({ brief: data, settlement }, null, 2);
  }
}

const eventRiskSchema = z.object({
  days: z
    .number()
    .int()
    .min(1)
    .max(90)
    .default(7)
    .describe("Look-ahead window in days (1-90, default 7)"),
  minImportance: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(1)
    .describe("Minimum importance 1-3 (default 1 = everything)"),
});

/**
 * LangChain tool: Blockchain IQ "Event Risk".
 *
 * One paid x402 call ($0.05 USDC on Base) to GET /api/x402/v1/event-risk —
 * scheduled market-moving events (CPI, FOMC, ECB, BoJ, Treasury auctions,
 * crypto/regulatory milestones) ranked by importance.
 */
export class BlockchainIQEventRiskTool extends StructuredTool<
  typeof eventRiskSchema
> {
  name = "blockchainiq_event_risk";
  description =
    "Get scheduled market-moving events for the next N days from Blockchain IQ: US data releases, FOMC/ECB/BoJ decisions, Treasury auctions and crypto milestones, each ranked by importance. Costs $0.05 USDC on Base per call, paid automatically via x402.";
  schema = eventRiskSchema;

  async _call(input: z.infer<typeof eventRiskSchema>): Promise<string> {
    const days = input?.days ?? 7;
    const minImportance = input?.minImportance ?? 1;
    const { data, settlement } = await biqGet(
      `/event-risk?days=${days}&minImportance=${minImportance}`
    );
    return JSON.stringify({ eventRisk: data, settlement }, null, 2);
  }
}
