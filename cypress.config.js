/* global process */

import { defineConfig } from "cypress";
import fs from "fs";
import path from "path";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
    screenshotsFolder: "public/tempScreenshots",
    videosFolder: "cypress/videos",
    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(on) {
      on("after:screenshot", (details) => {
        const fileName = path.basename(details.path);

        if (!fileName.startsWith("pom-")) {
          return null;
        }

        const targetPath = path.join(
          process.cwd(),
          "public",
          "tempScreenshots",
          fileName
        );

        if (details.path !== targetPath) {
          fs.mkdirSync(path.dirname(targetPath), { recursive: true });
          fs.copyFileSync(details.path, targetPath);
        }

        return {
          path: targetPath,
        };
      });
    },
  },
});