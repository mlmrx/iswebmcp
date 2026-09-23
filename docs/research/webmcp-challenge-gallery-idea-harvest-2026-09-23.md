# WebMCP Challenge gallery idea harvest

Date: 2026-09-23
Scope: public Devpost gallery and publicly linked demo deployments
Published surface: `/learn/webmcp-challenge-gallery-idea-harvest-2026`

## Executive summary

The WebMCP Challenge project gallery was publicly readable during this collection. A complete page pass covered 104 gallery pages and 2,474 project cards. The gallery is a discovery surface, not a ranking or proof of working WebMCP implementations.

The strongest recurring product patterns were:

- shared state between a person and an agent;
- evidence, provenance, and reversible edits;
- staged consequential actions with human approval;
- private or local-first agent workspaces;
- cooperative experiences where the person and agent have intentionally different visibility.

## Collection method

1. Fetched the public project gallery pages 1 through 104.
2. Extracted project card titles and taglines for clustering.
3. Followed the first page's public project links and selected linked demo deployments.
4. Ran `node integrations/developer-kit/bin/iswebmcp.mjs scan <public-demo-url> --output <report>.json --json` for 16 representative demos.
5. Kept the scan results as source-only evidence. No JavaScript execution, sign-in, tool invocation, outreach, or project modification was performed.

## Gallery snapshot

| Observation                           |          Value |
| ------------------------------------- | -------------: |
| Gallery pages fetched                 |            104 |
| Project cards observed                |          2,474 |
| Page fetch failures                   |              0 |
| First-page cards                      |             24 |
| Demo URLs scanned                     |             16 |
| Scan collection status                |    16 complete |
| Total bytes analyzed                  |        367,747 |
| Source-actionability range            |          20–85 |
| Sample average                        |           48.0 |
| Runtime labels                        |     16 unknown |
| WebMCP source hints                   |      2 partial |
| Accessible-name issues                | 3 partial/fail |
| State verification not source-visible |              2 |

Keyword counts are descriptive signals from card titles and taglines, not normalized categories: evidence 179, workspace 175, design 131, shop 128, game 108, code 92, 3D 85, research 76, music 29, travel 28, paper 27, health 24, privacy 23, audio 21, infrastructure 21, and memory 32.

## Scan manifest

| Project              | Public demo scanned                                 | Score | Interval |   Bytes | Report ID           |
| -------------------- | --------------------------------------------------- | ----: | -------: | ------: | ------------------- |
| Bankgraph            | https://bankgraph.app/                              |    77 |    77–77 | 109,653 | `scan_b04affca175a` |
| Beat.Z               | https://beat-z.jbm111.chatgpt.site/                 |    73 |    73–73 |  18,554 | `scan_da15b464bae0` |
| BioFold              | https://biofold-orpin.vercel.app/                   |    27 |    16–56 |   3,175 | `scan_b432acb56cd0` |
| Clunk                | https://clunk.games/webmcp                          |    67 |    57–71 |  71,884 | `scan_5747ed873b5d` |
| Conspiracy           | https://conspiracy.alirezaafshan.com/               |    62 |    62–62 |  37,448 | `scan_9c30432a4e14` |
| CROSSTALK            | https://morcoan.github.io/crosstalk/                |    20 |    12–52 |   1,321 | `scan_d00073331bdb` |
| Front Desk           | https://clarks-creek-plumbing.netlify.app/dispatch/ |    45 |    45–45 |  10,837 | `scan_82b13221d670` |
| Healthy WMCP         | https://healthy-record-webmcp.netlify.app/          |    20 |    12–52 |   2,000 | `scan_92e55ba1fde8` |
| Jazzboard            | https://www.jazzboard.xyz/                          |    77 |    77–77 |  38,224 | `scan_23f27f6c3c16` |
| ORPHEUS              | https://orpheus-mcduff.vercel.app/                  |    20 |    12–52 |  11,965 | `scan_5a9381b23383` |
| PaleoScope           | https://paleoscope.aguvener.workers.dev/            |    82 |    82–82 |  16,251 | `scan_c7b6fc2ab105` |
| PantryOS             | https://pantryos.pressplay-subai.workers.dev/       |    20 |    12–52 |     945 | `scan_a6904cacf49e` |
| PaperPilot           | https://patrickjcraig.github.io/PaperPilot/webmcp/  |    85 |    85–85 |  31,113 | `scan_bcad04e3bb0d` |
| Synspace             | https://synspace-beta.vercel.app/                   |    20 |    12–52 |   1,558 | `scan_c3fb7d9596dc` |
| TripRescue           | https://triprescue.slate-app.online/                |    53 |    35–69 |  11,454 | `scan_b9ea4ee58468` |
| WebMCP Design Studio | https://studio.aitherium.com/                       |    20 |    12–52 |   1,365 | `scan_9e510ecc0013` |

