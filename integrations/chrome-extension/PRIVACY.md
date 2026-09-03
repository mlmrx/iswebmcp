# Privacy disclosure

The isWebMCP Chrome extension reads the URL and title of the active tab after you invoke it. When you choose **Audit this page**, it sends the URL and optional goal text to `https://iswebmcp.com/api/integrations/scan`. The service fetches the public page and returns an ephemeral evidence-scoped report.

The extension does not inject scripts into the page, read page form values, or inspect browsing history. The service retains the normalized public origin and path plus the audit outcome for 90 days. URL credentials, query strings, fragments, optional goals, fetched markup, IP addresses, and user agents are not stored in the URL-attempt analytics table. Malformed or unsafe inputs are counted without retaining the submitted value. Hosting and security infrastructure may separately process ordinary request metadata. Do not submit private, authenticated, local-network, or secret-bearing URLs.

Public privacy policy: <https://iswebmcp.com/privacy>
