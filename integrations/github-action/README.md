# GitHub Actions adapter

Run the shared developer toolkit against a **public, unauthenticated deployment**. The hosted scanner cannot reach local, private, or authenticated preview environments. Requires Node.js 22.13+ and checkout of your repository before this action. For a direct CI command, pin and install [`@iswebmcp/developer-kit`](https://www.npmjs.com/package/@iswebmcp/developer-kit). To use the composite action below, download the developer tools ZIP from [isWebMCP](https://iswebmcp.com/developers), inspect its source, and copy both `integrations/developer-kit` and `integrations/github-action` into your repository, preserving their relative paths. Commit the reviewed source with your application.

```yaml
permissions:
  contents: read
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: '22'
  - uses: ./integrations/github-action
    with:
      url: https://your-public-app.example
      # Add after reviewing and saving your first complete source summary:
      # baseline: checks/baseline.json
  - uses: actions/upload-artifact@v4
    if: always()
    with:
      name: iswebmcp-evidence
      path: |
        iswebmcp-current.json
        iswebmcp-comparison.json
      if-no-files-found: ignore
```

Replace the example domain. Pin external actions to reviewed commit SHAs in production. This adapter uses your committed local copy; cloning the public upstream repository is not required. The local adapter and sibling SDK must both be present after checkout. To test from this repository, use the same local action path.

The action writes source summary JSON, and optionally compares a baseline. Exit 0 means a complete scan or no newly failing/worsened findings in a comparable summary; 1 means a source-finding regression; 2 means the check could not produce comparable evidence. It does not certify runtime success or calculate measured agent lift. Existing failures remain visible even when there is no regression. The summary includes the complete finding inventory returned for one bounded source scan, not a full application test.

Keep baseline, current, and comparison paths distinct. Review baseline changes in pull requests. Query strings are removed before scanning; do not send credentials or private paths. Scan reports are ephemeral on the hosted service, so retain the generated JSON as your own CI artifact. Use retention settings appropriate to the URLs and findings in those artifacts.

This adapter performs one scan per invocation, subject to the shared API's rate and concurrency limits. There are no automatic retries, scheduled scans, PR comments, or permission changes. A production monitoring service/SLA and a connected-browser runtime adapter are future work.
