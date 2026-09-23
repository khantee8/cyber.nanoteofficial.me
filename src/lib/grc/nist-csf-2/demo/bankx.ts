/**
 * Demo CSF 2.0 profile for "BankX", the same fictional Thai digital bank as the
 * ISO 27001 demo. Current scores are set to agree (±1) with what its ISO statuses
 * suggest; Targets are mostly 6, and 7 where Bank of Thailand supervision presses
 * hardest (identity, monitoring, supply chain). Everything here is invented.
 */
import type { TestingStatus } from '../types';

export interface DemoCsfScore {
  subcategoryId: string; current: number; target: number; owner: string;
  testingStatus: TestingStatus; examined: boolean; interviewed: boolean; tested: boolean;
  observedAt: string | null; notes: string;
}

export const bankxCsfProfile = {
  scope: 'Retail digital banking (mobile app, internet banking, payment APIs, PromptPay gateway), the core banking platform and its Bangkok, Chonburi and public-cloud infrastructure — the same boundary as the ISO 27001 ISMS.',
  currentTier: 2 as const,
  targetTier: 3 as const,
};

const CISO = 'Head of Information Security (CISO)';
const RISK = 'Chief Risk Officer';
const SOC = 'SOC Manager';
const INFRA = 'Head of Infrastructure';
const APPS = 'Head of Application Development';
const VENDOR = 'Vendor Management Lead';
const DPO = 'Data Protection Officer';
const BCM = 'Business Continuity Manager';
const HR = 'Head of People';

