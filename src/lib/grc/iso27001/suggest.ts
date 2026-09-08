/**
 * Keyword → control suggestions for the risk form. Deliberately simple and
 * transparent: a word list per control, no model. Over-suggesting is cheap
 * (the user unticks), under-suggesting is silent, so lists lean broad.
 */
const KEYWORDS: [string, string[]][] = [
  ['5.7', ['threat intel', 'threat intelligence', 'ioc', 'feed']],
  ['5.9', ['inventory', 'asset register', 'unknown asset', 'shadow it']],
  ['5.12', ['classification', 'classify', 'sensitive data', 'confidential']],
  ['5.14', ['transfer', 'email attachment', 'file sharing', 'sharing']],
  ['5.15', ['access control', 'unauthorised access', 'unauthorized access', 'least privilege']],
  ['5.16', ['identity', 'account lifecycle', 'orphan account', 'leaver']],
  ['5.17', ['password', 'credential', 'secret', 'api key', 'token']],
  ['5.18', ['access rights', 'access review', 'permission', 'entitlement']],
  ['5.19', ['supplier', 'vendor', 'third party', 'third-party', 'outsourc']],
  ['5.20', ['contract', 'sla', 'agreement']],
  ['5.21', ['supply chain', 'dependency', 'open source', 'package']],
  ['5.23', ['cloud', 'saas', 'aws', 'azure', 'gcp']],
  ['5.24', ['incident', 'breach', 'response plan']],
  ['5.26', ['incident', 'breach', 'compromise']],
  ['5.29', ['disruption', 'outage', 'continuity']],
  ['5.30', ['disaster', 'recovery', 'continuity', 'failover', 'outage']],
  ['5.31', ['legal', 'regulat', 'compliance', 'gdpr', 'pdpa', 'law']],
  ['5.34', ['personal data', 'pii', 'privacy', 'gdpr', 'pdpa']],
  ['6.1', ['screening', 'background check', 'hiring', 'insider']],
  ['6.3', ['awareness', 'training', 'phishing', 'social engineering', 'human error']],
  ['6.5', ['leaver', 'termination', 'offboard', 'insider']],
  ['6.6', ['nda', 'confidentiality agreement', 'non-disclosure']],
  ['6.7', ['remote', 'work from home', 'home working', 'vpn']],
  ['6.8', ['report', 'reporting', 'near miss']],
  ['7.1', ['physical', 'perimeter', 'building', 'premises']],
  ['7.2', ['visitor', 'badge', 'tailgating', 'entry', 'door']],
  ['7.5', ['fire', 'flood', 'power', 'environmental', 'earthquake']],
  ['7.7', ['clear desk', 'clear screen', 'printout', 'unattended']],
  ['7.9', ['laptop', 'lost device', 'stolen', 'theft', 'off-site', 'travel']],
  ['7.10', ['usb', 'removable media', 'media', 'external drive']],
  ['7.11', ['power', 'ups', 'cooling', 'utility', 'hvac']],
  ['7.14', ['disposal', 'decommission', 'reuse', 'wipe', 'e-waste']],
  ['8.1', ['endpoint', 'laptop', 'mobile', 'byod', 'device']],
  ['8.2', ['privileged', 'admin', 'root', 'domain admin', 'sudo']],
  ['8.3', ['access restriction', 'need to know', 'data access']],
  ['8.4', ['source code', 'repository', 'git', 'github']],
  ['8.5', ['authentication', 'mfa', '2fa', 'password', 'login', 'sso', 'brute force']],
  ['8.6', ['capacity', 'performance', 'scaling', 'resource exhaustion', 'ddos']],
  ['8.7', ['malware', 'ransomware', 'virus', 'antivirus', 'edr', 'trojan']],
  ['8.8', ['vulnerability', 'patch', 'cve', 'exploit', 'unpatched', 'zero-day', 'zero day']],
  ['8.9', ['configuration', 'misconfig', 'hardening', 'baseline', 'default']],
  ['8.10', ['deletion', 'retention', 'delete', 'purge']],
  ['8.11', ['masking', 'anonymis', 'anonymiz', 'pseudonym', 'test data']],
  ['8.12', ['leak', 'exfiltration', 'dlp', 'data loss', 'upload']],
  ['8.13', ['backup', 'restore', 'ransomware', 'data loss', 'corruption']],
  ['8.14', ['redundancy', 'single point of failure', 'availability', 'high availability']],
  ['8.15', ['log', 'logging', 'audit trail', 'siem']],
  ['8.16', ['monitoring', 'detection', 'alert', 'anomaly', 'siem', 'soc']],
  ['8.17', ['clock', 'ntp', 'time sync']],
  ['8.18', ['utility', 'powershell', 'admin tool', 'debugger']],
  ['8.19', ['software installation', 'unapproved software', 'install']],
  ['8.20', ['network', 'firewall', 'lateral movement', 'wifi', 'wi-fi']],
  ['8.21', ['network service', 'isp', 'dns', 'cdn']],
  ['8.22', ['segmentation', 'segregation', 'vlan', 'flat network', 'lateral movement']],
  ['8.23', ['web filtering', 'browsing', 'malicious site', 'url']],
  ['8.24', ['encrypt', 'cryptograph', 'tls', 'key management', 'certificate']],
  ['8.25', ['sdlc', 'development', 'devops', 'ci/cd', 'pipeline']],
  ['8.26', ['application security', 'requirements', 'owasp']],
  ['8.28', ['secure coding', 'injection', 'xss', 'sql injection', 'owasp', 'code review']],
  ['8.29', ['security testing', 'pentest', 'penetration', 'sast', 'dast']],
  ['8.30', ['outsourced development', 'contractor', 'agency']],
  ['8.31', ['production', 'staging', 'test environment', 'environment separation']],
  ['8.32', ['change', 'deployment', 'release', 'rollback']],
  ['8.33', ['test data', 'production data in test']],
  ['8.34', ['audit', 'audit testing']],
];

export function suggestControls(text: string, max = 5): string[] {
  const hay = text.toLowerCase();
  if (!hay.trim()) return [];
  const scored: [string, number][] = [];
  for (const [id, words] of KEYWORDS) {
    let score = 0;
    for (const w of words) if (hay.includes(w)) score += w.length;
    if (score > 0) scored.push([id, score]);
  }
  return scored.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([id]) => id);
}
