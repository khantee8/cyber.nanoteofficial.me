import {
  integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex,
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
export const organisations = pgTable('organisation', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ownerId: text('ownerId').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  scope: text('scope'),
  industry: text('industry'),
  sizeBand: text('sizeBand', { enum: ['1-10', '11-50', '51-250', '251-1000', '1000+'] }),
  ismsLead: text('ismsLead'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

export const riskMethodologies = pgTable('risk_methodology', {
  organisationId: text('organisationId').primaryKey().references(() => organisations.id, { onDelete: 'cascade' }),
  lowMax: integer('lowMax').notNull().default(4),
  mediumMax: integer('mediumMax').notNull().default(9),
  highMax: integer('highMax').notNull().default(15),
  acceptMax: integer('acceptMax').notNull().default(4),
});

export const controlStatuses = pgTable('control_status', {
  organisationId: text('organisationId').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
  framework: text('framework').notNull(),
  controlId: text('controlId').notNull(),
  status: text('status', { enum: ['not_started', 'partial', 'implemented', 'not_applicable'] }).notNull().default('not_started'),
  justification: text('justification'),
  owner: text('owner'),
  evidenceUrls: jsonb('evidenceUrls').$type<string[]>().notNull().default([]),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.organisationId, t.framework, t.controlId] })]);

export const risks = pgTable('risk', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organisationId: text('organisationId').notNull().references(() => organisations.id, { onDelete: 'cascade' }),
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
  residualLikelihood: integer('residualLikelihood'),
  residualImpact: integer('residualImpact'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
}, (t) => [uniqueIndex('risk_org_ref').on(t.organisationId, t.ref)]);

export type Organisation = typeof organisations.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type ControlStatusRow = typeof controlStatuses.$inferSelect;
