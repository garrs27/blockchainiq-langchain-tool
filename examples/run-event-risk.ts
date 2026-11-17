// One working paid call through the LangChain structured tool ($0.05).
// Usage: AGENT_PRIVATE_KEY=0x… npm run example:event-risk
import { BlockchainIQEventRiskTool } from "../src/index.js";

const tool = new BlockchainIQEventRiskTool();
const out = await tool.invoke({ days: 7, minImportance: 2 });
console.log(out);