// [id, current, target, owner, testing, methods ('E' | 'I' | 'T' letters), observedAt, note]
type Row = [string, number, number, string, TestingStatus, string, string | null, string];
const rows: Row[] = [
  ['GV.OC-01', 4, 6, CISO, 'not_started', '', null, 'BankX\'s digital-first retail banking mission is referenced in ISP-001 but a mission-to-cybersecurity-strategy narrative has not been formally documented for the board.'],
  ['GV.OC-02', 4, 6, CISO, 'not_started', '', null, 'Stakeholder expectations from customers, BOT and card schemes are addressed ad hoc in project charters; no consolidated stakeholder register exists yet.'],
  ['GV.OC-03', 5, 6, RISK, 'complete', 'EI', '2026-08-05', 'The regulatory obligations register (BOT IT Risk Management Guidelines, CRAF, PDPA, Cybersecurity Act, PCI DSS v4.0) is reviewed against the security policy annually and signed off by the CRO.'],
  ['GV.OC-04', 5, 6, CISO, 'complete', 'EI', '2026-08-05', 'The obligations register and vendor SLAs document the digital banking services BOT and card schemes expect BankX to sustain.'],
  ['GV.OC-05', 3, 6, CISO, 'in_progress', '', null, 'Dependencies on the core banking, payment network and cloud services are known informally, but the segregation-of-duties gaps in cloud IAM roles mean the dependency picture for those roles is still being formalised.'],
  ['GV.RM-01', 5, 6, RISK, 'complete', 'EI', '2026-07-10', 'Risk appetite and objectives for the ISMS are set out in ISP-001 and endorsed by the Board Risk Committee each February.'],
  ['GV.RM-02', 5, 6, RISK, 'complete', 'EI', '2026-07-10', 'Risk appetite bands from critical to low are published in the risk methodology and referenced when treating fraud and outage risks.'],
  ['GV.RM-03', 5, 6, RISK, 'complete', 'EI', '2026-07-10', 'Cybersecurity risk items flow into the enterprise risk register reviewed quarterly by the Board Risk Committee alongside credit and market risk.'],
  ['GV.RM-04', 5, 6, RISK, 'complete', 'EI', '2026-07-10', 'Strategic response direction, whether mitigate, transfer or accept, is documented per risk in the register, as seen in the ATM card-compromise risk\'s transfer to insurance.'],
  ['GV.RM-05', 5, 6, RISK, 'complete', 'EI', '2026-07-15', 'Escalation lines for supplier and third-party risk run from the Vendor Management Lead through the CRO to the Board Risk Committee.'],
  ['GV.RM-06', 5, 6, RISK, 'complete', 'EI', '2026-07-15', 'Risks are scored on a consistent five-by-five likelihood-and-impact matrix across all twelve entries in the risk register.'],
  ['GV.RM-07', 3, 6, RISK, 'not_started', '', null, 'BankX has not yet framed any positive or opportunity risks, such as faster fraud detection from new data sources, inside the cybersecurity risk discussion.'],
  ['GV.RR-01', 5, 6, CISO, 'complete', 'EI', '2026-08-12', 'The CISO reports to the CRO and the Board Risk Committee holds the CISO accountable for the ISMS, per the RACI in ISP-001 Annex B.'],
  ['GV.RR-02', 4, 6, CISO, 'not_started', '', null, 'The RACI in ISP-001 Annex B lists tasks but has not been re-validated against the current organisation chart since the 2025 restructuring.'],
  ['GV.RR-03', 4, 6, CISO, 'not_started', '', null, 'Security budget is approved annually but is not formally tied to the risk strategy or to named roles in a resourcing plan.'],
  ['GV.RR-04', 5, 6, HR, 'complete', 'EI', '2026-07-08', 'Security responsibilities sit in the Code of Conduct, background screening covers privileged and treasury roles, and leaver access is revoked same-day through the HRIS workflow.'],
  ['GV.PO-01', 5, 6, CISO, 'complete', 'EI', '2026-08-01', 'ISP-001 and its fourteen topic policies were approved by the Board Risk Committee in February 2026 and communicated on the intranet.'],
  ['GV.PO-02', 5, 6, CISO, 'complete', 'EI', '2026-08-01', 'Policy review is timed to the BOT IT Risk Management Guidelines self-assessment cycle, so a change in regulation triggers a policy update.'],
  ['GV.OV-01', 5, 6, RISK, 'complete', 'EI', '2026-08-20', 'Risk management strategy outcomes are reported to the Board Risk Committee, which last adjusted the digital-channel risk appetite after the 2025 malware surge.'],
  ['GV.OV-02', 5, 6, RISK, 'complete', 'EI', '2026-08-20', 'Coverage of the strategy against the CRAF self-assessment dimensions is reviewed twice a year alongside supplier and detection gaps.'],
  ['GV.OV-03', 5, 6, RISK, 'complete', 'EI', '2026-08-20', 'Performance is evaluated against KPIs such as patch SLA, phishing click rate and DR-test results, presented to the Board Risk Committee.'],
  ['GV.SC-01', 4, 7, VENDOR, 'in_progress', '', null, 'A supply-chain risk programme exists inside the third-party risk framework, but SBOM collection covering only the top-ten suppliers means the programme\'s reach across the wider ICT chain is still maturing.'],
  ['GV.SC-02', 5, 7, VENDOR, 'complete', 'EI', '2026-07-22', 'Vendor contracts define security roles and a twenty-four-hour incident-notification duty, coordinated internally by the Vendor Management Lead and the CISO.'],
  ['GV.SC-03', 4.5, 7, VENDOR, 'in_progress', '', null, 'Supply-chain risk is scored on the same five-by-five matrix as other enterprise risks, but the annual review of critical suppliers is not yet as rigorous as the tiering and contracting steps that feed it.'],
  ['GV.SC-04', 4, 7, VENDOR, 'in_progress', '', null, 'Suppliers are tiered by data access and criticality, though inventories of the specific services each supplier provides are not consistently kept current outside the top-ten tier.'],
  ['GV.SC-05', 5, 7, VENDOR, 'complete', 'EIT', '2026-07-22', 'Security schedules, right-to-audit clauses and a twenty-four-hour incident-notification duty are standard in BankX vendor contracts, verified during the 2026 TPRM refresh.'],
  ['GV.SC-06', 5, 7, VENDOR, 'complete', 'EI', '2026-07-22', 'Due diligence follows the BOT outsourcing and third-party risk expectations before any new supplier relationship for the core banking or payment stack is signed.'],
  ['GV.SC-07', 5, 7, VENDOR, 'complete', 'EIT', '2026-07-25', 'Supplier risk is tiered, recorded in the TPRM register and monitored through annual reviews for critical suppliers, tested during the 2026 core-banking vendor assessment.'],
  ['GV.SC-08', 5, 7, VENDOR, 'complete', 'EI', '2026-07-25', 'Suppliers with system access are named in the Incident Response Plan\'s contact list and rehearsed in the twice-yearly tabletop.'],
  ['GV.SC-09', 4, 7, VENDOR, 'in_progress', '', null, 'Supply-chain security is folded into the enterprise risk process, but continuous performance monitoring across the technology life cycle exists only for the top-ten supplier tier.'],
  ['GV.SC-10', 4, 7, VENDOR, 'in_progress', '', null, 'Off-boarding provisions exist in standard contract templates, but a documented post-termination checklist for access removal and data return is not yet applied below the top-ten tier.'],
  ['ID.AM-01', 5, 6, INFRA, 'complete', 'ET', '2026-08-10', 'The CMDB records every server, network device and cloud resource with a named owner and is reconciled monthly against the cloud inventory.'],
  ['ID.AM-02', 5, 6, INFRA, 'complete', 'ET', '2026-08-10', 'Software, services and systems are tracked in the same CMDB reconciliation used for hardware, covering the core banking platform and its supporting services.'],
  ['ID.AM-03', 4.5, 6, INFRA, 'in_progress', '', null, 'Network data-flow diagrams exist for the payment and PCI zones from the 2025 architecture review, but the flat segments between other server zones mean the map is not yet complete.'],
  ['ID.AM-04', 3, 6, VENDOR, 'not_started', '', null, 'BankX tiers suppliers by criticality but keeps no standing inventory of the specific services each supplier provides outside the annual review cycle.'],
  ['ID.AM-05', 4.5, 6, DPO, 'in_progress', '', null, 'Assets are prioritised using the four-level classification scheme, but M365 sensitivity labels have not reached the legacy file shares that also hold Restricted data.'],
  ['ID.AM-07', 5, 6, DPO, 'complete', 'ET', '2026-08-10', 'Customer PII, transaction records and other Restricted data types are catalogued in the PDPA data map maintained by the Data Protection Officer.'],
  ['ID.AM-08', 4.5, 6, INFRA, 'in_progress', '', null, 'Life-cycle management runs end-to-end for CMDB-tracked hardware and software, but a security review gate is still skipped by agile squads on minor releases.'],
  ['ID.RA-01', 3, 6, INFRA, 'in_progress', '', null, 'Monthly authenticated scans record vulnerabilities against a fourteen-day patch SLA, but legacy core banking modules still run past that SLA, so validation coverage is incomplete.'],
  ['ID.RA-02', 3.5, 6, SOC, 'in_progress', '', null, 'TB-CERT and commercial threat feeds already reach the SIEM, but BankX has not yet documented formal threat-intelligence requirements, targeted for Q4 2026.'],
  ['ID.RA-03', 3.5, 6, SOC, 'in_progress', '', null, 'Internal and external threats are logged from SIEM use cases and TB-CERT advisories, though a single consolidated threat register is still in design.'],
  ['ID.RA-04', 4, 6, RISK, 'not_started', '', null, 'Impact and likelihood modelling for individual vulnerabilities has not yet been separated from the risk register\'s asset-level scoring.'],
  ['ID.RA-05', 3, 6, RISK, 'in_progress', '', null, 'Threat and vulnerability inputs feed the five-by-five matrix for the twelve named risks, but the same discipline has not reached day-to-day vulnerability triage.'],
  ['ID.RA-06', 3, 6, RISK, 'in_progress', '', null, 'Risk responses for the twelve register entries are tracked to completion, though threat-intelligence-driven responses below register level are ad hoc.'],
  ['ID.RA-07', 5, 6, INFRA, 'complete', 'ET', '2026-07-18', 'The weekly Change Advisory Board assesses every change for risk impact and traces it in the ITSM tool, with an emergency path for urgent fixes.'],
  ['ID.RA-08', 3, 6, INFRA, 'not_started', '', null, 'BankX has no published channel or process for receiving vulnerability disclosures from external researchers.'],
  ['ID.RA-09', 4.5, 6, VENDOR, 'complete', 'EI', '2026-07-28', 'Hardware and software authenticity checks run through the third-party risk programme\'s contracting and onboarding steps before go-live.'],
  ['ID.RA-10', 4.5, 6, VENDOR, 'complete', 'EI', '2026-07-28', 'Critical suppliers such as the core banking and ATM services vendors are assessed under the TPRM framework before the relationship is signed.'],
  ['ID.IM-01', 5, 6, CISO, 'complete', 'EI', '2026-08-30', 'The annual internal ISMS audit and the scheduled November 2026 surveillance audit both feed a tracked list of improvement actions.'],
  ['ID.IM-02', 5, 6, CISO, 'complete', 'EI', '2026-08-30', 'Findings from the annual digital-channel penetration test and DR exercises are logged as improvement items, including ones raised jointly with suppliers.'],
  ['ID.IM-03', 3, 6, SOC, 'in_progress', '', null, 'Post-incident reviews happen for Sev-1 and Sev-2 incidents, but lessons are not yet fed back into controls consistently.'],
  ['ID.IM-04', 4.5, 6, SOC, 'complete', 'EI', '2026-08-18', 'The Incident Response Plan, its severity matrix and the BOT reporting workflow are updated after each tabletop and real incident.'],
  ['PR.AA-01', 4, 7, CISO, 'in_progress', '', null, 'Identities and credentials for staff, service accounts and hardware follow the Access Control Policy, though device binding and biometric enforcement still allows OTP-only paths on legacy internet banking.'],
  ['PR.AA-02', 4.5, 7, CISO, 'in_progress', '', null, 'Identity proofing binds core-banking and cloud identities to credentials via the vault and PAM, but the same legacy internet-banking gap limits proofing strength for some transaction types.'],
  ['PR.AA-03', 4, 7, CISO, 'in_progress', '', null, 'MFA covers staff accounts and mobile-banking customers use device binding, PIN and facial biometrics per BOT guidance, while legacy internet banking\'s OTP-only paths remain the authentication gap.'],
  ['PR.AA-04', 5, 7, CISO, 'complete', 'ET', '2026-07-20', 'Session tokens and identity assertions for staff access run through the vault-backed identity provider with signed, time-bound tokens.'],
  ['PR.AA-05', 4.5, 7, CISO, 'in_progress', '', null, 'Access Control Policy ISP-004 defines least privilege and role-based access for core banking, but the segregation-of-duties matrix is not yet enforced in cloud data-platform IAM roles.'],
  ['PR.AA-06', 5, 7, CISO, 'complete', 'ET', '2026-07-05', 'Badge-plus-biometric entry, visitor escort and one-year log retention protect the data centre, treasury and SOC rooms.'],
  ['PR.AT-01', 5, 6, HR, 'complete', 'EI', '2026-08-05', 'Ninety-seven percent of staff complete the annual e-learning and the August 2026 phishing simulation recorded a 4.1 percent click rate.'],
  ['PR.AT-02', 5, 6, HR, 'complete', 'EI', '2026-08-05', 'Developers and SOC analysts receive role-based training beyond the general awareness curriculum, coordinated with the CISO\'s office.'],
  ['PR.DS-01', 4.5, 6, DPO, 'in_progress', '', null, 'Data-at-rest protections span encrypted laptops, masked non-production data and tokenised card PANs, but printouts found in branch back offices during audit show clear-desk enforcement is still catching up.'],
  ['PR.DS-02', 4.5, 6, DPO, 'complete', 'ET', '2026-07-30', 'TLS 1.2-and-above is enforced network-wide, and interbank and regulator submissions use mutual-TLS SFTP with DLP on Restricted data in transit.'],
  ['PR.DS-10', 4.5, 6, DPO, 'complete', 'ET', '2026-07-30', 'Production data is masked in non-production environments and card PANs are tokenised, so data-in-use exposure is limited even during testing.'],
  ['PR.DS-11', 5, 6, INFRA, 'complete', 'ET', '2026-07-12', 'Immutable, three-two-one backups are restore-tested quarterly, with the last full restore test in July 2026 passing.'],
  ['PR.PS-01', 3, 6, INFRA, 'not_started', '', null, 'CIS benchmarks are applied to servers and network devices, but a cloud configuration baseline is still under development, so configuration management is not yet one monitored practice.'],
  ['PR.PS-02', 5, 6, INFRA, 'complete', 'ET', '2026-08-01', 'Software life-cycle decisions are tracked in the CMDB, which is reconciled monthly against the cloud inventory.'],
  ['PR.PS-03', 5, 6, INFRA, 'complete', 'ET', '2026-08-01', 'Hardware replacement follows the same CMDB-driven life-cycle process as software.'],
  ['PR.PS-04', 5, 6, INFRA, 'complete', 'ET', '2026-08-15', 'Central SIEM logging with one-year online retention and integrity protection makes log records available for continuous monitoring.'],
  ['PR.PS-05', 5, 6, INFRA, 'complete', 'ET', '2026-08-15', 'Application allow-listing on servers and endpoints, enforced through change management, blocks unauthorised software installation.'],
  ['PR.PS-06', 4, 6, APPS, 'in_progress', '', null, 'Secure coding standards, SAST and dependency scanning run in CI, but threat modelling has only been completed for the mobile app, not for all API services.'],
  ['PR.IR-01', 4.5, 6, INFRA, 'complete', 'ET', '2026-08-02', 'Next-generation firewalls, IPS and NAC, reviewed in the 2025 network architecture assessment, protect BankX\'s network zones from unauthorised logical access.'],
  ['PR.IR-02', 5, 6, INFRA, 'complete', 'ET', '2026-07-05', 'FM-200 fire suppression, flood sensors and seismic-rated racks protect the data centre\'s technology assets from environmental threats.'],
  ['PR.IR-03', 4, 6, BCM, 'in_progress', '', null, 'Active-active resilience for digital channels and active-passive DR for core banking exist, but DR-site security controls are not yet fully equivalent to the primary site.'],
  ['PR.IR-04', 5, 6, INFRA, 'complete', 'ET', '2026-08-10', 'Capacity monitoring with six-month forecasting and auto-scaling on the API tier keep availability ahead of demand.'],
  ['DE.CM-01', 5, 7, SOC, 'complete', 'ET', '2026-08-16', 'Round-the-clock SOC monitoring includes SIEM use cases for mass login failures and new-device enrolment spikes across the network.'],
  ['DE.CM-02', 5, 7, SOC, 'complete', 'ET', '2026-07-06', 'CCTV and intrusion detection at the data centre and offices are monitored by the guard force with alarms routed to the SOC.'],
  ['DE.CM-03', 5, 7, SOC, 'complete', 'ET', '2026-08-16', 'Personnel activity and technology usage feed the same SIEM use cases the SOC watches around the clock.'],
  ['DE.CM-06', 4, 7, SOC, 'in_progress', '', null, 'External service-provider activity reaches the SIEM for the outsourced Level-1 SOC and top-ten suppliers, but broader third-party monitoring is only informal for the rest.'],
  ['DE.CM-09', 5, 7, SOC, 'complete', 'ET', '2026-08-16', 'Computing hardware, software and runtime environments are monitored through the same central SIEM logging pipeline.'],
  ['DE.AE-02', 5, 6, SOC, 'complete', 'EI', '2026-08-14', 'SIEM triage playbooks and the event-to-incident decision criteria in the Incident Response Plan drive analysis of potentially adverse events, including the account-takeover use cases.'],
  ['DE.AE-03', 5, 6, SOC, 'complete', 'ET', '2026-08-14', 'Central SIEM logging correlates information across network, endpoint and application sources with one-year retention.'],
  ['DE.AE-04', 5, 6, SOC, 'complete', 'EI', '2026-08-14', 'Incident severity and scope are estimated using the criteria in the Incident Response Plan\'s severity matrix.'],
  ['DE.AE-06', 5, 6, SOC, 'complete', 'EI', '2026-08-16', 'The round-the-clock SOC and the on-call escalation path share event information with authorised staff and response tooling.'],
  ['DE.AE-07', 3, 6, SOC, 'in_progress', '', null, 'TB-CERT and commercial threat-intelligence feeds are consumed in the SIEM, but a formal process to integrate that intelligence into every analysis is still being documented.'],
  ['DE.AE-08', 5, 6, SOC, 'complete', 'EI', '2026-08-16', 'Incidents are declared against the severity matrix and decision criteria set out in the Incident Response Plan.'],
  ['RS.MA-01', 4.5, 6, SOC, 'complete', 'EI', '2026-08-22', 'The Incident Response Plan is executed in coordination with named suppliers and TB-CERT once a Sev-1 or Sev-2 incident is declared, rehearsed in the twice-yearly tabletop.'],
  ['RS.MA-02', 4.5, 6, SOC, 'complete', 'EI', '2026-08-22', 'The SOC\'s Level-1, -2 and -3 triage model validates incident reports before escalation, using the report-phishing button and hotline as intake channels.'],
  ['RS.MA-03', 5, 6, SOC, 'complete', 'EI', '2026-08-22', 'The Incident Response Plan\'s severity matrix categorises and prioritises incidents from Sev-1 to Sev-4.'],
  ['RS.MA-04', 5, 6, SOC, 'complete', 'EI', '2026-08-24', 'Escalation paths from the outsourced Level-1 SOC to in-house Level-2 and -3 and to executive stakeholders follow the Incident Response Plan.'],
  ['RS.MA-05', 5, 6, SOC, 'complete', 'EI', '2026-08-24', 'The same severity matrix that triggers containment also sets the criteria for moving an incident into recovery.'],
  ['RS.AN-03', 4, 6, SOC, 'in_progress', '', null, 'Root-cause analysis is performed for Sev-1 and Sev-2 incidents, but lessons are not consistently fed back into controls, mirroring the post-incident-review gap already tracked in the ISMS.'],
  ['RS.AN-06', 5, 6, SOC, 'complete', 'ET', '2026-08-26', 'Forensic readiness procedures with documented chain of custody preserve the integrity of investigation records.'],
  ['RS.AN-07', 5, 6, SOC, 'complete', 'ET', '2026-08-26', 'Incident data and metadata are captured under the same forensic chain-of-custody procedure.'],
  ['RS.AN-08', 5, 6, SOC, 'complete', 'EI', '2026-08-24', 'Incident magnitude is estimated and validated against the severity matrix before an escalation decision is made.'],
  ['RS.CO-02', 5, 6, SOC, 'complete', 'EI', '2026-08-24', 'BOT, ThaiCERT, TB-CERT and PDPC notification steps and deadlines are documented in the incident plan\'s contact list and rehearsed in the 2025 tabletop.'],
  ['RS.CO-03', 5, 6, SOC, 'complete', 'EI', '2026-08-24', 'Information sharing with designated internal executives and external bodies follows the same incident-plan contact list and TB-CERT membership.'],
  ['RS.MI-01', 5, 6, SOC, 'complete', 'ET', '2026-08-22', 'Containment playbooks cover phishing, malware, account takeover and DDoS scenarios used by the round-the-clock SOC.'],
  ['RS.MI-02', 5, 6, SOC, 'complete', 'ET', '2026-08-22', 'Eradication follows the same playbook set as containment, closed out through the post-incident review step.'],
  ['RC.RP-01', 5, 6, BCM, 'complete', 'ET', '2026-07-14', 'The recovery section of the Incident Response Plan is executed from the disaster-recovery site in Chonburi once the incident-response process hands off to recovery.'],
  ['RC.RP-02', 5, 6, BCM, 'complete', 'ET', '2026-07-14', 'Recovery actions for core banking follow the four-hour RTO and fifteen-minute RPO targets validated in the March 2026 DR test.'],
  ['RC.RP-03', 5, 6, INFRA, 'complete', 'ET', '2026-07-12', 'Backup integrity is verified as part of the quarterly restore test, most recently passing in July 2026.'],
  ['RC.RP-04', 3, 6, BCM, 'not_started', '', null, 'BankX has not yet defined post-incident operational norms that weigh critical mission functions against ongoing cybersecurity risk management.'],
  ['RC.RP-05', 5, 6, BCM, 'complete', 'ET', '2026-07-14', 'Restored-asset integrity checks and a return-to-normal confirmation are part of the DR runbook exercised in March 2026.'],
  ['RC.RP-06', 4, 6, BCM, 'in_progress', '', null, 'Recovery close-out criteria exist in the Incident Response Plan, but the post-incident lessons-learned step that should feed the closing documentation is not consistently completed.'],
  ['RC.CO-03', 5, 6, BCM, 'complete', 'EI', '2026-08-24', 'Recovery progress is communicated to designated stakeholders through the same channels used for incident notification, including TB-CERT and BOT.'],
  ['RC.CO-04', 3, 6, CISO, 'not_started', '', null, 'BankX has no approved public-messaging playbook for customer-facing updates during a recovery, beyond ad hoc statements drafted during the 2025 malware surge.'],
];

export const bankxCsfScores: DemoCsfScore[] = rows.map(([subcategoryId, current, target, owner, testingStatus, m, observedAt, notes]) => ({
  subcategoryId, current, target, owner, testingStatus,
  examined: m.includes('E'), interviewed: m.includes('I'), tested: m.includes('T'),
  observedAt, notes,
}));
