import { randomUUID } from 'node:crypto';

import { neon } from '@neondatabase/serverless';

import { normalizePublicUrl } from '@/lib/network';

export const URL_ATTEMPT_RETENTION_DAYS = 90;

export type UrlAttemptSurface = 'web' | 'integration' | 'mcp';

export interface StoredAttemptUrl {
  safeUrl: string;
  hostname: string;
  queryRedacted: boolean;
}

export interface UrlAttemptHandle {
  id: string;
}

interface CompleteUrlAttemptInput {
  outcome: 'succeeded' | 'failed';
  errorCode?: string;
  responseStatus?: number;
  reportId?: string;
}

let schemaPromise: Promise<void> | null = null;

function database() {
  const connectionString = process.env.DATABASE_URL?.trim();
  return connectionString ? neon(connectionString) : null;
}

async function ensureSchema(sql: NonNullable<ReturnType<typeof database>>) {
  schemaPromise ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS iswebmcp_url_attempts (
        id uuid PRIMARY KEY,
        attempted_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        surface text NOT NULL CHECK (surface IN ('web', 'integration', 'mcp')),
        safe_url text,
        hostname text,
        query_redacted boolean NOT NULL DEFAULT false,
        outcome text NOT NULL DEFAULT 'started'
          CHECK (outcome IN ('started', 'succeeded', 'failed')),
        error_code text,
        response_status integer,
        report_id text,
        CHECK (safe_url IS NULL OR length(safe_url) <= 2048),
        CHECK (hostname IS NULL OR length(hostname) <= 253),
        CHECK (error_code IS NULL OR length(error_code) <= 80),
        CHECK (report_id IS NULL OR length(report_id) <= 80)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS iswebmcp_url_attempts_attempted_at_idx
      ON iswebmcp_url_attempts (attempted_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS iswebmcp_url_attempts_hostname_idx
      ON iswebmcp_url_attempts (hostname, attempted_at DESC)
    `;
  })().catch((error) => {
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

function persistenceFailure(stage: 'start' | 'completion', error: unknown) {
  const kind = error instanceof Error ? error.name : 'UnknownError';
  console.error(`URL attempt ${stage} persistence failed (${kind}).`);
}

/**
 * Returns the portion of a public target that is safe to retain. Query strings,
 * fragments, and credentials are never stored. Unsafe or malformed targets are
 * represented by a row with a null URL so the rejected attempt is counted
 * without retaining private or secret-bearing input.
 */
export function sanitizeAttemptUrl(raw: string): StoredAttemptUrl | null {
  let supplied: URL;
  try {
    supplied = new URL(raw.trim());
  } catch {
    return null;
  }

  try {
    const normalized = normalizePublicUrl(raw);
    const queryRedacted = Boolean(supplied.search || supplied.hash);
    normalized.username = '';
    normalized.password = '';
    normalized.search = '';
    normalized.hash = '';
    return {
      safeUrl: normalized.toString(),
      hostname: normalized.hostname.toLowerCase().replace(/\.$/, ''),
      queryRedacted,
    };
  } catch {
    return null;
  }
}

export function urlAttemptStorageConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function beginUrlAttempt(
  rawUrl: string,
  surface: UrlAttemptSurface,
): Promise<UrlAttemptHandle | null> {
  const sql = database();
  if (!sql) return null;

  const id = randomUUID();
  const safe = sanitizeAttemptUrl(rawUrl);
  try {
    await ensureSchema(sql);
    await sql`
      WITH expired AS (
        DELETE FROM iswebmcp_url_attempts
        WHERE attempted_at < now() - (${URL_ATTEMPT_RETENTION_DAYS} * interval '1 day')
      )
      INSERT INTO iswebmcp_url_attempts (
        id,
        surface,
        safe_url,
        hostname,
        query_redacted
      ) VALUES (
        ${id}::uuid,
        ${surface},
        ${safe?.safeUrl ?? null},
        ${safe?.hostname ?? null},
        ${safe?.queryRedacted ?? false}
      )
    `;
    return { id };
  } catch (error) {
    persistenceFailure('start', error);
    return null;
  }
}

export async function completeUrlAttempt(
  handle: UrlAttemptHandle | null,
  input: CompleteUrlAttemptInput,
): Promise<void> {
  if (!handle) return;
  const sql = database();
  if (!sql) return;

  try {
    await ensureSchema(sql);
    await sql`
      UPDATE iswebmcp_url_attempts
      SET
        completed_at = now(),
        outcome = ${input.outcome},
        error_code = ${input.errorCode ?? null},
        response_status = ${input.responseStatus ?? null},
        report_id = ${input.reportId ?? null}
      WHERE id = ${handle.id}::uuid
    `;
  } catch (error) {
    persistenceFailure('completion', error);
  }
}
