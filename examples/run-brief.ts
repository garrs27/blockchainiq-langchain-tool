// One working paid call through the LangChain tool.
// Usage: AGENT_PRIVATE_KEY=0x… npm run example:brief
import { BlockchainIQBriefTool } from "../src/index.js";

const tool = new BlockchainIQBriefTool();
const out = await tool.invoke("");
console.log(out);