## Interesting ideas

### Shared object, not generic automation

PaperPilot, Synspace, Jazzboard, Bankgraph, and PaleoScope all make a shared object legible: a paper, world, canvas, research board, or named analysis. This is a stronger design primitive than exposing a page's buttons one by one.

### Approval as a first-class state transition

TripRescue, Front Desk, AutoShop, leadmcp, Restock Room, Ladder, Ceiling, and Moirae Console point toward the same reusable pattern: inspect, stage, narrow, confirm, commit, and verify. The approval boundary should be represented in the tool contract and the visible UI.

### Evidence desks

Conspiracy, PaperPilot, Bankgraph, DeepTrail, and PaperSpace suggest a family of evidence-first products. The agent can organize, compare, and propose, but the person can still inspect the source and distinguish document evidence from interpretation.

### Asymmetric human-agent games

CROSSTALK, ORPHEUS, HALCYON, and MCPencil make the visibility boundary itself the mechanic. A person supplies perception or judgment while the agent supplies structured recall or action. This is a compelling teaching format for why tool boundaries matter.

### Local-first agent surfaces

Keydler, Dabble Me, S.O.L.V.E.R., Beat.Z, and PantryOS point to private browser-local workflows. The opportunity is not simply privacy marketing; it is narrower authority, less data movement, and a clearer explanation of what the page gives the agent.

## Evidence interpretation

The 16 scans are complete source observations, not runtime tests. The scanner did not execute JavaScript, sign in, invoke WebMCP tools, or measure a before/after journey. Every runtime label was `unknown`, and lift was withheld. A low score can reflect an intentionally client-rendered shell rather than a poor product; a high score does not establish runtime conformance.

The report is therefore useful for finding follow-up questions:

- Does the linked demo register the claimed tools in the supported browser or agent?
- Does a tool change the same visible state the person sees?
- Are input schemas narrow, named, and safe for the consequence of the action?
- Is there a deterministic postcondition, receipt, undo path, or stale-state check?
- Can the person tell what the agent observed, proposed, changed, and could not know?

## Recommended platform extension

Build a reviewed “gallery to proof” lane in isWebMCP:

1. Import a public project or gallery URL.
2. Preserve the participant-authored claim and linked demo separately.
3. Run a bounded source scan and attach its report ID.
4. Show claim, observed source, runtime unknowns, and next verification step side by side.
5. Cluster projects by shared object and approval boundary.

This would create a useful research notebook without ranking participants, scraping private data, bulk-contacting owners, or converting a public description into an endorsement.

## Sources

- [WebMCP Challenge project gallery](https://webmcp.devpost.com/project-gallery)
- [Synspace](https://devpost.com/software/synspace)
- [PaperPilot](https://devpost.com/software/paperpilot-kjglan)
- [PaleoScope](https://devpost.com/software/paleoscope)
- [Bankgraph](https://devpost.com/software/bankgraph)
- [TripRescue](https://devpost.com/software/webmcp)
- [Front Desk](https://devpost.com/software/front-desk-xyo91i)
- [CROSSTALK](https://devpost.com/software/crosstalk-sklh3x)
- [ORPHEUS](https://devpost.com/software/orpheus-a-mystery-neither-can-solve-alone)
- [isWebMCP methodology](https://iswebmcp.com/methodology)
