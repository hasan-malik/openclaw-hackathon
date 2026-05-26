import "dotenv/config";
import { runNuclei, nucleiResultToFinding } from "./scanner";
import { notify } from "./notify";
import { listGrants, upsertFinding, listFindings } from "./store";
import { triggerPayment, hasX402Configured } from "@onchain/x402";
import { isTargetInScope } from "@onchain/scope-grant";
import { mockGrant, mockFindings } from "./mock-data";
import { upsertGrant } from "./store";

const SCAN_INTERVAL = Number(process.env.SCAN_INTERVAL_SECONDS ?? 300) * 1000;
const RECEIVING_WALLET = (process.env.GOATX402_RECEIVING_WALLET ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const PAYER_WALLET = (process.env.AGENT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

async function scanOnce() {
  let grants = listGrants();
  if (grants.length === 0) {
    upsertGrant(mockGrant);
    for (const f of mockFindings) upsertFinding(f);
    grants = listGrants();
    console.log(`[worker] seeded mock data (${mockFindings.length} findings, 1 grant)`);
  }

  for (const grant of grants) {
    for (const target of grant.targets) {
      const url = target.kind === "domain" ? `http://${target.value}` : target.value;
      if (!isTargetInScope(grant, { kind: "url", value: url })) {
        console.warn(`[worker] target ${url} is outside grant ${grant.grantId.slice(0, 10)}…, skipping`);
        continue;
      }

      console.log(`[worker] scanning ${url}`);
      try {
        const raws = await runNuclei(url, { timeoutMs: 90_000 });
        for (const raw of raws) {
          const finding = nucleiResultToFinding(raw, {
            scopeGrantId: grant.grantId,
            agentId: grant.agentId
          });
          upsertFinding(finding);
          await notify(finding);

          if (hasX402Configured()) {
            try {
              const result = await triggerPayment({
                findingId: finding.findingId,
                amountUsdc: finding.billing.amountUsdc,
                payerWallet: PAYER_WALLET,
                receivingWallet: RECEIVING_WALLET,
                description: `ShieldClaw finding: ${finding.title}`
              });
              upsertFinding({
                ...finding,
                billing: {
                  ...finding.billing,
                  x402PaymentId: result.paymentId,
                  status: result.status === "succeeded" ? "paid" : "pending"
                }
              });
            } catch (err) {
              console.error(`[worker] x402 trigger failed for ${finding.findingId}:`, err);
            }
          }
        }
        console.log(`[worker] scan complete: ${raws.length} raw results`);
      } catch (err) {
        console.error(`[worker] scan error on ${url}:`, (err as Error).message);
      }
    }
  }
}

async function main() {
  console.log("[worker] starting ShieldClaw agent loop");
  console.log(`[worker] scan interval: ${SCAN_INTERVAL / 1000}s`);
  console.log(`[worker] x402 configured: ${hasX402Configured()}`);
  console.log(`[worker] findings already stored: ${listFindings().length}`);

  await scanOnce();
  setInterval(scanOnce, SCAN_INTERVAL);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
