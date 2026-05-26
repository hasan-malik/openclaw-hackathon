/**
 * All six ShieldClaw specialist agents.
 * Each has its own ERC-8004 agentId, name, and single-purpose skill.
 */

import { BaseSpecialist } from "./base";

export class SQLInjectionAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-sql-001";
  readonly agentName = "ShieldClaw SQL Injection Agent";
  readonly skillName = "sql_injection_attack";
  readonly capabilities = ["sql_injection_testing"];
}

export class APIKeyAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-apikey-001";
  readonly agentName = "ShieldClaw API Key Exposure Agent";
  readonly skillName = "credential_exposure";
  readonly capabilities = ["api_key_scanning", "config_exposure"];
}

export class WalletAuthAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-wallet-001";
  readonly agentName = "ShieldClaw Wallet Authorization Agent";
  readonly skillName = "wallet_auth_bypass";
  readonly capabilities = ["wallet_auth_testing", "idor_detection"];
}

export class PortScanAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-port-001";
  readonly agentName = "ShieldClaw Port Scanner Agent";
  readonly skillName = "port_scan";
  readonly capabilities = ["network_port_scanning"];
}

export class SSLAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-ssl-001";
  readonly agentName = "ShieldClaw SSL/TLS Agent";
  readonly skillName = "ssl_check";
  readonly capabilities = ["ssl_tls_analysis"];
}

export class CredentialAgent extends BaseSpecialist {
  readonly agentId = "shieldclaw-cred-001";
  readonly agentName = "ShieldClaw Credential Exposure Agent";
  readonly skillName = "credential_exposure";
  readonly capabilities = ["credential_exposure_scanning"];
}

export const ALL_SPECIALISTS = [
  new SQLInjectionAgent(),
  new APIKeyAgent(),
  new WalletAuthAgent(),
  new PortScanAgent(),
  new SSLAgent(),
  new CredentialAgent(),
] as const;
