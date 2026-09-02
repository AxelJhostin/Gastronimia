import { defineConfig } from "cypress";

import {
  seedBaseScenario,
  seedPendingReturnScenario,
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
      on("task", {
        "seed:base": seedBaseScenario,
        "seed:pending-return": seedPendingReturnScenario,
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
  video: true,
  viewportHeight: 900,
  viewportWidth: 1440,
});
