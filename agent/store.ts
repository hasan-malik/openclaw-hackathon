import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Finding, ScopeGrant } from "@shared/types";

// On Vercel / Lambda the working directory is read-only — only /tmp is writable
// (and ephemeral across cold starts, which is fine for a demo). Locally we keep
// state in ./.shieldclaw so it survives restarts.
const DATA_DIR = process.env.VERCEL
  ? "/tmp/shieldclaw"
  : join(process.cwd(), ".shieldclaw");
const FINDINGS_FILE = join(DATA_DIR, "findings.json");
const GRANTS_FILE = join(DATA_DIR, "scope-grants.json");

// Last-resort in-memory fallback if the filesystem is hostile (e.g. read-only).
const memory: { findings: Finding[]; grants: ScopeGrant[] } = { findings: [], grants: [] };
let useMemoryFallback = false;

function ensureDir() {
  if (useMemoryFallback) return;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    useMemoryFallback = true;
  }
}

function readJSON<T>(path: string, fallback: T): T {
  ensureDir();
  if (useMemoryFallback) return fallback;
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(path: string, value: unknown) {
  ensureDir();
  if (useMemoryFallback) return;
  try {
    writeFileSync(path, JSON.stringify(value, null, 2));
  } catch {
    useMemoryFallback = true;
  }
}

export function listFindings(): Finding[] {
  if (useMemoryFallback) return memory.findings;
  return readJSON<Finding[]>(FINDINGS_FILE, memory.findings);
}

export function upsertFinding(finding: Finding) {
  const all = listFindings();
  const idx = all.findIndex((f) => f.findingId === finding.findingId);
  if (idx >= 0) all[idx] = finding;
  else all.unshift(finding);
  memory.findings = all;
  writeJSON(FINDINGS_FILE, all);
  return finding;
}

export function getFinding(id: string) {
  return listFindings().find((f) => f.findingId === id) ?? null;
}

export function listGrants(): ScopeGrant[] {
  if (useMemoryFallback) return memory.grants;
  return readJSON<ScopeGrant[]>(GRANTS_FILE, memory.grants);
}

export function upsertGrant(grant: ScopeGrant) {
  const all = listGrants();
  const idx = all.findIndex((g) => g.grantId === grant.grantId);
  if (idx >= 0) all[idx] = grant;
  else all.unshift(grant);
  memory.grants = all;
  writeJSON(GRANTS_FILE, all);
  return grant;
}

export function getGrant(id: string) {
  return listGrants().find((g) => g.grantId === id) ?? null;
}
