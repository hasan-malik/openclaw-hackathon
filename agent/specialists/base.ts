/**
 * Base class for all ShieldClaw specialist agents.
 *
 * Each specialist:
 *   - Has its own ERC-8004 agentId and capability set
 *   - Checks authorization (scope grant) before touching any target
 *   - Logs every action
 *   - Returns a structured result that the orchestrator compiles
 */

import { listGrants } from "../store";
import { isTargetInScope } from "@onchain/scope-grant";
import { runSkill } from "../llm/skill-adapter";

export interface SpecialistResult {
  agentId: string;
  agentName: string;
  skillName: string;
  targetUrl: string;
  authorized: boolean;
  vulnerable: boolean;
  findingId?: string;
  severity?: string;
  title?: string;
  amountUsdc?: string;
  refusedReason?: string;
  error?: string;
}

export abstract class BaseSpecialist {
  abstract readonly agentId: string;   // e.g. "shieldclaw-sql-001"
  abstract readonly agentName: string; // e.g. "ShieldClaw SQL Injection Agent"
  abstract readonly skillName: string; // must match a key in RUNNERS in skill-adapter
  abstract readonly capabilities: string[];

  /**
   * Check on-chain (via scope-grant store) that this target is authorized.
   * Refuses with a logged reason if no active grant covers the target.
   */
  private checkAuthorization(targetUrl: string): { ok: boolean; grantId?: string; reason?: string } {
    const grants = listGrants();
    const match = grants.find((g) =>
      isTargetInScope(g, { kind: "url", value: targetUrl })
    );
    if (!match) {
      return {
        ok: false,
        reason: `[${this.agentName}] REFUSED — no active scope grant covers ${targetUrl}. Authorization is mandatory.`,
      };
    }
    return { ok: true, grantId: match.grantId };
  }

  async run(targetUrl: string): Promise<SpecialistResult> {
    const base = { agentId: this.agentId, agentName: this.agentName, skillName: this.skillName, targetUrl };

    // ── Step 1: Authorization check (hardcoded — never skippable) ────────────
    const auth = this.checkAuthorization(targetUrl);
    if (!auth.ok) {
      console.log(`[specialist] ${auth.reason}`);
      return { ...base, authorized: false, vulnerable: false, refusedReason: auth.reason };
    }

    // ── Step 2: Run the attack skill ─────────────────────────────────────────
    try {
      const result = await runSkill(this.skillName, targetUrl, this.agentId);

      if ("refused" in result && result.refused) {
        return { ...base, authorized: false, vulnerable: false, refusedReason: String(result.reason) };
      }

      if ("error" in result) {
        return { ...base, authorized: true, vulnerable: false, error: String(result.error) };
      }

      if (!result.vulnerable) {
        return { ...base, authorized: true, vulnerable: false };
      }

      return {
        ...base,
        authorized: true,
        vulnerable: true,
        findingId: result.findingId,
        severity: result.severity,
        title: result.title,
        amountUsdc: result.amountUsdc,
      };
    } catch (err) {
      return { ...base, authorized: true, vulnerable: false, error: (err as Error).message };
    }
  }
}
