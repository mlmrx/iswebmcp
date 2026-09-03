# ChatGPT connector review checklist

- [ ] Production URL is exactly `https://iswebmcp.com/mcp` and supports MCP initialize, tools/list, tools/call, and resources/read.
- [ ] Tool titles, descriptions, schemas, annotations, and read-only/open-world flags match actual behavior.
- [ ] The widget loads from the declared `ui://` resource and renders only tool output.
- [ ] CSP and widget domain metadata are minimal and accurate.
- [ ] Privacy and support URLs are public, stable, and accurate.
- [ ] `OWNER_INPUT_REQUIRED` is replaced with a monitored owner contact.
- [ ] Every prompt in `test-prompts.md` is recorded against the production connector.
- [ ] Source failures and truncation are not scored as website failures.
- [ ] Runtime conformance is not claimed from source evidence.
- [ ] Lift is not claimed without paired before/after measurement.
- [ ] The connector is submitted only from the production owner account.
