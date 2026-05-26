/**
 * x402 client wrapper.
 *
 * The official SDK is `goatx402-sdk-server` (npm) but it's not pinned in package.json
 * yet — we wrap a fetch-based call so the project compiles without the SDK installed.
 * Swap `triggerPayment` for the SDK call once we have merchant credentials.
 *
 * Docs: https://docs.goat.network/docs/build/x402/developer-quickstart
 */

type X402Env = {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  merchantId: string;
};

function readEnv(): X402Env | null {
  const apiUrl = process.env.GOATX402_API_URL;
  const apiKey = process.env.GOATX402_API_KEY;
  const apiSecret = process.env.GOATX402_API_SECRET;
  const merchantId = process.env.GOATX402_MERCHANT_ID;
  if (!apiUrl || !apiKey || !apiSecret || !merchantId) return null;
  return { apiUrl, apiKey, apiSecret, merchantId };
}

export type X402Charge = {
  findingId: string;
  amountUsdc: string;
  payerWallet: `0x${string}`;
  receivingWallet: `0x${string}`;
  description: string;
};

export type X402Result = {
  paymentId: string;
  status: "pending" | "succeeded" | "failed";
  txHash: string | null;
  explorerUrl: string | null;
};

export async function triggerPayment(charge: X402Charge): Promise<X402Result> {
  const env = readEnv();

  if (!env) {
    // No credentials yet — return a stub so the rest of the pipeline can run.
    return {
      paymentId: `mock-${charge.findingId}`,
      status: "pending",
      txHash: null,
      explorerUrl: null
    };
  }

  const res = await fetch(`${env.apiUrl}/v1/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": env.apiKey,
      "X-Merchant-Id": env.merchantId
    },
    body: JSON.stringify({
      amount: charge.amountUsdc,
      symbol: "USDC",
      chainId: 2345,
      payer: charge.payerWallet,
      receiver: charge.receivingWallet,
      metadata: {
        findingId: charge.findingId,
        description: charge.description
      }
    })
  });

  if (!res.ok) {
    throw new Error(`x402 charge failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as {
    paymentId: string;
    status: X402Result["status"];
    txHash?: string;
  };

  return {
    paymentId: body.paymentId,
    status: body.status,
    txHash: body.txHash ?? null,
    explorerUrl: body.txHash ? `https://explorer.goat.network/tx/${body.txHash}` : null
  };
}

export function hasX402Configured() {
  return readEnv() !== null;
}
