# URL-attempt analytics operations

isWebMCP records admitted scan attempts from the web UI, native integration
endpoint, and MCP server when `DATABASE_URL` is configured. The store is
owner-only and has no public read API.

## Data boundary

The `iswebmcp_url_attempts` table stores:

- attempted and completed timestamps;
- the entry surface: `web`, `integration`, or `mcp`;
- a normalized public URL containing only origin and path;
- hostname and whether a query or fragment was removed;
- completion outcome, safe error code, response status, and report ID.

It never stores URL credentials, query strings, fragments, optional goals,
fetched markup, IP addresses, or user agents. Malformed, private, local, and
credential-bearing inputs create a row with a null URL so the rejected attempt
can be counted without retaining its submitted value. Paths can still contain
sensitive text, so the UI and integration documentation continue to warn users
not to submit secret-bearing URLs.

Rows older than 90 days are deleted during later writes. Database failures are
reported to server logs without including the submitted URL and fail open so an
analytics outage cannot turn a valid scan into a product outage.

## Provisioning and verification

The production deployment uses a Vercel Marketplace Neon Postgres resource in
the same region as the default Vercel Functions deployment. Vercel injects the
pooled `DATABASE_URL`; never commit or print that value. The application creates
the bounded table and indexes on the first recorded attempt.

After connecting storage and deploying:

1. Confirm `/api/health` reports `urlAttemptStorage: "configured"`.
2. Run one controlled scan against `https://iswebmcp.com/`.
3. In the Neon SQL editor, verify the latest row without exposing credentials:

   ```sql
   SELECT attempted_at, surface, safe_url, outcome, response_status
   FROM iswebmcp_url_attempts
   ORDER BY attempted_at DESC
   LIMIT 10;
   ```

4. Verify redaction with a URL containing a harmless test query and confirm the
   stored `safe_url` has no query or fragment and `query_redacted` is true.

Aggregate product discovery without exporting individual URLs:

```sql
SELECT hostname, count(*) AS attempts,
       count(*) FILTER (WHERE outcome = 'succeeded') AS succeeded
FROM iswebmcp_url_attempts
WHERE attempted_at >= now() - interval '30 days'
GROUP BY hostname
ORDER BY attempts DESC
LIMIT 100;
```
