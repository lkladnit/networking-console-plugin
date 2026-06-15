# nmstate-console-plugin E2E Test Migration Guide

## Context

This guide describes how to migrate nmstate UI E2E tests from `kubevirt-ui` (internal GitLab) to `openshift/nmstate-console-plugin` (GitHub), following the same proven process used for networking-console-plugin.

**Jira Epic:** [CNV-87983](https://redhat.atlassian.net/browse/CNV-87983)

## Source Files

- **Primary source:** `kubevirt-ui` branch `release-4.21` at `cypress/tests/tier2/networking/nnc.cy.ts` (174 lines) — already Cypress
- **Reference:** `kubevirt-ui` branch `main` at `playwright/tests/tier2/networking/nnc-p.spec.ts` (432 lines) — Playwright, more complete
- The Cypress tests were removed from `main`; only Playwright remains there

## Tests to Migrate (nmstate-console-plugin owned)

From `nnc-p.spec.ts` / `nnc.cy.ts`:
- NNC topology view (CNV-11524)
- Bridge on NNS (CNV-10366)
- Create NNCP from form (CNV-11890)
- Create NNCP with YAML (CNV-11891)
- NNCP nodes summary (CNV-11892)
- NNCP page controls (CNV-11893)
- Edit NNCP modal (CNV-11894)
- Define OVS SLB for NNCP (CNV-13742)
- Delete NNCP (CNV-11895)
- Create Physical network (CNV-15220)
- Create Virtual machine network for project (CNV-13432)
- Create Virtual machine network for label (CNV-13433)
- Edit projects mapping (CNV-13434)
- Delete Virtual machine network (CNV-13436)

## Architecture (proven pattern)

```
nmstate-console-plugin/
  .env                          # Cluster credentials (gitignored)
  .env.example                  # Template
  cleanup.sh                    # Delete test resources (sourced by test-cypress.sh)
  setup.sh                      # Create test namespaces (sourced by test-cypress.sh)
  test-cypress.sh               # Main runner: cleanup -> setup -> cypress run -> report -> cleanup on success
  research-flakiness.sh         # 10x stability testing
  cypress/
    cypress.config.js           # testIsolation: false, pageLoadTimeout: 120000
    plugins/index.ts            # dotenv loader + env mapping
    reporter-config.json        # mochawesome HTML + JUnit
    support/
      index.ts                  # Imports all support files + HIDE_XHR + uncaught exception handler
      login.ts                  # cy.login() with cy.origin() for OAuth cross-origin + IDP handling
      selectors.ts              # cy.byTestID(), cy.byButtonText(), cy.checkTitle(), cy.clickNavLink()
      commands.ts               # cy.deleteResource(), cy.switchProject()
      nav.ts                    # cy.visitNNCP(), cy.visitNNS(), etc. (URL-based navigation)
    tests/
      all.cy.ts                 # Ordered imports: login -> visit-pages -> specs
      setup/login.cy.ts         # Login test (runs first)
      setup/visit-pages.cy.ts   # Navigate all pages via sidebar clicks
      nmstate/*.cy.ts           # Actual test specs
    utils/const/base.ts         # TEST_NS, adminOnlyDescribe, MINUTE, SECOND
    views/*.ts                  # View helpers (createNNCP, deleteNNCP, etc.)
```

## Key Lessons Learned

1. **Use URL-based navigation** (`cy.visit('/k8s/ns/...')`) not sidebar clicks for test reliability. Sidebar clicks are only for the `visit-pages.cy.ts` smoke test.

2. **Cleanup via shell script, not Cypress `before()` hooks.** The `cleanup.sh` runs via `oc` before Cypress starts. In-test `cy.exec('oc delete...')` failed silently when `oc` session expired.

3. **Login requires `cy.origin()`** for Cypress 15+ because OAuth is on a different subdomain (`oauth-openshift.*` vs `console-openshift-console.*`). Handle both direct login and IDP selection page.

4. **`testIsolation: false`** is required for ordered test execution via `all.cy.ts` imports. Login state persists across tests.

5. **No anti-flakiness workarounds needed** for form interactions. Simple `cy.get(selector).clear().type(value)` works when cluster state is clean. Flakiness was 100% caused by stale resources from prior failed runs.

6. **`pageLoadTimeout: 120000`** — clusters can be slow; 60s is not enough.

7. **The `dotenv` package** loads `.env` from the repo root in `plugins/index.ts`. Cypress 15 also natively reads `.env` but the plugin approach gives more control.

8. **Tests run in order** via `all.cy.ts` importing specs sequentially. This allows tests to depend on prior state.

9. **Always verify `oc` is logged into the correct cluster** before running. The cleanup/setup use `oc` and will fail silently if the session expired.

10. **The `research-flakiness.sh` script** runs 10 iterations and captures failures with screenshots/video/logs — useful for proving stability.

## Steps to Implement

1. Create `cypress/` folder in nmstate-console-plugin with the same support structure (copy from networking-console-plugin, adjust nav commands)
2. Copy `cleanup.sh`, `setup.sh`, `test-cypress.sh`, `.env.example` from networking-console-plugin
3. Adapt `cleanup.sh` to delete nmstate resources (NNCPs, physical networks, VM networks)
4. Create view helpers for nmstate pages (similar to `views/nad.ts`)
5. Translate specs from `kubevirt-ui/cypress/tests/tier2/networking/nnc.cy.ts` (release-4.21)
6. Cross-reference with `kubevirt-ui/playwright/tests/tier2/networking/nnc-p.spec.ts` (main) for any newer logic
7. Run `research-flakiness.sh` to verify stability

## Reference Implementation

The full working implementation is at: `openshift/networking-console-plugin` branch `qe-ui` (fork: `lkladnit/networking-console-plugin`)
