# isWebMCP Chrome extension

Manifest V3 side-panel extension that audits the active public page without injecting scripts into it.

## Load locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Open a public web page and click the isWebMCP toolbar icon.

The extension requests only temporary `activeTab` access, the `sidePanel` capability, and access to the isWebMCP API origin. It does not inject code into the page, request browsing history, or request all-sites access. The selected URL and optional goal are sent to `https://iswebmcp.com/api/integrations/scan`, which fetches a bounded public-source snapshot.

Do not audit private, authenticated, local-network, or secret-bearing URLs. See `PRIVACY.md` and <https://iswebmcp.com/methodology>.
