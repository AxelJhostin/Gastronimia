import { defineConfig } from "cypress";
import { mkdirSync, writeFileSync } from "node:fs";

import {
  seedBaseScenario,
  seedPendingReturnScenario,
  seedIndividualLoanScenario,
} from "./cypress/tasks/seed";

export default defineConfig({
  allowCypressEnv: false,
  expose: {
    supabasePublishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    supabaseUrl: process.env.SUPABASE_URL ?? "http://127.0.0.1:54321",
  },
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://127.0.0.1:3000",
    setupNodeEvents(on, config) {
      for (const value of [config.baseUrl, process.env.TEST_API_BASE_URL ?? "http://127.0.0.1:8000", process.env.SUPABASE_URL ?? "http://127.0.0.1:54321"]) {
        if (!value || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname)) {
          throw new Error("QA solo admite servicios locales.");
        }
      }
      on("after:run", (results) => {
        if (!("runs" in results)) return;
        mkdirSync("cypress/results", { recursive: true });
        const report = {
          startedAt: results.startedTestsAt,
          endedAt: results.endedTestsAt,
          browser: results.browserName,
          browserVersion: results.browserVersion,
          total: results.totalTests,
          passed: results.totalPassed,
          failed: results.totalFailed,
          pending: results.totalPending,
          skipped: results.totalSkipped,
          runs: results.runs.map((run) => ({
            spec: run.spec.relative,
            tests: run.tests.map((test) => ({
              title: test.title.join(" > "),
              state: test.state,
              error: test.displayError,
            })),
          })),
        };
        writeFileSync(`cypress/results/qa-${results.startedTestsAt.replaceAll(/[:.]/g, "-")}.json`, JSON.stringify(report, null, 2));
      });
      on("task", {
        "seed:base": seedBaseScenario,
        "seed:pending-return": seedPendingReturnScenario,
        "seed:individual-loan": seedIndividualLoanScenario,
      });
      return config;
    },
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
  },
  retries: {
    openMode: 0,
    runMode: 1,
  },
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: false,
  video: true,
  viewportHeight: 900,
  viewportWidth: 1440,
});
