import { privateKeyToAccount } from "viem/accounts";
import {
  wrapFetchWithPayment,
  x402Client,
  decodePaymentResponseHeader,
} from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";

export const BIQ_BASE_URL = "https://www.blockchainiq.co/api/x402/v1";

export interface BiqResult<T = unknown> {
  data: T;
  /** x402 settlement proof decoded from the PAYMENT-RESPONSE header. */
  settlement: {
    success?: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  } | null;
  raw: unknown;
}

/**
 * Build a fetch that pays Blockchain IQ's HTTP 402 challenges automatically
 * in USDC on Base (x402 v2, gasless for the payer).
 *
 * The private key is read from AGENT_PRIVATE_KEY. Use a dedicated wallet
 * holding a small USDC balance on Base — never a main wallet.
 */
export function createBiqPayFetch(maxAmountPerPayment = 0.1) {
  const key = process.env.AGENT_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "AGENT_PRIVATE_KEY is not set. Provide a dedicated Base wallet private key (0x…) holding a little USDC."
    );
  }
  const account = privateKeyToAccount(key as `0x${string}`);
  const client = x402Client.fromConfig({
    schemes: [{ network: "eip155:*", client: new ExactEvmScheme(account) }],
    // Spend control: refuse any single call above this many dollars.
    // The bounty-qualifying calls cost $0.01 (brief) and $0.05 (event-risk).
    spendControls: { maxAmountPerPayment },
  });
  return wrapFetchWithPayment(fetch, client);
}

/** Perform one paid GET against the Blockchain IQ x402 API. */
export async function biqGet<T = unknown>(
  path: string,
  maxAmountPerPayment = 0.1
): Promise<BiqResult<T>> {
  const payFetch = createBiqPayFetch(maxAmountPerPayment);
  const res = await payFetch(`${BIQ_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Blockchain IQ request failed: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as { data?: T };
  const header = res.headers.get("payment-response");
  const settlement = header ? decodePaymentResponseHeader(header) : null;
  return { data: (raw?.data ?? raw) as T, settlement, raw };
}
