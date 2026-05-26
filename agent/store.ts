import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Finding, ScopeGrant } from "@shared/types";

const DATA_DIR = join(process.cwd(), ".shieldclaw");
const FINDINGS_FILE = join(DATA_DIR, "findings.json");
const GRANTS_FILE = join(DATA_DIR, "scope-grants.json");

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON<T>(path: string, fallback: T): T {
  ensureDir();
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(path: string, value: unknown) {
  ensureDir();
  writeFileSync(path, JSON.stringify(value, null, 2));
}

export function listFindings(): Finding[] {
  return readJSON<Finding[]>(FINDINGS_FILE, []);
}

export function upsertFinding(finding: Finding) {
  const all = listFindings();
  const idx = all.findIndex((f) => f.findingId === finding.findingId);
  if (idx >= 0) all[idx] = finding;
  else all.unshift(finding);
  writeJSON(FINDINGS_FILE, all);
  return finding;
}

export function getFinding(id: string) {
  return listFindings().find((f) => f.findingId === id) ?? null;
}

export function listGrants(): ScopeGrant[] {
  return readJSON<ScopeGrant[]>(GRANTS_FILE, []);
}

export function upsertGrant(grant: ScopeGrant) {
  const all = listGrants();
  const idx = all.findIndex((g) => g.grantId === grant.grantId);
  if (idx >= 0) all[idx] = grant;
  else all.unshift(grant);
  writeJSON(GRANTS_FILE, all);
  return grant;
}

export function getGrant(id: string) {
  return listGrants().find((g) => g.grantId === id) ?? null;
}
