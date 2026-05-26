import { keccak256, toBytes, type Hex, type TypedDataDomain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { GOAT_CHAIN_ID } from "./constants";
import type { ScopeGrant } from "@shared/types";

export const SCOPE_GRANT_DOMAIN: TypedDataDomain = {
  name: "ShieldClaw",
  version: "1",
  chainId: GOAT_CHAIN_ID
};

export const SCOPE_GRANT_TYPES = {
  ScopeGrant: [
    { name: "agentId", type: "string" },
    { name: "customer", type: "address" },
    { name: "targetsHash", type: "bytes32" },
    { name: "portsHash", type: "bytes32" },
    { name: "scanTypesHash", type: "bytes32" },
    { name: "intensity", type: "string" },
    { name: "notBefore", type: "uint256" },
    { name: "notAfter", type: "uint256" },
    { name: "revocable", type: "bool" }
  ]
} as const;

function hashStrings(values: string[]): Hex {
  return keccak256(toBytes(values.sort().join("|")));
}

export function scopeGrantHashes(grant: Pick<ScopeGrant, "targets" | "ports" | "scanTypes">) {
  return {
    targetsHash: hashStrings(grant.targets.map((t) => `${t.kind}:${t.value}`)),
    portsHash: hashStrings(grant.ports.map((p) => p.toString())),
    scanTypesHash: hashStrings(grant.scanTypes)
  };
}

export function scopeGrantDigestMessage(
  grant: Omit<ScopeGrant, "signature" | "grantId" | "version">
) {
  const { targetsHash, portsHash, scanTypesHash } = scopeGrantHashes(grant);
  return {
    agentId: grant.agentId,
    customer: grant.customer as `0x${string}`,
    targetsHash,
    portsHash,
    scanTypesHash,
    intensity: grant.intensity,
    notBefore: BigInt(grant.notBefore),
    notAfter: BigInt(grant.notAfter),
    revocable: grant.revocable
  };
}

export async function signScopeGrant(
  privateKey: `0x${string}`,
  grant: Omit<ScopeGrant, "signature" | "grantId" | "version">
): Promise<{ signature: Hex; grantId: Hex }> {
  const account = privateKeyToAccount(privateKey);
  const message = scopeGrantDigestMessage(grant);
  const signature = await account.signTypedData({
    domain: SCOPE_GRANT_DOMAIN,
    types: SCOPE_GRANT_TYPES,
    primaryType: "ScopeGrant",
    message
  });
  const grantId = keccak256(toBytes(JSON.stringify(message, (_, v) => (typeof v === "bigint" ? v.toString() : v))));
  return { signature, grantId };
}

export function isTargetInScope(grant: ScopeGrant, target: { kind: string; value: string }) {
  const now = Math.floor(Date.now() / 1000);
  if (now < grant.notBefore || now > grant.notAfter) return false;
  return grant.targets.some((t) => {
    if (t.kind === "domain" && target.kind === "url") {
      try {
        const host = new URL(target.value).hostname;
        return host === t.value || host.endsWith(`.${t.value}`);
      } catch {
        return false;
      }
    }
    return t.kind === target.kind && t.value === target.value;
  });
}
