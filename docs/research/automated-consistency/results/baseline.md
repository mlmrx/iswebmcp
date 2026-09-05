# Automated consistency pilot: observed results

Protocol: synthetic-consistency-v1. 15 passed, 7 failed across 22 purposively authored pairs.

These counts describe only this internal synthetic suite, not a population error rate or agent-performance result.

| Family               | Passed | Failed | Total |
| -------------------- | -----: | -----: | ----: |
| inert-markup         |      2 |      4 |     6 |
| duplication          |      3 |      0 |     3 |
| representation       |      3 |      1 |     4 |
| naming               |      2 |      2 |     4 |
| intended-sensitivity |      2 |      0 |     2 |
| evidence-boundary    |      3 |      0 |     3 |

| Case                         | Relation               | Result |
| ---------------------------- | ---------------------- | ------ |
| comment-controls             | same-assessment        | pass   |
| comment-script-hint          | same-assessment        | fail   |
| template-script-hint         | same-assessment        | fail   |
| escaped-code-example         | same-assessment        | pass   |
| comment-structured-data      | same-assessment        | fail   |
| comment-page-title           | same-assessment        | fail   |
| duplicate-action-control     | same-score-and-actions | pass   |
| duplicate-status-region      | same-score-and-actions | pass   |
| duplicate-structured-data    | same-score-and-actions | pass   |
| attribute-order              | same-assessment        | pass   |
| html-tag-case                | same-assessment        | fail   |
| independent-control-order    | same-assessment        | pass   |
| numeric-label-entity         | same-assessment        | pass   |
| remove-label                 | field-name-decrease    | pass   |
| restore-label                | field-name-increase    | pass   |
| empty-label                  | field-name-decrease    | fail   |
| dangling-labelledby          | field-name-decrease    | fail   |
| add-live-region              | feedback-increase      | pass   |
| add-inline-registration-hint | hint-only              | pass   |
| bounded-source-window        | truncated-uncertainty  | pass   |
| requested-goal-not-source    | goal-not-source        | pass   |
| http-entry-hop               | transport-decrease     | pass   |

All before/after inputs, hashes, projections, and check outcomes are retained in the neighboring JSON artifact. Failures were not removed or reclassified.

Do not overwrite this result after a scanner fix. Run a new named artifact and describe the change separately.
