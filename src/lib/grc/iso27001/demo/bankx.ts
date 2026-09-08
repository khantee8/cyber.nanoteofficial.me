/**
 * Demo assessment: "BankX", a fictional Thai digital bank at mid ISMS maturity.
 * Every fact here is assumed for demonstration. Regulatory references are real
 * (Bank of Thailand IT-risk guidelines, BOT Cyber Resilience Assessment
 * Framework, PDPA B.E. 2562) but BankX and its documents are not.
 * Applied with `npm run seed:demo -- --org "BankX" | psql "$DATABASE_URL_UNPOOLED"`.
 */
import type { ControlStatusValue, RiskStatus, Treatment } from '../../types';

export interface DemoOrg {
  scope: string;
  industry: string;
  sizeBand: '1-10' | '11-50' | '51-250' | '251-1000' | '1000+';
  ismsLead: string;
}

export interface DemoStatus {
  controlId: string;
  status: ControlStatusValue;
  owner: string;
  justification?: string;
  evidenceUrls?: string[];
}

export interface DemoRisk {
  title: string;
  description: string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  treatment: Treatment;
  treatmentPlan: string;
  owner: string;
  status: RiskStatus;
  linkedControlIds: string[];
  residualLikelihood?: number;
  residualImpact?: number;
}

export const bankxOrg: DemoOrg = {
  scope:
    'The information security management system covering BankX\'s retail digital banking services (mobile banking app, internet banking, payment APIs and the PromptPay gateway), the core banking platform and its supporting infrastructure in the Bangkok primary data centre, the Chonburi disaster-recovery site and the approved public-cloud tenancy, together with the Technology, Information Security, Operations, Risk and Compliance functions that operate them. Excludes the wealth-management subsidiary, which runs its own ISMS.',
  industry: 'Banking',
  sizeBand: '51-250',
  ismsLead: 'Head of Information Security (CISO)',
};

// Owners (roles, not people)
const CISO = 'CISO';
const INFRA = 'Head of IT Infrastructure';
const APPS = 'Head of Application Development';
const SOC = 'SOC Manager';
const HR = 'HR Director';
const FAC = 'Facilities Manager';
const DPO = 'Data Protection Officer';
const COMP = 'Head of Compliance';
const VENDOR = 'Vendor Management Lead';
const BCM = 'Business Continuity Manager';
const IAM = 'Identity & Access Manager';
const AUDIT = 'Head of Internal Audit';

const doc = (p: string) => `https://docs.bankx.example/${p}`;

// [id, status, owner, justification?, evidence?]
type Row = [string, ControlStatusValue, string, string?, string[]?];

