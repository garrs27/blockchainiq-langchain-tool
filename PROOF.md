# Verified paid call

This repository's example was run for real against the production
Blockchain IQ x402 API on **2026-11-18**. The call paid for itself in USDC
on Base via x402 and returned live data.

## Run

```bash
AGENT_PRIVATE_KEY=0x… npm run example:brief
```

- Endpoint: `GET https://www.blockchainiq.co/api/x402/v1/brief`
- Price paid: **$0.01 USDC** (x402, gasless EIP-3009 authorization)
- Response: live market brief JSON (BTC/ETH/SOL/XRP prices, upcoming
  macro/regulatory events, risk flags)

## Settlement proof (decoded from the PAYMENT-RESPONSE header)

```json
{
  "success": true,
  "payer": "0x73701fb8B2D544F1A8d853C1c272719E5c476d58",
  "transaction": "0xc8dd62b7a2342403c8cbb2105b3b4505d04e0b3c1f82819e1c5eb7474284342c",
  "network": "eip155:8453"
}
```

- On-chain verification: transaction receipt status `0x1` (success),
  block **58839959** on Base.
- Explorer: https://basescan.org/tx/0xc8dd62b7a2342403c8cbb2105b3b4505d04e0b3c1f82819e1c5eb7474284342c
