import { randomUUID } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

export const AGENTLENS_UPDATES_RETENTION_DAYS = 365;
export const AGENTLENS_UPDATES_CONSENT_VERSION = 'agentlens-product-updates/v1';

let schemaPromise: Promise<void> | null = null;

function database() {
  const connectionString = process.env.DATABASE_URL?.trim();
  return connectionString ? neon(connectionString) : null;
}

async function ensureSchema(sql: NonNullable<ReturnType<typeof database>>) {
  schemaPromise ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS iswebmcp_agentlens_updates (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        consented_at timestamptz NOT NULL DEFAULT now(),
        consent_version text NOT NULL,
        CHECK (length(email) BETWEEN 3 AND 254),
        CHECK (email = lower(email)),
        CHECK (consent_version = 'agentlens-product-updates/v1')
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS iswebmcp_agentlens_updates_consented_at_idx
      ON iswebmcp_agentlens_updates (consented_at DESC)
    `;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

export function agentLensUpdatesStorageConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function saveAgentLensUpdateSignup(email: string): Promise<void> {
  const sql = database();
  if (!sql) throw new Error('STORAGE_UNAVAILABLE');

  await ensureSchema(sql);
  await sql`
    WITH expired AS (
      DELETE FROM iswebmcp_agentlens_updates
      WHERE consented_at < now() - (${AGENTLENS_UPDATES_RETENTION_DAYS} * interval '1 day')
    )
    INSERT INTO iswebmcp_agentlens_updates (
      id,
      email,
      consented_at,
      consent_version
    ) VALUES (
      ${randomUUID()}::uuid,
      ${email.trim().toLowerCase()},
      now(),
      ${AGENTLENS_UPDATES_CONSENT_VERSION}
    )
    ON CONFLICT (email) DO NOTHING
  `;
}