const rows: Row[] = [
  // 5 Organisational
  ['5.1', 'implemented', CISO, 'Information Security Policy ISP-001 v4.2 approved by the Board Risk Committee, Feb 2026; 14 topic policies published on the intranet; annual review aligned with the BOT IT Risk Management Guidelines self-assessment cycle.', [doc('policies/ISP-001'), doc('policies/index')]],
  ['5.2', 'implemented', CISO, 'RACI in ISP-001 Annex B: CISO reports to the CRO; three lines of defence documented as required by BOT IT-risk governance expectations.', [doc('policies/ISP-001#annex-b')]],
  ['5.3', 'partial', IAM, 'SoD matrix exists for core banking and payment operations; not yet enforced in the cloud IAM roles for the data platform.', [doc('access/sod-matrix')]],
  ['5.4', 'implemented', HR, 'Security responsibilities in the Code of Conduct; line-manager attestation every quarter.'],
  ['5.5', 'implemented', COMP, 'Contact list for BOT, ThaiCERT, TB-CERT, the Royal Thai Police TCSD and the PDPC maintained in the incident plan; BOT incident notification within the regulatory deadline rehearsed in the 2025 tabletop.', [doc('ir/contacts')]],
  ['5.6', 'implemented', SOC, 'Member of TB-CERT (Thailand Banking Sector CERT) intelligence sharing; subscribed to vendor advisories for core banking, network and endpoint platforms.'],
  ['5.7', 'partial', SOC, 'TB-CERT and commercial feeds consumed in the SIEM; no formal threat-intel requirements or dissemination process yet. Target: documented TI process in Q4 2026.'],
  ['5.8', 'partial', CISO, 'Security review gate in the project framework for tier-1 projects; agile squads still skip it for minor releases.'],
  ['5.9', 'implemented', INFRA, 'CMDB covers servers, network and cloud resources with named owners; reconciled monthly against the cloud inventory.', [doc('cmdb/reconciliation-2026-08')]],
  ['5.10', 'implemented', CISO, 'Acceptable Use Policy accepted at onboarding and annually.'],
  ['5.11', 'implemented', HR, 'Leaver checklist enforced by HRIS workflow; asset return signed off by IT.'],
  ['5.12', 'implemented', DPO, 'Four-level classification (Public, Internal, Confidential, Restricted); customer PII is Restricted by default under the PDPA data map.', [doc('policies/ISP-012-classification')]],
  ['5.13', 'partial', DPO, 'Labels applied in M365 sensitivity labels; legacy file shares unlabelled.'],
  ['5.14', 'implemented', INFRA, 'Secure file transfer for interbank and regulator submissions (SFTP with mutual TLS); email DLP for Restricted data.'],
  ['5.15', 'implemented', IAM, 'Access Control Policy ISP-004; role-based access for core banking, least privilege for cloud.', [doc('policies/ISP-004')]],
  ['5.16', 'implemented', IAM, 'Joiner-mover-leaver automated from HRIS to the IdP; service accounts inventoried.'],
  ['5.17', 'implemented', IAM, 'Password standard aligned with NIST SP 800-63B; secrets in a vault; MFA on all staff accounts.'],
  ['5.18', 'partial', IAM, 'Quarterly access recertification for core banking; cloud and SaaS applications recertified annually only.'],
  ['5.19', 'implemented', VENDOR, 'Third-party risk programme aligned with the BOT outsourcing and third-party risk expectations; tiering by data access and criticality.', [doc('tprm/framework')]],
  ['5.20', 'implemented', VENDOR, 'Security schedule in all vendor contracts; right-to-audit and incident notification within 24 hours.'],
  ['5.21', 'partial', VENDOR, 'Software bill of materials collected from top-10 suppliers; not yet for the wider ICT supply chain.'],
  ['5.22', 'partial', VENDOR, 'Annual review of critical suppliers; performance monitoring for the rest is informal.'],
  ['5.23', 'implemented', INFRA, 'Cloud usage policy; approved landing zone; BOT notification completed before material cloud workloads went live.', [doc('cloud/landing-zone')]],
  ['5.24', 'implemented', SOC, 'Incident Response Plan IRP-001 with severity matrix and BOT reporting workflow; tabletop twice a year.', [doc('ir/IRP-001')]],
  ['5.25', 'implemented', SOC, 'SIEM triage playbooks; event-to-incident decision criteria in IRP-001.'],
  ['5.26', 'implemented', SOC, '24×7 SOC (outsourced level 1, in-house level 2/3); playbooks for phishing, malware, account takeover, DDoS.'],
  ['5.27', 'partial', SOC, 'Post-incident reviews held for Sev-1/2; lessons not consistently fed back into controls.'],
  ['5.28', 'implemented', SOC, 'Forensic readiness procedure; evidence handling with chain of custody.'],
  ['5.29', 'partial', BCM, 'Security requirements referenced in the BCP; DR-site security controls not fully equivalent to primary.'],
  ['5.30', 'implemented', BCM, 'DR site in Chonburi; RTO 4h / RPO 15min for core banking; full DR test March 2026 passed.', [doc('bcm/dr-test-2026-03')]],
  ['5.31', 'implemented', COMP, 'Regulatory obligations register: BOT IT Risk Management Guidelines, BOT Cyber Resilience Assessment Framework (CRAF), PDPA B.E. 2562, Cybersecurity Act B.E. 2562, PCI DSS v4.0.', [doc('compliance/obligations')]],
  ['5.32', 'implemented', COMP, 'Software licence register; open-source licence scanning in CI.'],
  ['5.33', 'implemented', COMP, 'Records retention schedule (10 years for transaction records per BOT and AML requirements).'],
  ['5.34', 'partial', DPO, 'PDPA programme in place (RoPA, privacy notices, consent); data-subject request SLA met; cross-border transfer assessments outstanding for two SaaS vendors.', [doc('privacy/ropa')]],
  ['5.35', 'implemented', AUDIT, 'Internal audit of the ISMS annually; external ISO 27001 surveillance audit scheduled Nov 2026.'],
  ['5.36', 'partial', COMP, 'Compliance checks for policies exist; technical standards compliance measured only for servers, not for cloud configuration.'],
  ['5.37', 'implemented', INFRA, 'Operating procedures in the IT service management tool; change-controlled.'],

  // 6 People
  ['6.1', 'implemented', HR, 'Background, criminal-record and credit checks for all staff; enhanced screening for privileged and treasury roles.'],
  ['6.2', 'implemented', HR, 'Confidentiality and security clauses in employment contracts.'],
  ['6.3', 'implemented', HR, 'Annual e-learning (97% completion), monthly phishing simulation (click rate 4.1% in Aug 2026), role-based training for developers and SOC.', [doc('awareness/2026-report')]],
  ['6.4', 'implemented', HR, 'Disciplinary process in HR policy; applied twice in 2025.'],
  ['6.5', 'implemented', HR, 'Post-employment obligations in contract; access revoked same day.'],
  ['6.6', 'implemented', COMP, 'NDA template reviewed 2025; signed by staff, contractors and vendors.'],
  ['6.7', 'partial', INFRA, 'VPN with MFA and managed laptops; personal device policy for staff email not enforced technically.'],
  ['6.8', 'implemented', SOC, 'Report-phishing button; security hotline; near-miss reporting encouraged in awareness sessions.'],

  // 7 Physical
  ['7.1', 'implemented', FAC, 'Data centre and office perimeters defined; security zones documented.'],
  ['7.2', 'implemented', FAC, 'Badge plus biometric at data-centre doors; visitor escort; logs retained 1 year.'],
  ['7.3', 'implemented', FAC, 'Treasury and SOC rooms restricted; no external signage.'],
  ['7.4', 'implemented', FAC, 'CCTV and intrusion detection monitored by the guard force; alarms to the SOC.'],
  ['7.5', 'implemented', FAC, 'Fire suppression (FM-200), flood sensors, seismic-rated racks.'],
  ['7.6', 'implemented', FAC, 'Secure-area rules posted; no photography; two-person rule in the vault.'],
  ['7.7', 'partial', CISO, 'Clear-desk policy; screen lock 5 minutes; audit found printouts in branch back offices.'],
  ['7.8', 'implemented', FAC, 'Equipment in locked racks; environmental monitoring.'],
  ['7.9', 'implemented', INFRA, 'Full-disk encryption on all laptops; remote wipe via MDM.'],
  ['7.10', 'implemented', INFRA, 'USB storage blocked by default; approved encrypted media for backup transport.'],
  ['7.11', 'implemented', FAC, 'Dual utility feeds, UPS and generators tested monthly; 72h fuel.'],
  ['7.12', 'implemented', FAC, 'Cabling in secured trays; patch panels locked.'],
  ['7.13', 'implemented', INFRA, 'Vendor maintenance under supervision; maintenance logs retained.'],
  ['7.14', 'implemented', INFRA, 'NIST 800-88 wipe or shredding with certificates of destruction.'],

  // 8 Technological
  ['8.1', 'implemented', INFRA, 'MDM/EDR on all endpoints; hardened images; local admin removed.'],
  ['8.2', 'implemented', IAM, 'Privileged access management with session recording for core banking, database and cloud admin.'],
  ['8.3', 'implemented', IAM, 'Data access through application roles; direct database access restricted to DBAs via PAM.'],
  ['8.4', 'implemented', APPS, 'Source code in a private Git server; branch protection; access reviewed quarterly.'],
  ['8.5', 'partial', IAM, 'MFA for staff; customer mobile banking uses device binding, PIN and facial biometrics per BOT mobile-banking security guidance; legacy internet banking still allows OTP-only for some transaction types.'],
  ['8.6', 'implemented', INFRA, 'Capacity monitoring with 6-month forecasting; auto-scaling for the API tier.'],
  ['8.7', 'implemented', SOC, 'EDR on servers and endpoints; email sandboxing; web filtering; monthly awareness reminders.'],
  ['8.8', 'partial', INFRA, 'Monthly authenticated scans; critical patches within 14 days for internet-facing systems; legacy core banking modules exceed SLA. Penetration test annually and before major releases.', [doc('vuln/kpi-2026-08')]],
  ['8.9', 'partial', INFRA, 'CIS benchmarks applied to servers and network devices; cloud configuration baseline under development.'],
  ['8.10', 'partial', DPO, 'Retention-based deletion for customer data in core banking; deletion from analytics data lake not yet automated.'],
  ['8.11', 'implemented', DPO, 'Production data masked in non-production environments; tokenisation of card PANs.'],
  ['8.12', 'partial', SOC, 'Email and endpoint DLP for Restricted data; no DLP on SaaS collaboration tools.'],
  ['8.13', 'implemented', INFRA, 'Immutable backups, 3-2-1, restore tests quarterly; last full restore test July 2026 passed.', [doc('backup/restore-test-2026-07')]],
  ['8.14', 'implemented', INFRA, 'Active-active for the digital channels; active-passive DR for core banking.'],
  ['8.15', 'implemented', SOC, 'Central logging to SIEM; 1-year online retention; log integrity protected.'],
  ['8.16', 'implemented', SOC, '24×7 monitoring with use cases for fraud-adjacent events (mass login failures, new device enrolment spikes).'],
  ['8.17', 'implemented', INFRA, 'NTP from two stratum-1 sources; drift alerting.'],
  ['8.18', 'implemented', INFRA, 'Admin tooling restricted through PAM; application allow-listing on servers.'],
  ['8.19', 'implemented', INFRA, 'Software installation through change management; allow-listing on endpoints.'],
  ['8.20', 'implemented', INFRA, 'Next-generation firewalls, IPS, NAC; network architecture reviewed 2025.'],
  ['8.21', 'implemented', INFRA, 'Service levels and security requirements for ISPs, DDoS scrubbing and the payment network defined in contracts.'],
  ['8.22', 'partial', INFRA, 'Segmentation between user, server, payment (PCI) and management zones; east-west micro-segmentation in the data centre planned for 2027.'],
  ['8.23', 'implemented', SOC, 'Secure web gateway with category and reputation filtering.'],
  ['8.24', 'implemented', CISO, 'Cryptography standard; HSM-backed key management for payment keys; TLS 1.2+ only.', [doc('policies/ISP-020-crypto')]],
  ['8.25', 'partial', APPS, 'Secure SDLC defined; threat modelling done for the mobile app but not for all API services.'],
  ['8.26', 'implemented', APPS, 'Security requirements checklist in the product backlog template; OWASP ASVS level 2 for customer-facing apps.'],
  ['8.27', 'implemented', APPS, 'Secure architecture principles (zero trust for admin access, defence in depth) in the architecture standard.'],
  ['8.28', 'implemented', APPS, 'Secure coding standard; SAST and dependency scanning in CI; mobile app hardening (root/jailbreak detection, anti-tampering) per BOT mobile-banking security measures.'],
  ['8.29', 'implemented', APPS, 'DAST before release; annual penetration test of digital channels by an accredited firm.'],
  ['8.30', 'not_applicable', APPS, 'All application development is performed in-house by BankX Technology; no development is outsourced. Vendor-supplied packaged software is covered under 5.19–5.22.'],
  ['8.31', 'implemented', APPS, 'Separate dev, SIT, UAT and production; production access via PAM only.'],
  ['8.32', 'implemented', INFRA, 'CAB weekly; emergency change process; changes traced in the ITSM tool.'],
  ['8.33', 'implemented', DPO, 'Masked or synthetic data in test; production data use in test requires DPO approval.'],
  ['8.34', 'implemented', AUDIT, 'Audit and penetration testing windows agreed with operations; read-only access for auditors.'],
];

