import {
  boolean, date, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ── Auth.js tables ──────────────────────────────────────────
export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  approvedAt: timestamp('approvedAt', { mode: 'date' }),
});

export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccountType>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

// ── Access requests ─────────────────────────────────────────
export const accessRequests = pgTable('access_request', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  message: text('message'),
  ip: text('ip'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  decidedAt: timestamp('decidedAt', { mode: 'date' }),
});

// ── GRC ─────────────────────────────────────────────────────
export const FRAMEWORK_IDS = ['iso27001', 'nist-csf-2'] as const;
export type FrameworkId = (typeof FRAMEWORK_IDS)[number];
export const ASSESSMENT_STATUSES = ['draft', 'in_progress', 'complete', 'archived'] as const;
export const SIZE_BANDS = ['1-10', '11-50', '51-250', '251-1000', '1000+'] as const;

export const customers = pgTable('customer', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  industry: text('industry'),
  sizeBand: text('sizeBand', { enum: SIZE_BANDS }),
  notes: text('notes'),
  createdBy: text('createdBy').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  archivedAt: timestamp('archivedAt', { mode: 'date' }),
});

export const folders = pgTable('folder', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customerId').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  parentId: text('parentId').references((): AnyPgColumn => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [index('folder_customer_parent').on(t.customerId, t.parentId)]);

export const assessments = pgTable('assessment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customerId').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  folderId: text('folderId').references(() => folders.id, { onDelete: 'set null' }),
  framework: text('framework').notNull(),
  title: text('title').notNull(),
  fiscalYear: integer('fiscalYear'),
  periodStart: date('periodStart', { mode: 'string' }),
  periodEnd: date('periodEnd', { mode: 'string' }),
  status: text('status', { enum: ASSESSMENT_STATUSES }).notNull().default('draft'),
  scope: text('scope'),
  lead: text('lead'),
  basedOnId: text('basedOnId').references((): AnyPgColumn => assessments.id, { onDelete: 'set null' }),
  createdBy: text('createdBy').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [index('assessment_customer_folder').on(t.customerId, t.folderId)]);

export const riskMethodologies = pgTable('risk_methodology', {
  customerId: text('customerId').primaryKey().references(() => customers.id, { onDelete: 'cascade' }),
  lowMax: integer('lowMax').notNull().default(4),
  mediumMax: integer('mediumMax').notNull().default(9),
  highMax: integer('highMax').notNull().default(15),
  acceptMax: integer('acceptMax').notNull().default(4),
});

export const controlStatuses = pgTable('control_status', {
  assessmentId: text('assessmentId').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  controlId: text('controlId').notNull(),
  status: text('status', { enum: ['not_started', 'partial', 'implemented', 'not_applicable'] }).notNull().default('not_started'),
  justification: text('justification'),
  owner: text('owner'),
  evidenceUrls: jsonb('evidenceUrls').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.assessmentId, t.controlId] })]);

export const risks = pgTable('risk', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customerId').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  framework: text('framework').notNull(),
  ref: text('ref').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  asset: text('asset'),
  threat: text('threat'),
  vulnerability: text('vulnerability'),
  likelihood: integer('likelihood').notNull(),
  impact: integer('impact').notNull(),
  treatment: text('treatment', { enum: ['mitigate', 'accept', 'transfer', 'avoid'] }).notNull().default('mitigate'),
  treatmentPlan: text('treatmentPlan'),
  owner: text('owner'),
  status: text('status', { enum: ['open', 'in_treatment', 'closed'] }).notNull().default('open'),
  linkedControlIds: jsonb('linkedControlIds').$type<string[]>().notNull().default([]),
  linkedCsfIds: jsonb('linkedCsfIds').$type<string[]>().notNull().default([]),
  residualLikelihood: integer('residualLikelihood'),
  residualImpact: integer('residualImpact'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [uniqueIndex('risk_customer_ref').on(t.customerId, t.ref)]);

export const csfScores = pgTable('csf_score', {
  assessmentId: text('assessmentId').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  subcategoryId: text('subcategoryId').notNull(),
  current: real('current'),
  target: real('target'),
  inScope: boolean('inScope').notNull().default(true),
  owner: text('owner'),
  testingStatus: text('testingStatus', { enum: ['not_started', 'in_progress', 'complete'] }).notNull().default('not_started'),
  examined: boolean('examined').notNull().default(false),
  interviewed: boolean('interviewed').notNull().default(false),
  tested: boolean('tested').notNull().default(false),
  observedAt: date('observedAt', { mode: 'string' }),
  notes: text('notes'),
  evidenceUrls: jsonb('evidenceUrls').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.assessmentId, t.subcategoryId] })]);

export const csfProfiles = pgTable('csf_profile', {
  assessmentId: text('assessmentId').primaryKey().references(() => assessments.id, { onDelete: 'cascade' }),
  scope: text('scope'),
  currentTier: integer('currentTier'),
  targetTier: integer('targetTier'),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type ControlStatusRow = typeof controlStatuses.$inferSelect;
export type CsfScore = typeof csfScores.$inferSelect;
export type CsfProfile = typeof csfProfiles.$inferSelect;

// ── Threat Intel ────────────────────────────────────────────
export const intelSources = pgTable('intel_source', {
  source: text('source').primaryKey(),
  data: jsonb('data'),
  fetchedAt: timestamp('fetchedAt', { mode: 'date' }),
  attemptedAt: timestamp('attemptedAt', { mode: 'date' }).notNull().defaultNow(),
  error: text('error'),
  etag: text('etag'),
  lastModified: text('lastModified'),
});
export type IntelSourceRow = typeof intelSources.$inferSelect;

/** One row ('intel'): when a refresh last started. Claimed atomically so concurrent visits start at most one. */
export const intelRefresh = pgTable('intel_refresh', {
  id: text('id').primaryKey(),
  claimedAt: timestamp('claimedAt', { mode: 'date' }).notNull(),
});
