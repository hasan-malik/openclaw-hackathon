/**
 * x402 client — direct fetch to https://api.goatx402.io with HMAC-SHA256 auth.
 * Logic ported from goatx402-sdk-server (the npm package has a broken exports
 * field that blocks CJS interop, so we inline rather than depend on it).
 *
 * Auth (per SDK signature.js):
 *   1. Build string: `key1=val1&key2=val2` (params sorted alphabetically, including
 *      api_key, timestamp, nonce).
 *   2. HMAC-SHA256 with the api_secret, hex-encoded.
 *   3. Send as X-API-Key / X-Timestamp / X-Nonce / X-Sign headers.
 *
 * Endpoint: POST /api/v1/orders → returns x402 order. Note HTTP 402 is the
 * *success* status for order creation in the x402 protocol.
 */

import { createHmac, randomUUID } from "node:crypto";
import { parseUnits } from "viem";
import { USDC_ADDRESS, GOAT_CHAIN_ID, ERC20_ABI } from "./constants";
import { walletClient, publicClient, explorerTx } from "./client";

type X402Env = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  merchantId: string;
};

function readEnv(): X402Env | null {
  const baseUrl = process.env.GOATX402_API_URL;
  const apiKey = process.env.GOATX402_API_KEY;
  const apiSecret = process.env.GOATX402_API_SECRET;
  const merchantId = process.env.GOATX402_MERCHANT_ID;
  if (!baseUrl || !apiKey || !apiSecret || !merchantId) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey, apiSecret, merchantId };
}

function signRequest(params: Record<string, unknown>, apiKey: string, apiSecret: string) {
  const str: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    str[k] = String(v);
  }
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = typeof randomUUID === "function" ? randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  str.api_key = apiKey;
  str.timestamp = timestamp;
  str.nonce = nonce;

  const sortedKeys = Object.keys(str)
    .filter((k) => str[k] !== "")
    .sort();
  const signStr = sortedKeys.map((k) => `${k}=${str[k]}`).join("&");
  const sign = createHmac("sha256", apiSecret).update(signStr).digest("hex");

  return {
    "X-API-Key": apiKey,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Sign": sign
  };
}

async function apiRequest(env: X402Env, method: "GET" | "POST", path: string, body?: Record<string, unknown>) {
  const url = `${env.baseUrl}${path}`;
  const headers = signRequest(body ?? {}, env.apiKey, env.apiSecret);
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // not JSON
  }
  // 402 is the success status for order creation in x402 protocol
  if (!res.ok && res.status !== 402) {
    const errMsg = data?.error || data?.message || text || `HTTP ${res.status}`;
    const err = new Error(errMsg) as Error & { status?: number; body?: string };
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return { data, status: res.status, raw: text };
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
  orderUrl: string | null;
  raw?: unknown;
};

export async function triggerPayment(charge: X402Charge): Promise<X402Result> {
  const env = readEnv();
  if (!env) {
    return {
      paymentId: `mock-${charge.findingId}`,
      status: "pending",
      txHash: null,
      explorerUrl: null,
      orderUrl: null
    };
  }

  const amountWei = parseUnits(charge.amountUsdc, 6).toString();
  const dappOrderId = `sc-${charge.findingId.slice(0, 16)}-${Date.now()}`;

  // Step 1 — create the x402 order. Returns HTTP 402 with order details.
  let orderId: string | undefined;
  let payTo: `0x${string}` | undefined;
  let orderAmountWei: string | undefined;
  let raw: unknown;

  try {
    const { data } = await apiRequest(env, "POST", "/api/v1/orders", {
      dapp_order_id: dappOrderId,
      chain_id: GOAT_CHAIN_ID,
      token_symbol: "USDC",
      token_contract: USDC_ADDRESS,
      from_address: charge.payerWallet,
      amount_wei: amountWei
    });
    raw = data;
    orderId = data?.order_id;
    payTo = data?.accepts?.[0]?.payTo as `0x${string}` | undefined;
    orderAmountWei = data?.accepts?.[0]?.amount as string | undefined;
  } catch (err) {
    const e = err as Error & { status?: number; body?: string };
    return {
      paymentId: `error-${dappOrderId}`,
      status: "failed",
      txHash: null,
      explorerUrl: null,
      orderUrl: null,
      raw: { phase: "order-create", error: e.message, status: e.status, body: e.body }
    };
  }

  if (!orderId || !payTo || !orderAmountWei) {
    return {
      paymentId: dappOrderId,
      status: "failed",
      txHash: null,
      explorerUrl: null,
      orderUrl: null,
      raw: { phase: "order-parse", note: "missing order_id/payTo/amount in API response", body: raw }
    };
  }

  // Step 2 — settle the order: send USDC from the payer wallet to the payTo
  // address. The x402 platform watches for the Transfer event and marks the
  // order paid. This produces the real on-chain tx hash judges can verify.
  const pk = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
  if (!pk) {
    return {
      paymentId: orderId,
      status: "pending",
      txHash: null,
      explorerUrl: null,
      orderUrl: `https://x402-merchant.goat.network/orders/${orderId}`,
      raw: { phase: "no-key", note: "Order created but AGENT_PRIVATE_KEY missing — cannot settle on-chain." }
    };
  }

  try {
    const { client } = walletClient(pk);
    const txHash = await client.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [payTo, BigInt(orderAmountWei)]
    });

    // Don't wait for receipt — we want the tool to return fast for chat. The
    // explorer URL will work the moment the tx propagates (~2s on GOAT).
    return {
      paymentId: orderId,
      status: "succeeded",
      txHash,
      explorerUrl: explorerTx(txHash),
      orderUrl: `https://x402-merchant.goat.network/orders/${orderId}`,
      raw: { phase: "transferred", orderId, payTo, amountWei: orderAmountWei }
    };
  } catch (err) {
    const e = err as Error;
    return {
      paymentId: orderId,
      status: "failed",
      txHash: null,
      explorerUrl: null,
      orderUrl: `https://x402-merchant.goat.network/orders/${orderId}`,
      raw: { phase: "transfer-failed", error: e.message }
    };
  }
}

export async function getOrderStatus(orderId: string) {
  const env = readEnv();
  if (!env) return null;
  try {
    const { data } = await apiRequest(env, "GET", `/api/v1/orders/${orderId}`);
    return {
      orderId: data.order_id,
      status: data.status,
      txHash: data.tx_hash ?? null,
      confirmedAt: data.confirmed_at ?? null,
      raw: data
    };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export function hasX402Configured() {
  return readEnv() !== null;
}