export const bankxStatuses: DemoStatus[] = rows.map(([controlId, status, owner, justification, evidenceUrls]) => ({
  controlId, status, owner, justification, evidenceUrls,
}));

export const bankxRisks: DemoRisk[] = [
  {
    title: 'Account takeover of mobile banking customers through malware and social engineering',
    description: 'Banking malware and call-centre scams impersonating officials trick customers into installing remote-control apps or revealing credentials. Thailand sees banking-malware infection rates well above the global average, and losses concentrate on retail customers of digital channels.',
    asset: 'Mobile banking app and customer accounts', threat: 'Banking malware, remote-access scam, SIM swap', vulnerability: 'Transaction limits and device-binding gaps on older app versions; customers on outdated OS',
    likelihood: 5, impact: 5, treatment: 'mitigate',
    treatmentPlan: 'Block app on devices below iOS 14 / Android 10 (BOT measure, effective Feb 2026); facial biometric for transfers above THB 50,000; screen-sharing detection; scam-warning prompts; real-time fraud scoring on new-device enrolment.',
    owner: 'Head of Digital Banking', status: 'in_treatment', linkedControlIds: ['8.5', '8.28', '8.16', '6.3'], residualLikelihood: 3, residualImpact: 4,
  },
  {
    title: 'Ransomware encrypts the core banking environment',
    description: 'A ransomware operator gains a foothold through a phished administrator or an exploited internet-facing appliance and moves laterally to the core banking servers.',
    asset: 'Core banking platform', threat: 'Ransomware group', vulnerability: 'Flat segments between server zones; legacy modules patched outside SLA',
    likelihood: 3, impact: 5, treatment: 'mitigate',
    treatmentPlan: 'Micro-segmentation programme (2027); PAM enforcement for all admin paths; immutable backups verified quarterly; ransomware tabletop with the executive team.',
    owner: CISO, status: 'in_treatment', linkedControlIds: ['8.7', '8.13', '8.22', '8.8', '8.2'], residualLikelihood: 2, residualImpact: 4,
  },
  {
    title: 'Exploitation of a critical vulnerability in an internet-facing gateway',
    description: 'Edge appliances (VPN, API gateway, WAF) are frequently listed in CISA KEV within days of disclosure. A delayed patch leaves a window for pre-authentication exploitation.',
    asset: 'API gateway, VPN concentrators', threat: 'Opportunistic exploitation of known vulnerabilities', vulnerability: '14-day patch SLA for internet-facing systems; no virtual patching on some devices',
    likelihood: 4, impact: 4, treatment: 'mitigate',
    treatmentPlan: 'Move to 72-hour SLA for KEV-listed vulnerabilities on edge devices; subscribe to KEV and EPSS feeds in the vulnerability tool; emergency change path pre-approved.',
    owner: INFRA, status: 'open', linkedControlIds: ['8.8', '5.7', '8.32'],
  },
  {
    title: 'DDoS attack takes internet and mobile banking offline',
    description: 'Volumetric or application-layer DDoS against the digital channels during salary days, exceeding on-premise mitigation capacity.',
    asset: 'Digital banking channels', threat: 'Hacktivist or extortion DDoS', vulnerability: 'Scrubbing service not always-on; API rate limiting incomplete',
    likelihood: 3, impact: 4, treatment: 'mitigate',
    treatmentPlan: 'Always-on cloud scrubbing; API rate limiting; DDoS runbook tested with the ISP.',
    owner: INFRA, status: 'in_treatment', linkedControlIds: ['8.21', '8.6', '5.26'], residualLikelihood: 2, residualImpact: 3,
  },
  {
    title: 'Leak of customer personal data from the analytics data lake',
    description: 'Customer PII copied into the cloud data lake for analytics is accessible to a wider group than intended and is not deleted at the end of retention, exposing BankX to PDPA penalties and BOT reporting.',
    asset: 'Customer PII in the analytics platform', threat: 'Insider misuse or misconfigured storage', vulnerability: 'Broad IAM roles; deletion not automated; no DLP on SaaS tools',
    likelihood: 3, impact: 4, treatment: 'mitigate',
    treatmentPlan: 'Fine-grained IAM roles with SoD; automated retention deletion; cloud configuration baseline with continuous compliance monitoring; DPIA update.',
    owner: DPO, status: 'open', linkedControlIds: ['5.34', '8.10', '5.3', '8.9', '8.12'],
  },
  {
    title: 'Compromise of a critical technology supplier',
    description: 'A supplier with remote access to BankX systems (core banking vendor, ATM services) is breached and the attacker pivots into BankX, or a software update is trojanised.',
    asset: 'Supplier remote access and software updates', threat: 'Supply-chain compromise', vulnerability: 'Standing vendor VPN accounts; SBOM only for top-10 suppliers',
    likelihood: 3, impact: 4, treatment: 'mitigate',
    treatmentPlan: 'Just-in-time vendor access through PAM; SBOM and update signing verification for all software suppliers; annual assurance for critical suppliers per BOT third-party expectations.',
    owner: VENDOR, status: 'open', linkedControlIds: ['5.19', '5.21', '5.22', '8.2'],
  },
  {
    title: 'Insider fraud through excessive access in payment operations',
    description: 'An operations employee with both initiation and approval rights processes fraudulent transfers or alters beneficiary details.',
    asset: 'Payment operations systems', threat: 'Malicious insider', vulnerability: 'SoD not enforced in cloud IAM roles; annual recertification for SaaS',
    likelihood: 2, impact: 4, treatment: 'mitigate',
    treatmentPlan: 'Enforce SoD in IAM policy; quarterly recertification for all payment-related applications; behavioural analytics use case in the SIEM.',
    owner: IAM, status: 'in_treatment', linkedControlIds: ['5.3', '5.18', '8.16', '6.1'], residualLikelihood: 1, residualImpact: 4,
  },
  {
    title: 'Prolonged outage from failure at the primary data centre',
    description: 'Fire, power or cooling failure at the Bangkok data centre exceeds the DR capability, breaching the BOT expectation of service continuity for critical systems.',
    asset: 'Primary data centre', threat: 'Environmental failure', vulnerability: 'DR site security and capacity not fully equivalent',
    likelihood: 2, impact: 5, treatment: 'mitigate',
    treatmentPlan: 'Bring DR-site controls to parity; semi-annual DR tests including digital channels; review RTO for the payment gateway.',
    owner: BCM, status: 'in_treatment', linkedControlIds: ['5.30', '5.29', '7.5', '7.11', '8.14'], residualLikelihood: 1, residualImpact: 4,
  },
  {
    title: 'Regulatory non-compliance with BOT cyber-resilience requirements',
    description: 'Gaps identified in the CRAF self-assessment (detection and third-party dimensions) are not closed by the committed date, leading to supervisory action.',
    asset: 'Regulatory standing', threat: 'Supervisory finding', vulnerability: 'Threat-intel process and supplier monitoring still partial',
    likelihood: 3, impact: 3, treatment: 'mitigate',
    treatmentPlan: 'Track CRAF remediation items in this register; monthly reporting to the Board Risk Committee; independent review before submission.',
    owner: COMP, status: 'open', linkedControlIds: ['5.31', '5.7', '5.22', '5.35'],
  },
  {
    title: 'Phishing of staff leads to business email compromise',
    description: 'Finance staff are tricked by a spoofed executive or vendor email into changing payment details for a supplier invoice.',
    asset: 'Corporate email and accounts payable', threat: 'Business email compromise', vulnerability: 'Manual verification of bank-detail changes',
    likelihood: 3, impact: 3, treatment: 'mitigate',
    treatmentPlan: 'Call-back verification for any bank-detail change; DMARC enforcement; targeted training for finance.',
    owner: 'Chief Financial Officer', status: 'closed', linkedControlIds: ['6.3', '5.14', '8.7'], residualLikelihood: 2, residualImpact: 2,
  },
  {
    title: 'ATM and card data compromise',
    description: 'Skimming, ATM malware or a breach of the card-processing environment exposes card data and triggers PCI DSS and scheme penalties.',
    asset: 'Card processing environment', threat: 'Card-present fraud, ATM malware', vulnerability: 'Older ATM fleet on unsupported OS',
    likelihood: 2, impact: 4, treatment: 'transfer',
    treatmentPlan: 'Cyber insurance covers card compromise costs; ATM OS upgrade programme continues; PCI DSS v4.0 assessment annually.',
    owner: 'Head of Cards and Payments', status: 'in_treatment', linkedControlIds: ['8.9', '8.8', '8.11'], residualLikelihood: 2, residualImpact: 3,
  },
  {
    title: 'Loss of an unencrypted laptop with customer data',
    description: 'A relationship manager loses a laptop containing customer statements exported for a meeting.',
    asset: 'Laptops and exported customer data', threat: 'Theft or loss', vulnerability: 'Exports to local disk permitted',
    likelihood: 2, impact: 2, treatment: 'accept',
    treatmentPlan: 'Full-disk encryption, remote wipe and DLP already in place; residual accepted by the CRO on 2026-06-30.',
    owner: CISO, status: 'closed', linkedControlIds: ['7.9', '8.1', '8.12'], residualLikelihood: 1, residualImpact: 2,
  },
];
